import { expect, type Page, test } from "@playwright/test";
import {
  componentRow,
  invoke,
  invokeAndSubmit,
  launchExample,
  previewDialog,
} from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

// Each launch deploys a new counter contract (No Auth, so the Playground
// increments it without a wallet): its count starts at 0.
const expectCount = async (page: Page, count: number) => {
  const result = componentRow(page, "get_count").getByRole("cell").last();
  await expect(async () => {
    await invoke(page, "get_count");
    await expect(result).toHaveText(new RegExp(`^${count}\\s*Invoke$`), {
      timeout: 10_000,
    });
  }).toPass({ timeout: TRANSACTION_TIMEOUT });
};

// The account's nonce, from its Information tab; back on Components after.
const nonce = async (page: Page) => {
  await page.getByRole("tab", { name: "Information" }).click();
  const value = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "Nonce", exact: true }) })
    .getByRole("cell")
    .last();
  await expect(value).toHaveText(/^\d+$/);
  const text = await value.textContent();
  await page.getByRole("tab", { name: "Components" }).click();
  return Number(text);
};

// The Counter Contract example is hidden (`hidden` in lib/examples/meta.tsx)
// until plan 06 of spec/remove-rust rewrites it in MASM. Remove this with
// the flag.
test.fixme(
  true,
  "The Counter Contract example is being rewritten for Miden Assembly (spec/remove-rust plan 06)",
);

test("example: counter contract", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("launch the example", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await page.getByRole("tab", { name: "Components" }).click();
    await expect(
      componentRow(page, "counter_account::counter_contract::count_map"),
    ).toBeVisible();
    await expectCount(page, 0);
  });

  await test.step("a cancelled preview submits nothing", async () => {
    const nonceBefore = await nonce(page);
    await invoke(page, "increment_count");
    const dialog = previewDialog(page, "increment_count");
    // The preview shows the counter's storage change before anything is
    // submitted.
    await expect(
      dialog.getByRole("cell", { name: "count_map", exact: true }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await expect(dialog.getByRole("button", { name: "Submit" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Transaction submitted.")).toHaveCount(0);
    await expectCount(page, 0);
    // No transaction was added: the account's nonce didn't move.
    expect(await nonce(page)).toBe(nonceBefore);
  });

  await test.step("increment the counter", async () => {
    await invokeAndSubmit(page, "increment_count");
    await expect(page.getByText("Transaction submitted.")).toBeVisible();
    // Procedures can't be invoked while the transaction is submitted.
    await expectCount(page, 1);
  });
});
