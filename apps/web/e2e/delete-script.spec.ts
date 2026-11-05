import { expect, test } from "@playwright/test";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

test("deleting a script closes its dialog", async ({ page }) => {
  logBrowserErrors(page);
  const name = `delete-check-${crypto.randomUUID()}`;

  await page.goto("/scripts");
  await page.getByRole("button", { name: "Create new script" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create Script" });
  await dialog.getByLabel("Name").fill(name);
  await selectOption(page, "Type", "Account Component");
  await selectOption(page, "Example", "Counter Contract");
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/, {
    timeout: TRANSACTION_TIMEOUT,
  });

  await page.goto("/scripts");
  const row = page.getByRole("row", { name: new RegExp(name) });
  await row.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Delete script" }).click();
  const alert = page.getByRole("alertdialog");
  await alert.getByRole("button", { name: "Delete" }).click();

  await expect(row).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
  await expect(alert).toBeHidden();
});
