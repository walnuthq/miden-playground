import { expect, type Page, test } from "@playwright/test";
import { COMPILED } from "../editor";
import { componentRow, invoke, launchExample } from "../example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "../tutorial";
import {
  expectHeaderFits,
  expectNoHorizontalOverflow,
  expectWithinWidth,
  navigateWithSidebar,
} from "./layout";

// The collapsed console: its header bar only (as in script-layout.spec.ts).
const COLLAPSED_HEIGHT = 52;

const consoleHeight = async (page: Page) =>
  (await page.getByRole("region", { name: "Editor Console" }).boundingBox())
    ?.height ?? 0;

// A sandbox on a phone, from the counter example: every page fits the
// screen, and the controls desktop layouts used to push off it stay on it.
// Pages are opened from the sidebar rather than reloaded: a reload starts the
// Miden client again, which takes about 30 s in WebKit.
test("mobile: a sandbox fits the screen", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("launch the counter example", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await expectNoHorizontalOverflow(page);
    await expectHeaderFits(page);
  });

  await test.step("the account's components keep Invoke on screen", async () => {
    await page.getByRole("tab", { name: "Components" }).click();
    // A nested table goes under its label on a phone.
    await expect(
      page.getByText("Procedures", { exact: true }).first(),
    ).toBeVisible();
    const invokeButtons = page.getByRole("button", { name: "Invoke" });
    await expect(invokeButtons.first()).toBeVisible();
    for (const button of await invokeButtons.all()) {
      await expectWithinWidth(button);
    }
    const result = componentRow(page, "get_count").getByRole("cell").last();
    await expect(async () => {
      await invoke(page, "get_count");
      await expect(result).toHaveText(/^0\s*Invoke$/, { timeout: 10_000 });
    }).toPass({ timeout: TRANSACTION_TIMEOUT });
    await expectNoHorizontalOverflow(page);
  });

  await test.step("every page fits, opened from the sidebar", async () => {
    for (const [title, url] of [
      ["Accounts", /\/accounts$/],
      ["Transactions", /\/transactions$/],
      ["Notes", /\/notes$/],
      ["Components", /\/components$/],
      ["Scripts", /\/scripts$/],
      ["Home", /\/$/],
    ] as const) {
      await navigateWithSidebar(page, title, url);
      await expectNoHorizontalOverflow(page);
      await expectHeaderFits(page);
    }
  });

  await test.step("the accounts table keeps its row menu on screen", async () => {
    await navigateWithSidebar(page, "Accounts", /\/accounts$/);
    await expectWithinWidth(
      page.getByRole("button", { name: "Open menu" }).first(),
    );
  });

  await test.step("the script editor has the screen's width", async () => {
    await navigateWithSidebar(page, "Scripts", /\/scripts$/);
    await page
      .getByRole("cell", { name: "counter-account", exact: true })
      .click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]+$/);
    // A files menu instead of the Explorer's file tree.
    await expect(page.getByRole("navigation", { name: "Files" })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "Files" }).click();
    await page.getByRole("menuitem", { name: "Cargo.toml" }).click();
    await expect(page.getByRole("tab", { name: "Cargo.toml" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // The console starts collapsed, and compiling opens it.
    await expect
      .poll(() => consoleHeight(page))
      .toBeLessThanOrEqual(COLLAPSED_HEIGHT);
    await page.getByRole("button", { name: "Compile", exact: true }).click();
    await expect.poll(() => consoleHeight(page)).toBeGreaterThan(100);
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expectNoHorizontalOverflow(page);
    await expectHeaderFits(page);
  });
});
