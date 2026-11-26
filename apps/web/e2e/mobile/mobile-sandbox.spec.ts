import { expect, type Page, test } from "@playwright/test";
import { COMPILED } from "../editor";
import { componentRow, invoke, launchExample, previewDialog } from "../example";
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

  await test.step("a state-changing Invoke's preview fits, Submit on screen", async () => {
    await invoke(page, "increment_count");
    const dialog = previewDialog(page, "increment_count");
    await expect(dialog.getByText("Storage changes:")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    const submit = dialog.getByRole("button", { name: "Submit" });
    await submit.scrollIntoViewIfNeeded();
    await expectWithinWidth(submit);
    await expectNoHorizontalOverflow(page);
    await submit.click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    const result = componentRow(page, "get_count").getByRole("cell").last();
    await expect(async () => {
      await invoke(page, "get_count");
      await expect(result).toHaveText(/^1\s*Invoke$/, { timeout: 10_000 });
    }).toPass({ timeout: TRANSACTION_TIMEOUT });
  });

  await test.step("every page fits, opened from the sidebar", async () => {
    for (const [title, url] of [
      ["Accounts", /\/accounts$/],
      ["Transactions", /\/transactions$/],
      ["Notes", /\/notes$/],
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
    await page.getByRole("menuitem", { name: "miden-project.toml" }).click();
    const manifestTab = page.getByRole("tab", { name: "miden-project.toml" });
    await expect(manifestTab).toHaveAttribute("aria-selected", "true");
    // The tabs row scrolls to the file opened.
    await expectWithinWidth(manifestTab);
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

  await test.step("a note's Simulate tab fits, on the simulated account", async () => {
    await navigateWithSidebar(page, "Scripts", /\/scripts$/);
    await page
      .getByRole("cell", { name: "increment-note", exact: true })
      .click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]+$/);
    const editorConsole = page.getByRole("region", { name: "Editor Console" });
    await editorConsole.getByRole("tab", { name: "Simulate" }).click();
    // Both dropdowns' lists stay on screen.
    const pick = async (trigger: string, option: string) => {
      await editorConsole.getByRole("button", { name: trigger }).click();
      const item = page.getByRole("menuitemradio", {
        name: option,
        exact: true,
      });
      await expectWithinWidth(item);
      await item.click();
      await expectWithinWidth(
        editorConsole.getByRole("button", { name: option }),
      );
    };
    await pick("Select account", "Simulated account");
    // A row of the note's assets and one of the vault's: the simulated asset
    // is picked.
    for (const label of ["Note", "Vault"]) {
      const rows = editorConsole.getByRole("group", {
        name: `${label} assets`,
      });
      await rows.getByRole("button", { name: "Add asset" }).click();
      await expectWithinWidth(rows.getByLabel(`${label} amount 1`));
      await expectWithinWidth(
        rows.getByRole("button", { name: `Remove ${label} asset 1` }),
      );
      await expectWithinWidth(rows.getByRole("button", { name: "SIM" }));
      await expectWithinWidth(rows.getByRole("button", { name: "New asset" }));
    }
    // The simulated account's storage, under the form.
    const counter = editorConsole.getByRole("region", {
      name: "Simulated account counter-account",
    });
    // Its switch, which makes the dependency a foreign account.
    await expectWithinWidth(
      counter.getByRole("switch", { name: "Foreign account" }),
    );
    await expectWithinWidth(counter.getByText("Foreign account"));
    await counter.getByRole("button", { name: "Add entry" }).click();
    const slot = "counter_account::counter_contract::count_map";
    await expectWithinWidth(counter.getByLabel(`${slot} key 1`));
    await expectWithinWidth(counter.getByLabel(`${slot} value 1`));
    await expectWithinWidth(
      editorConsole.getByRole("button", { name: "Simulate", exact: true }),
    );
    await expectNoHorizontalOverflow(page);
    await expectHeaderFits(page);
  });

  await test.step("the sandbox saves as a project from the sheet", async () => {
    await navigateWithSidebar(page, "Accounts", /\/accounts$/);
    await page
      .locator("header")
      .getByRole("button", { name: "Toggle Sidebar" })
      .click();
    const sidebar = page.locator(
      '[data-sidebar="sidebar"][data-mobile="true"]',
    );
    await sidebar.getByRole("button", { name: /Miden Playground/ }).click();
    await page.getByRole("menuitem", { name: "Projects" }).click();
    await page.getByRole("menuitem", { name: "Save", exact: true }).click();
    // The sheet closes for the dialog, which fits the screen.
    await expect(sidebar).toBeHidden();
    const dialog = page.getByRole("dialog", { name: "Save Project" });
    await expect(dialog.getByLabel("Name")).toHaveValue("Counter Contract");
    await expectNoHorizontalOverflow(page);
    await expectWithinWidth(dialog.getByRole("button", { name: "Save" }));
    await dialog.getByLabel("Name").fill("Phone counter");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Project saved.")).toBeVisible();
    await expect(dialog).toBeHidden();
    await page
      .locator("header")
      .getByRole("button", { name: "Toggle Sidebar" })
      .click();
    await expect(sidebar).toContainText("Phone counter");
    await expectNoHorizontalOverflow(page);
  });
});

// The MockChain sandbox, started from the home page's third card: nothing to
// wait for but the app (no node, no prover), so its pages are quick to check.
test("mobile: a MockChain sandbox fits the screen", async ({ page }) => {
  logBrowserErrors(page);
  await page.goto("/");
  const create = page.getByRole("button", {
    name: "Create new MockChain sandbox",
  });
  await expect(create).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await expectNoHorizontalOverflow(page);
  await expectWithinWidth(create);
  await create.click();
  await expect(page).toHaveURL(/\/accounts$/, { timeout: TRANSACTION_TIMEOUT });
  await expect(page.locator('header [data-slot="badge"]')).toContainText(
    /MockChain\s*\|\s*#\d+/,
    { timeout: TRANSACTION_TIMEOUT },
  );
  await expectNoHorizontalOverflow(page);
  await expectHeaderFits(page);

  await test.step("a wallet's dialog and row fit", async () => {
    await page.getByRole("button", { name: "Create new account" }).click();
    const item = page.getByRole("menuitem", { name: "Create new wallet" });
    await expectWithinWidth(item);
    await item.click();
    const dialog = page.getByRole("dialog", { name: "Create Wallet" });
    const submit = dialog.getByRole("button", { name: "Create" });
    await expectWithinWidth(submit);
    await submit.click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await expectWithinWidth(
      page.getByRole("button", { name: "Open menu" }).first(),
    );
    await expectNoHorizontalOverflow(page);
  });

  await test.step("the wallet's page fits, under its own prefix", async () => {
    await page
      .getByRole("cell", { name: /^mmck1/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/accounts\/mmck1[0-9a-z]+$/);
    // The account's code commitment, as a note shows its script root.
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: "Code commitment" })
        .getByRole("cell")
        .last(),
    ).toHaveText(/^0x[0-9a-f]{64}$/);
    await expectNoHorizontalOverflow(page);
    await expectHeaderFits(page);
  });
});
