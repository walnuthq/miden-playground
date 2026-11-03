import { expect, type Page, test } from "@playwright/test";
import { COMPILED, replaceInEditor, waitForEditorText } from "./editor";
import { launchExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

type Token = { offset: number; type: string };

// Real scrollbars, as on desktop browsers: headless Chromium hides them, and
// the read-only editor's widening loop needs one.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

// Monaco's tokens for each line of `text` in `language`, as `[word, type]`
// pairs (whitespace skipped).
const tokenize = (page: Page, text: string, language = "masm") =>
  page.evaluate(
    ({ text, language }) => {
      const { monaco } = window as unknown as {
        monaco: {
          editor: {
            tokenize: (text: string, language: string) => Token[][];
          };
        };
      };
      const lines = text.split("\n");
      return monaco.editor
        .tokenize(text, language)
        .map((tokens, index) =>
          tokens
            .map(({ offset, type }, i) => [
              lines[index]?.slice(offset, tokens[i + 1]?.offset).trim() ?? "",
              type,
            ])
            .filter(([word]) => word !== ""),
        );
    },
    { text, language },
  );

test("script: MASM syntax highlighting", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("open a built-in script's MASM tab", async () => {
    await page.goto("/scripts/counter-contract?tab=masm");
    await waitForEditorText(page, "pub proc increment_count()");
    const language = await page.evaluate(() =>
      (
        window as unknown as {
          monaco: {
            editor: {
              getModels: () => {
                getValue: () => string;
                getLanguageId: () => string;
              }[];
            };
          };
        }
      ).monaco.editor
        .getModels()
        .find((model) => model.getValue().includes("pub proc"))
        ?.getLanguageId(),
    );
    expect(language).toBe("masm");
  });

  await test.step("tokens", async () => {
    const tokens = await tokenize(
      page,
      [
        "#! Returns the count.",
        "@account_procedure",
        "pub proc get_count() -> felt",
        "    push.COUNTER_SLOT[0..2] exec.active_account::get_item",
        '    if.true add.0x10 else u32assert.err="not a u32" end',
        "    adv.push_mapval mem_load.4 # => [count]",
        "end",
        // The compiler's quoted names.
        'proc "intrinsics::mem::heap_base"(',
        '    exec.::"miden:counter-contract/counter-contract@0.1.0"::counter_contract::"get-count"',
      ].join("\n"),
    );
    expect(tokens).toEqual([
      [["#! Returns the count.", "comment.doc.masm"]],
      [["@account_procedure", "annotation.masm"]],
      [
        ["pub", "keyword.masm"],
        ["proc", "keyword.masm"],
        ["get_count", "variable.masm"],
        // Monaco merges neighbors of the same type.
        ["()", "delimiter.parenthesis.masm"],
        ["->", "operator.masm"],
        ["felt", "type.masm"],
      ],
      [
        ["push", "keyword.masm"],
        [".", "delimiter.masm"],
        ["COUNTER_SLOT", "constant.masm"],
        ["[", "delimiter.square.masm"],
        ["0", "number.masm"],
        ["..", "operator.masm"],
        ["2", "number.masm"],
        ["]", "delimiter.square.masm"],
        ["exec", "keyword.flow.masm"],
        [".", "delimiter.masm"],
        ["active_account::get_item", "variable.masm"],
      ],
      [
        ["if", "keyword.flow.masm"],
        [".", "delimiter.masm"],
        ["true", "constant.masm"],
        ["add", "keyword.masm"],
        [".", "delimiter.masm"],
        ["0x10", "number.hex.masm"],
        ["else", "keyword.flow.masm"],
        ["u32assert", "keyword.masm"],
        [".", "delimiter.masm"],
        ["err", "identifier.masm"],
        ["=", "operator.masm"],
        ['"not a u32"', "string.masm"],
        ["end", "keyword.masm"],
      ],
      [
        ["adv.push_mapval", "keyword.masm"],
        ["mem_load", "keyword.masm"],
        [".", "delimiter.masm"],
        ["4", "number.masm"],
        ["# => [count]", "comment.masm"],
      ],
      [["end", "keyword.masm"]],
      [
        ["proc", "keyword.masm"],
        ['"intrinsics::mem::heap_base"', "variable.masm"],
        ["(", "delimiter.parenthesis.masm"],
      ],
      [
        ["exec", "keyword.flow.masm"],
        [".", "delimiter.masm"],
        [
          '::"miden:counter-contract/counter-contract@0.1.0"::counter_contract::"get-count"',
          "variable.masm",
        ],
      ],
    ]);
  });

  await test.step("the MASM tab is colored", async () => {
    // Keywords and comments get different colors than plain text.
    const panel = page.getByRole("tabpanel");
    const color = (text: string) =>
      panel
        .locator(".view-line span span", { hasText: text })
        .first()
        .evaluate((element) => getComputedStyle(element).color);
    const proc = await color("proc");
    const name = await color("increment_count");
    const comment = await color("Returns the current count");
    expect(new Set([proc, name, comment]).size).toBe(3);
  });
});

