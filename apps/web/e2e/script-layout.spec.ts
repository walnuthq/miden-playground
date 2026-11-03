import { expect, type Page, test } from "@playwright/test";
import { COMPILED, replaceInEditor, waitForEditorText } from "./editor";
import { launchExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

// The Rust editor's height on screen, a few px while the console is maximized
// (Monaco keeps a minimum height).
const editorHeight = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          monaco: {
            editor: {
              getEditors: () => {
                getDomNode: () => HTMLElement | null;
              }[];
            };
          };
        }
      ).monaco.editor
        .getEditors()[0]
        ?.getDomNode()
        ?.getBoundingClientRect().height ?? 0,
  );

const consoleHeight = async (page: Page) =>
  (await page.getByRole("region", { name: "Editor Console" }).boundingBox())
    ?.height ?? 0;

// The collapsed console: its header bar only.
const COLLAPSED_HEIGHT = 52;

test("script: editor and console layout", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("open the counter account script", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await page.getByRole("link", { name: "counter-account" }).click();
    await waitForEditorText(page, "fn get_count(&self) -> Felt {");
  });

  await test.step("the page fills the viewport", async () => {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight,
      ),
    ).toBe(true);
    expect(await editorHeight(page)).toBeGreaterThan(200);
    expect(await consoleHeight(page)).toBeGreaterThan(COLLAPSED_HEIGHT);
  });

  await test.step("minimize, then compile opens the console", async () => {
    await page.getByRole("button", { name: "Minimize console" }).click();
    await expect.poll(() => consoleHeight(page)).toBeLessThan(COLLAPSED_HEIGHT);
    await page.getByRole("button", { name: "Compile" }).click();
    await expect.poll(() => consoleHeight(page)).toBeGreaterThan(100);
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
  });

  await test.step("maximize, then a location shows the editor", async () => {
    await replaceInEditor(
      page,
      "self.count_map.get(key)\n    }",
      "self.count_map.get(missing_key)\n    }",
    );
    await page.getByRole("button", { name: "Maximize console" }).click();
    await expect.poll(() => editorHeight(page)).toBeLessThan(10);
    await page.getByRole("button", { name: "Compile" }).click();
    const location = page.getByRole("button", {
      name: /^src\/lib\.rs:\d+:\d+$/,
    });
    await expect(location).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await location.click();
    await expect.poll(() => editorHeight(page)).toBeGreaterThan(100);
    await expect(
      page.getByRole("button", { name: "Maximize console" }),
    ).toBeVisible();
  });

  await test.step("a dragged size is remembered", async () => {
    // The editor/console split's, not the Explorer's vertical one.
    const handle = page.locator(
      '[data-slot=resizable-handle][aria-orientation="horizontal"]',
    );
    const box = await handle.boundingBox();
    if (!box) {
      throw new Error("no resize handle");
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 150, { steps: 10 });
    await page.mouse.up();
    const height = await consoleHeight(page);
    await page.reload();
    await waitForEditorText(page, "fn get_count(&self) -> Felt {");
    await expect
      .poll(async () => Math.abs((await consoleHeight(page)) - height))
      .toBeLessThan(4);
  });
});
