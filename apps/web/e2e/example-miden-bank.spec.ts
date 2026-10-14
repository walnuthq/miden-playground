import type { Page } from "@playwright/test";
import { expect, test } from "./bread";
import { componentRow, launchExample } from "./example";
import {
  logBrowserErrors,
  pickAccount,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// The deposit note is created by a new Bread Wallet (see ./bread.ts), funded
// from its "Fund your wallet" prompt first, then consumed by the bank (No
// Auth, so without signing).
const newTransaction = async (page: Page, type: "consume" | "custom") => {
  await page.getByRole("button", { name: "Create new transaction" }).click();
  await page.getByRole("menuitem", { name: `New ${type} transaction` }).click();
  return page
    .getByRole("dialog")
    .filter({ hasText: `Configure ${type} transaction` });
};

const submit = async (page: Page) => {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Preview" }).click();
  const submitButton = dialog.getByRole("button", { name: "Submit" });
  await expect(submitButton).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  await submitButton.click();
  await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
};

// Storage slots are shown once the account is synced: open the Components
// tab again until the slot holds the expected value.
const expectStorageSlot = async (page: Page, name: string, value: RegExp) => {
  await expect(async () => {
    await page.getByRole("tab", { name: "Information" }).click();
    await page.getByRole("tab", { name: "Components" }).click();
    await expect(componentRow(page, name)).toHaveText(value, {
      timeout: 10_000,
    });
  }).toPass({ timeout: TRANSACTION_TIMEOUT });
};

test("example: miden bank deposit", async ({ page, bread }) => {
  logBrowserErrors(page);
  await bread.fund();
  let bankUrl = "";

  await test.step("launch the example", async () => {
    await launchExample(page, {
      title: "Miden Bank",
      accountName: "Bank Account",
    });
    bankUrl = page.url();
    await page.getByRole("tab", { name: "Components" }).click();
    await expect(componentRow(page, "initialize")).toBeVisible();
    await expectStorageSlot(page, "bank_account::bank::initialized", /0$/);
  });

  await test.step("initialize the bank", async () => {
    // Deposits are rejected until the bank is initialized.
    await newTransaction(page, "custom");
    await selectOption(page, "Transaction script", "init-tx-script");
    await submit(page);
    await expectStorageSlot(page, "bank_account::bank::initialized", /1$/);
  });

  await test.step("deposit 1 USDCX with a deposit note", async () => {
    await bread.connect(page);
    await page.goto("/notes");
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await pickAccount(dialog, "Bank Account");
    await selectOption(page, "Script", "deposit-note");
    await dialog.getByRole("button", { name: "Add note assets" }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: "USDCX" }).click();
    await dialog.getByLabel("Amount").fill("1");
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
  });

  await test.step("consume the deposit note with the bank", async () => {
    await page.goto(bankUrl);
    // The bank's consumable notes are listed once the note is committed.
    const noteRow = page
      .getByRole("row")
      .filter({ has: page.getByRole("button", { name: "Open menu" }) });
    await expect(noteRow).toHaveCount(1, { timeout: TRANSACTION_TIMEOUT });
    const dialog = await newTransaction(page, "consume");
    await dialog.getByRole("combobox").click();
    await page
      .getByRole("option", { name: /^public note with assets 1 USDCX / })
      .click();
    await expect(dialog.getByRole("combobox")).toHaveText("1 note selected");
    await submit(page);
    await expect(noteRow).toHaveCount(0, { timeout: TRANSACTION_TIMEOUT });
  });

  await test.step("the depositor's balance is 1 USDCX", async () => {
    // Balances are in base units: USDCX has 6 decimals.
    await expectStorageSlot(page, "bank_account::bank::balances", /1000000$/);
  });
});
