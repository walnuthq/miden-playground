import { expect, type Page, test } from "@playwright/test";
import { COMPILED, waitForEditorText } from "./editor";
import { launchExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

const consoleHeight = async (page: Page) =>
  (await page.getByRole("region", { name: "Editor Console" }).boundingBox())
    ?.height ?? 0;

// The collapsed console: its header bar only.
const COLLAPSED_HEIGHT = 52;

const rustCode = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as {
        monaco: {
          editor: { getEditors: () => { getValue: () => string }[] };
        };
      }
    ).monaco.editor
      .getEditors()[0]
      ?.getValue(),
  );

test("script: keyboard shortcuts", async ({ page }) => {
  logBrowserErrors(page);
  page.on("download", () => {
    throw new Error("the browser saved the page");
  });
  const compiled = page.getByText(COMPILED);

  await test.step("open the counter account script", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await page.getByRole("link", { name: "counter-account" }).click();
    await waitForEditorText(page, "fn get_count(&self) -> Felt {");
  });

  await test.step("Cmd/Ctrl+S in the editor compiles", async () => {
    const code = await rustCode(page);
    await page.getByRole("tabpanel").locator(".view-lines").click();
    await page.keyboard.press("ControlOrMeta+s");
    await expect(compiled).toHaveCount(1, { timeout: TRANSACTION_TIMEOUT });
    // Monaco's own bindings never ran.
    await page.keyboard.press("ControlOrMeta+Enter");
    await expect(compiled).toHaveCount(2, { timeout: TRANSACTION_TIMEOUT });
    expect(await rustCode(page)).toBe(code);
  });

  await test.step("Cmd/Ctrl+Enter compiles from another tab", async () => {
    await page.getByRole("tab", { name: "Manifest" }).click();
    await page.keyboard.press("ControlOrMeta+Enter");
    await expect(compiled).toHaveCount(3, { timeout: TRANSACTION_TIMEOUT });
  });

  await test.step("Cmd/Ctrl+J toggles the console", async () => {
    await page.keyboard.press("ControlOrMeta+j");
    await expect.poll(() => consoleHeight(page)).toBeLessThan(COLLAPSED_HEIGHT);
    await page.keyboard.press("ControlOrMeta+j");
    await expect.poll(() => consoleHeight(page)).toBeGreaterThan(100);
    // A maximized console hides.
    await page.getByRole("button", { name: "Maximize console" }).click();
    await expect(
      page.getByRole("button", { name: "Restore editor" }),
    ).toBeVisible();
    await page.keyboard.press("ControlOrMeta+j");
    await expect.poll(() => consoleHeight(page)).toBeLessThan(COLLAPSED_HEIGHT);
    await expect(
      page.getByRole("button", { name: "Maximize console" }),
    ).toBeVisible();
  });

  await test.step("Cmd/Ctrl+L clears the console", async () => {
    await page.keyboard.press("ControlOrMeta+j");
    await page.keyboard.press("ControlOrMeta+l");
    await expect(compiled).toHaveCount(0);
    await expect(
      page.getByText("Compile the script to see its output here."),
    ).toBeVisible();
  });

  await test.step("a read-only script has no shortcuts", async () => {
    await page.goto("/scripts/basic-wallet");
    await waitForEditorText(page, "fn ");
    await page.getByRole("tabpanel").locator(".view-lines").click();
    await page.keyboard.press("ControlOrMeta+s");
    await expect(
      page.getByRole("region", { name: "Editor Console" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Compile" })).toHaveCount(0);
  });
});
