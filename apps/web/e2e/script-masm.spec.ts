import { expect, type Page, test } from "@playwright/test";
import { waitForEditorText } from "./editor";
import { logBrowserErrors } from "./tutorial";

type Token = { offset: number; type: string };

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
