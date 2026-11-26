import { expect, type Page, test } from "@playwright/test";
import { replaceInEditor, scriptHeader, waitForEditorText } from "./editor";
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

const scriptStatus = (page: Page) => scriptHeader(page).status;

const DEPENDENCY_LINE = 'basic-wallet = { path = "../basic-wallet" }';

// A Counter Contract script from the API, on its page.
const createScript = async (page: Page, name: string) => {
  await page.goto("/scripts");
  await page.getByRole("button", { name: "Create new script" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create Script" });
  await dialog.getByLabel("Name").fill(name);
  await selectOption(page, "Type", "Account Component");
  await selectOption(page, "Example", "Counter Contract");
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/);
};

test("script: the Explorer's files and tabs", async ({ page }) => {
  logBrowserErrors(page);
  const { file, files, tabs, tab, close } = explorer(page);

  await test.step("a built-in script has its MASM source only", async () => {
    await page.goto("/scripts/auth-no-auth");
    await waitForEditorText(page, "pub proc auth_no_auth(");
    await expect(files).toHaveText(["auth_no_auth.masm"]);
    await expect(tabs).toHaveText(["auth_no_auth.masm"]);
    // No MASM tab: the source is the MASM.
    await expect(
      page.getByRole("tab", { name: "MASM", exact: true }),
    ).toHaveCount(0);
  });

  await test.step("a script from the API has its manifest", async () => {
    await createScript(page, "explorer-check");
    await expect(files).toHaveText([
      "explorer_check.masm",
      "miden-project.toml",
    ]);
    // Only the source opens.
    await expect(tabs).toHaveText(["explorer_check.masm"]);
  });

  await test.step("open and close the manifest", async () => {
    await file("miden-project.toml").click();
    await expect(tabs).toHaveText([
      "explorer_check.masm",
      "miden-project.toml",
    ]);
    await expect(tab("miden-project.toml")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitForEditorText(page, 'path = "explorer_check.masm"');
    // Read-only: the API generates it.
    expect(await readOnly(page, 'path = "explorer_check.masm"')).toBe(true);
    await close("miden-project.toml").click();
    await expect(tabs).toHaveText(["explorer_check.masm"]);
    await expect(tab("explorer_check.masm")).toHaveAttribute(
      "aria-selected",
      "true",
    );
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

  await test.step("a compile from the manifest's tab regenerates it", async () => {
    await close("explorer_check.masm").click();
    await expect(tabs).toHaveText(["miden-project.toml"]);
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(scriptStatus(page)).toHaveText("Compiled", {
      timeout: TRANSACTION_TIMEOUT,
    });
    // The compile regenerated miden-project.toml, dependency included.
    await waitForEditorText(page, DEPENDENCY_LINE);
  });
});

test("script: a console link reopens the source", async ({ page }) => {
  logBrowserErrors(page);
  const { tabs, tab, close } = explorer(page);
  await createScript(page, "explorer-link");
  await replaceInEditor(
    page,
    "pub proc get_count() -> felt\n",
    "pub proc get_count() -> felt\n    bogus_instruction\n",
  );
  await close("explorer_link.masm").click();
  await expect(tabs).toHaveCount(0);
  await page.getByRole("button", { name: "Compile" }).click();
  const location = page.getByRole("button", {
    name: /explorer_link\.masm:\d+:\d+$/,
  });
  await expect(location).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  const errorLine = Number(
    (await location.textContent())?.match(/:(\d+):/)?.[1] ?? 0,
  );
  await location.click();
  await expect(tabs).toHaveText(["explorer_link.masm"]);
  await expect(tab("explorer_link.masm")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect.poll(() => cursorLine(page)).toBe(errorLine);
});
