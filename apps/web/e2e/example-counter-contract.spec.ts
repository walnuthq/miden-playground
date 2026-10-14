import { expect, test, type Page } from "@playwright/test";
import { componentRow, invoke, launchExample } from "./example";
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

  await test.step("increment the counter", async () => {
    await invoke(page, "increment_count");
    // Procedures can't be invoked while the transaction is submitted.
    await expectCount(page, 1);
  });
});
