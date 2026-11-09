import { expect, type Page, test } from "@playwright/test";
import { replaceInEditor, waitForEditorText } from "./editor";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

const explorer = (page: Page) => {
  const files = page.getByRole("navigation", { name: "Files" });
  const tabs = page.getByRole("tablist", { name: "Open files" });
  return {
    file: (name: string) => files.getByRole("button", { name, exact: true }),
    files: files.getByRole("button"),
    tabs: tabs.getByRole("tab"),
    tab: (name: string) => tabs.getByRole("tab", { name, exact: true }),
    close: (path: string) =>
      tabs.getByRole("button", { name: `Close ${path}` }),
  };
};

// The line of the cursor in the source's editor (the first one created).
const cursorLine = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          monaco: {
            editor: {
              getEditors: () => {
                getPosition: () => { lineNumber: number } | null;
              }[];
            };
          };
        }
      ).monaco.editor
        .getEditors()[0]
        ?.getPosition()?.lineNumber,
  );

// Whether the editor showing `text` is read-only.
const readOnly = (page: Page, text: string) =>
  page.evaluate(
    (text) =>
      (
        window as unknown as {
          monaco: {
            editor: {
              getEditors: () => {
                getValue: () => string;
                getRawOptions: () => { readOnly?: boolean };
              }[];
            };
          };
        }
      ).monaco.editor
        .getEditors()
        .find((editor) => editor.getValue().includes(text))
        ?.getRawOptions().readOnly,
    text,
  );

const DEPENDENCY_LINE = 'basic-wallet = { path = "../basic-wallet" }';

test("script: the Explorer's files and tabs", async ({ page }) => {
  logBrowserErrors(page);
  const { file, files, tabs, tab, close } = explorer(page);

  await test.step("a built-in script has its source only", async () => {
    await page.goto("/scripts/auth-no-auth");
    await waitForEditorText(page, "fn auth_procedure(&mut self, _arg: Word) {");
    await expect(files).toHaveText(["src", "lib.rs"]);
    await expect(tabs).toHaveText(["lib.rs"]);
  });

  await test.step("a script from the API has its manifests", async () => {
    await page.goto("/scripts");
    await page.getByRole("button", { name: "Create new script" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await dialog.getByLabel("Name").fill("explorer-check");
    await selectOption(page, "Type", "Account Component");
    await selectOption(page, "Example", "Counter Contract");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/);
    await expect(files).toHaveText([
      "src",
      "lib.rs",
      "Cargo.toml",
      "miden-project.toml",
    ]);
    // Only the source opens.
    await expect(tabs).toHaveText(["lib.rs"]);
  });

  await test.step("open and close a manifest", async () => {
    await file("Cargo.toml").click();
    await expect(tabs).toHaveText(["lib.rs", "Cargo.toml"]);
    await expect(tab("Cargo.toml")).toHaveAttribute("aria-selected", "true");
    await waitForEditorText(page, 'crate-type = ["cdylib"]');
    // Read-only: the API generates it.
    expect(await readOnly(page, 'crate-type = ["cdylib"]')).toBe(true);
    await close("Cargo.toml").click();
    await expect(tabs).toHaveText(["lib.rs"]);
    await expect(tab("lib.rs")).toHaveAttribute("aria-selected", "true");
  });

  await test.step("a dependency shows in miden-project.toml", async () => {
    await page.getByRole("tab", { name: "Manifest" }).click();
    await page.getByRole("button", { name: "Add dependency" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Add Dependency" });
    await selectOption(page, "Dependency", "basic-wallet");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("tab", { name: "Explorer" }).click();
    await file("miden-project.toml").click();
    await waitForEditorText(page, DEPENDENCY_LINE);
  });

  let errorLine = 0;
  await test.step("a console link reopens the source", async () => {
    await replaceInEditor(
      page,
      "self.count_map.get(key)\n    }",
      "self.count_map.get(missing_key)\n    }",
    );
    await close("src/lib.rs").click();
    await expect(tabs).toHaveText(["miden-project.toml"]);
    await page.getByRole("button", { name: "Compile" }).click();
    const location = page.getByRole("button", {
      name: /^src\/lib\.rs:\d+:\d+$/,
    });
    await expect(location).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    errorLine = Number(
      (await location.textContent())?.match(/:(\d+):/)?.[1] ?? 0,
    );
    await location.click();
    await expect(tabs).toHaveText(["miden-project.toml", "lib.rs"]);
    await expect(tab("lib.rs")).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => cursorLine(page)).toBe(errorLine);
    // The compile regenerated miden-project.toml, dependency included.
    await tab("miden-project.toml").click();
    await waitForEditorText(page, DEPENDENCY_LINE);
  });
});
