import { expect, type Page, test } from "@playwright/test";
import { createCounterScript, waitForEditorText } from "./editor";
import { logBrowserErrors } from "./tutorial";

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

// The language of the model holding `text`.
const sourceLanguage = (page: Page, text: string) =>
  page.evaluate(
    (text) =>
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
        .find((model) => model.getValue().includes(text))
        ?.getLanguageId(),
    text,
  );

test("script: MASM syntax highlighting", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("a built-in script's source is MASM", async () => {
    await page.goto("/scripts/auth-no-auth");
    await waitForEditorText(page, "pub proc auth_no_auth(");
    expect(await sourceLanguage(page, "pub proc auth_no_auth(")).toBe("masm");
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

  await test.step("the source is colored", async () => {
    // Keywords, names and comments each get their own color. Monaco can
    // render a line before tokenizing it (one color for the whole line), so
    // poll until the colors show. The words are ones no earlier line has, a
    // comment's included ("proc" is in "procedure"): `color` reads the first.
    const panel = page.getByRole("tabpanel");
    const color = (text: string) =>
      panel
        .locator(".view-line span span", { hasText: text })
        .first()
        .evaluate((element) => getComputedStyle(element).color);
    await expect
      .poll(async () => {
        const keyword = await color("dropw");
        const name = await color("auth_no_auth");
        const comment = await color("Pay the transaction fee");
        return new Set([keyword, name, comment]).size;
      })
      .toBe(3);
  });
});

test("script: a script's source is MASM", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("typing in a read-only source doesn't widen the page", async () => {
    // Monaco's "Cannot edit in read-only editor" message brought up a
    // scrollbar, and the editor grew by its width on each key: the page's
    // flex items kept the editor's pixel width as their minimum.
    await page.goto("/scripts/auth-no-auth");
    await waitForEditorText(page, "pub proc auth_no_auth(");
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
    // Not exact: a page scrollbar can make it narrower.
    expect(await pageWidth()).toBeLessThanOrEqual(width);
  });

  await test.step("a user's script is edited as MASM", async () => {
    await createCounterScript(page);
    expect(await sourceLanguage(page, "pub proc get_count() -> felt")).toBe(
      "masm",
    );
  });

  await test.step("a link to the retired MASM tab opens the source", async () => {
    await page.goto(`${page.url()}?tab=masm`);
    await expect(page.getByRole("tab", { name: "Explorer" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("tab", { name: "MASM", exact: true }),
    ).toHaveCount(0);
    await waitForEditorText(page, "pub proc get_count() -> felt");
  });
});