// The MASM model's language and text, once the tab has mounted its editor.
const masmModel = (page: Page) =>
  page.evaluate(() => {
    const model = (
      window as unknown as {
        monaco: {
          editor: {
            getModels: () => {
              getValue: () => string;
              getLanguageId: () => string;
              isDisposed: () => boolean;
            }[];
          };
        };
      }
    ).monaco.editor
      .getModels()
      .find((model) => model.getLanguageId() === "masm" && !model.isDisposed());
    return model?.getValue();
  });

test("script: a compiled script's MASM", async ({ page }) => {
  logBrowserErrors(page);
  const masmTab = page.getByRole("tab", { name: "MASM" });
  const compile = async () => {
    await page.getByRole("button", { name: "Compile" }).click();
  };

  await test.step("an example's script has its MASM", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await page.getByRole("link", { name: "counter-account" }).click();
    await waitForEditorText(page, "fn get_count(&self) -> Felt {");
    await masmTab.click();
    await expect.poll(() => masmModel(page)).toContain('pub proc "get-count"(');
  });

  await test.step("typing in it doesn't widen the page", async () => {
    // Monaco's "Cannot edit in read-only editor" message brought up a
    // scrollbar, and the editor grew by its width on each key: the page's
    // flex items kept the editor's pixel width as their minimum.
    const pageWidth = () =>
      page.evaluate(() => document.documentElement.scrollWidth);
    const width = await pageWidth();
    await page
      .getByRole("tabpanel")
      .locator(".monaco-editor .view-lines")
      .click({ position: { x: 100, y: 5 } });
    await page.keyboard.type("abcdef", { delay: 100 });
    await expect(
      page.locator(".monaco-editor-overlaymessage").first(),
    ).toBeVisible();
    expect(await pageWidth()).toBe(width);
  });

  await test.step("an edit disables it, a compile brings it back", async () => {
    await page.getByRole("tab", { name: "Explorer" }).click();
    await replaceInEditor(
      page,
      "current_value + felt!(1);",
      "current_value + felt!(1234567);",
    );
    await expect(masmTab).toBeDisabled();
    await compile();
    await expect(page.getByText(COMPILED)).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await masmTab.click();
    await expect.poll(() => masmModel(page)).toContain("push.1234567");
  });

  await test.step("a failed compile has none", async () => {
    await page.getByRole("tab", { name: "Explorer" }).click();
    await replaceInEditor(page, "felt!(1234567);", "felt!(1234567;");
    await compile();
    await expect(
      page.getByRole("button", { name: /^src\/lib\.rs:\d+:\d+$/ }).first(),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await expect(masmTab).toBeDisabled();
    // Its panel, from a link, says how to get it.
    await page.goto(`${page.url()}?tab=masm`);
    await expect(
      page.getByText("Compile the script to see its Miden Assembly."),
    ).toBeVisible();
  });
});
