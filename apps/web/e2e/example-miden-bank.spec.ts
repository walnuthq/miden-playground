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

// The bank's balances map (apps/api/examples/miden-bank/bank-account): its
// row ends with its only entry's value, or with the entries' header when it
// has none.
const BALANCES = "bank_account::balances";

// The bank's consumable notes, once committed.
const bankNotes = (page: Page) =>
  page
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: "Open menu" }) });

// The dialog reads the account's consumable notes once, as it opens: the
// page can list a note before the client finds it consumable. Open it again
// until the note is offered.
const consumeOnlyNote = async (page: Page) => {
  await expect(async () => {
    const open = page
      .getByRole("dialog")
      .filter({ hasText: "Configure consume transaction" });
    if (await open.isVisible()) {
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      await expect(open).toBeHidden();
    }
    const dialog = await newTransaction(page, "consume");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option").first().click({ timeout: 10_000 });
    await expect(dialog.getByRole("combobox")).toHaveText("1 note selected");
  }).toPass({ timeout: TRANSACTION_TIMEOUT });
  await submit(page);
};

test("example: miden bank deposit and withdrawal", async ({ page, bread }) => {
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
    await expectStorageSlot(page, "bank_account::initialized", /0$/);
  });

  await test.step("initialize the bank", async () => {
    // Deposits are refused until the bank is initialized.
    await newTransaction(page, "custom");
    await selectOption(page, "Transaction script", "init-tx-script");
    await submit(page);
    await expectStorageSlot(page, "bank_account::initialized", /1$/);
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
    await expect(bankNotes(page)).toHaveCount(1, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await consumeOnlyNote(page);
    await expect(bankNotes(page)).toHaveCount(0, {
      timeout: TRANSACTION_TIMEOUT,
    });
    // Balances are in base units: USDCX has 6 decimals.
    await expectStorageSlot(page, BALANCES, /1000000$/);
  });

  await test.step("ask for the deposit back with a withdraw request note", async () => {
    await page.goto("/notes");
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await pickAccount(dialog, "Bank Account");
    await selectOption(page, "Script", "withdraw-request-note");
    // The note's storage, typed by the example's schema: the asset's faucet
    // and the amount, in base units.
    await dialog.getByRole("button", { name: "Select account" }).click();
    await page.getByRole("menuitemradio", { name: "USDCx Faucet" }).click();
    await dialog.getByLabel("Amount").fill("1000000");
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
  });

  await test.step("the bank pays it back in a P2ID note", async () => {
    await page.goto(bankUrl);
    await expect(bankNotes(page)).toHaveCount(1, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await consumeOnlyNote(page);
    await expect(bankNotes(page)).toHaveCount(0, {
      timeout: TRANSACTION_TIMEOUT,
    });
    // A zero balance is no entry: the map is empty again.
    await expectStorageSlot(page, BALANCES, /KeyValue$/);
    // The bank's vault is empty again: the asset left in the P2ID note.
    await page.getByRole("tab", { name: "Information" }).click();
    await expect(page.getByText("1 USDCX")).toHaveCount(0);
  });
});
