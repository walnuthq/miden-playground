import type { Page } from "@playwright/test";
import { expect, test } from "./bread";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// Leaving a Mainnet sandbox while Bread Wallet funds one of its accounts loses
// the account and what Bread sent it, so a switch warns first. On Miden Partner
// Mainnet, on the same wallet as mainnet-network-counter.spec.ts (see there, and
// e2e/README.md), but nothing is spent: Bread's request is never approved.
test.skip(
  process.env.MAINNET_E2E !== "1" ||
    !process.env.BREAD_PROFILE_DIR ||
    process.env.BREAD_PROFILE_IN_PLACE !== "1",
  "Set MAINNET_E2E=1 and an in-place Mainnet Bread profile (see e2e/README.md)",
);

const switcher = (page: Page) =>
  page
    .locator('[data-sidebar="sidebar"]')
    .getByRole("button", { name: /Miden Playground/ });

const warning = (page: Page) =>
  page.getByRole("alertdialog", { name: "Bread Wallet is funding an account" });

test("mainnet: switching during a funding warns first", async ({
  page,
  bread,
}) => {
  test.setTimeout(15 * 60_000);
  logBrowserErrors(page);

  await test.step("start a Mainnet sandbox with Bread connected", async () => {
    await page.goto("/");
    const create = page.getByRole("button", {
      name: "Create new Mainnet sandbox",
    });
    await expect(create).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    const storeImported = page.waitForEvent("console", {
      predicate: (message) =>
        message.text().includes("Store imported successfully."),
      timeout: TRANSACTION_TIMEOUT,
    });
    await create.click();
    await storeImported;
    await expect(page.getByText(/^Mainnet \|/)).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await bread.connect(page);
    await expect(
      page.getByRole("cell", { name: "Bread Wallet", exact: true }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  });

  const nextPopup = () =>
    page.context().waitForEvent("page", {
      predicate: (popup) => popup.url().includes("confirm"),
      timeout: TRANSACTION_TIMEOUT,
    });
  const popupOpened = nextPopup();
  // The dialog is on the accounts page, and stays open in the state.
  const deploy = async () => {
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    if (!(await dialog.isVisible())) {
      await page.getByRole("button", { name: "Create new account" }).click();
      await page.getByRole("menuitem", { name: "Deploy account" }).click();
    }
    await dialog.getByLabel("Name").fill("Never funded");
    await selectOption(page, "Auth Component", "Network Account");
    await selectOption(page, "Account Component", "Counter Account");
    await dialog.getByPlaceholder("Select allowed note-scripts…").click();
    await page.getByRole("option", { name: "increment-note" }).click();
    await dialog.locator("#name").click();
    await expect(page.getByRole("listbox")).toBeHidden();
    await dialog.getByRole("button", { name: "Deploy" }).click();
  };
  await test.step("deploy a network account, until Bread asks to pay", deploy);
  let popup = await popupOpened;

  await test.step("staying keeps the sandbox, and its page", async () => {
    await page.bringToFront();
    await page.getByRole("link", { name: "Scripts" }).first().click();
    const url = page.url();
    await switcher(page).click();
    await page.getByRole("menuitem", { name: "New Testnet sandbox" }).click();
    await expect(warning(page)).toBeVisible();
    await warning(page).getByRole("button", { name: "Stay here" }).click();
    await expect(warning(page)).toBeHidden();
    await expect(page.getByText(/^Mainnet \|/)).toBeVisible();
    expect(page.url()).toBe(url);
  });

  await test.step("the home page's cards warn too", async () => {
    await page.getByRole("link", { name: "Home" }).click();
    const launch = page.getByRole("button", { name: "Launch example" }).first();
    await launch.click();
    await expect(warning(page)).toBeVisible();
    await warning(page).getByRole("button", { name: "Stay here" }).click();
    await expect(warning(page)).toBeHidden();
    // Its button is ready again.
    await expect(launch).toBeEnabled();
    await expect(page.getByText(/^Mainnet \|/)).toBeVisible();
  });

  await test.step("the funding ending closes the warning, without switching", async () => {
    await switcher(page).click();
    await page.getByRole("menuitem", { name: "New Testnet sandbox" }).click();
    await expect(warning(page)).toBeVisible();
    // Closing Bread's popup rejects its request, which ends the funding.
    await popup.close();
    await expect(warning(page)).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await expect(page.getByText(/^Mainnet \|/)).toBeVisible();
    await expect(switcher(page)).toContainText("Mainnet sandbox");
  });

  await test.step("deploy again, until Bread asks to pay", async () => {
    await page.getByRole("link", { name: "Accounts" }).first().click();
    await expect(
      page.getByRole("dialog").filter({ hasText: "Deploy Account" }),
    ).toBeVisible();
    const popupOpened = nextPopup();
    await deploy();
    popup = await popupOpened;
    await page.bringToFront();
  });

  await test.step("leaving anyway switches, and warns no more", async () => {
    await switcher(page).click();
    await page.getByRole("menuitem", { name: "New Testnet sandbox" }).click();
    await warning(page).getByRole("button", { name: "Leave anyway" }).click();
    await expect(page.getByText(/^Testnet \|/)).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(switcher(page)).toContainText("Testnet sandbox", {
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(warning(page)).toBeHidden();
    // Bread's request is still open: it's never approved, so nothing is spent.
    await popup.close();
  });
});
