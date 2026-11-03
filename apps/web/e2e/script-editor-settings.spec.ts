import { expect, type Page, test } from "@playwright/test";
import { waitForEditorText } from "./editor";
import { logBrowserErrors } from "./tutorial";

// The options of the first editor (the `src/lib.rs` one).
const editorOptions = (page: Page) =>
  page.evaluate(() => {
    type Editor = {
      getRawOptions: () => {
        minimap?: { enabled?: boolean };
        fontSize?: number;
      };
    };
    const editor = (
      window as unknown as {
        monaco: { editor: { getEditors: () => Editor[] } };
      }
    ).monaco.editor.getEditors()[0];
    const options = editor?.getRawOptions();
    return {
      minimap: options?.minimap?.enabled,
      fontSize: options?.fontSize,
    };
  });

const openSettings = (page: Page) =>
  page.getByRole("button", { name: "Editor settings" }).click();

test("script: editor settings (minimap, font size)", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("the minimap shows by default", async () => {
    await page.goto("/scripts/counter-contract");
    await waitForEditorText(page, "fn increment_count");
    await expect(page.locator(".minimap").first()).toBeVisible();
    expect((await editorOptions(page)).minimap).toBe(true);
  });

  await test.step("hide the minimap from the gear menu", async () => {
    await openSettings(page);
    const minimap = page.getByRole("menuitemcheckbox", { name: "Minimap" });
    await expect(minimap).toBeChecked();
    await minimap.click();
    await expect(minimap).not.toBeChecked();
    await page.keyboard.press("Escape");
    await expect
      .poll(async () => (await editorOptions(page)).minimap)
      .toBe(false);
  });

  await test.step("change the font size", async () => {
    await openSettings(page);
    await page.getByRole("menuitemradio", { name: "18 px" }).click();
    await page.keyboard.press("Escape");
    await expect
      .poll(async () => (await editorOptions(page)).fontSize)
      .toBe(18);
  });

  await test.step("kept across a reload", async () => {
    await page.reload();
    await waitForEditorText(page, "fn increment_count");
    await expect
      .poll(() => editorOptions(page))
      .toEqual({ minimap: false, fontSize: 18 });
    await openSettings(page);
    await expect(
      page.getByRole("menuitemradio", { name: "18 px" }),
    ).toBeChecked();
    await page.keyboard.press("Escape");
  });

  // Also in the right-click menu, whose items need the pointer moved onto them
  // before the press, which Playwright's click doesn't do: run the action from
  // the command palette.
  await test.step("toggle the minimap from the command palette", async () => {
    await page.locator(".monaco-editor .view-lines").first().click();
    await page.keyboard.press("F1");
    await page.keyboard.type("Toggle Minimap");
    await page.keyboard.press("Enter");
    await expect
      .poll(async () => (await editorOptions(page)).minimap)
      .toBe(true);
  });
});
