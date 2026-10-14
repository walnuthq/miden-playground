import { expect, type Locator, type Page } from "@playwright/test";
import { TRANSACTION_TIMEOUT } from "./tutorial";

// Launching an example imports its contracts from GitHub and compiles them
// through apps/api (run it along with the dev server), opens the accounts
// page, then deploys the example's account in the background.
export const launchExample = async (
  page: Page,
  { title, accountName }: { title: string; accountName: string },
) => {
  await page.goto("/");
  // The Playground syncs with testnet before rendering, which can be slow.
  const card: Locator = page
    .locator("div")
    .filter({ has: page.getByText(title, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Launch example" }) })
    .last();
  const launch = card.getByRole("button", { name: "Launch example" });
  await expect(launch).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  await launch.click();
  // Compiling can take a while when api-compile's cache is cold.
  await expect(page).toHaveURL(/\/accounts$/, { timeout: TRANSACTION_TIMEOUT });
  await expect(page.getByText(`${title} example loaded.`)).toBeVisible();
  await expect(page.getByText(`${accountName} deployed.`)).toBeVisible({
    timeout: 2 * TRANSACTION_TIMEOUT,
  });
  // The sidebar can list a component with the same name: open the account
  // from its (clickable) row.
  await page.getByRole("cell", { name: accountName, exact: true }).click();
  await expect(page).toHaveURL(/\/accounts\/mtst1[0-9a-z]+$/);
};

// The innermost row holding `text` in the Components tab: a component's row
// contains its storage slots and procedures tables.
export const componentRow = (page: Page, text: string) =>
  page
    .getByRole("row")
    .filter({ has: page.getByText(text, { exact: true }) })
    .last();

// Invokes a procedure from the Components tab. Read-only procedures show
// their result in the row, others submit a transaction.
export const invoke = async (page: Page, procedure: string) => {
  const row = componentRow(page, procedure);
  await row.getByRole("button", { name: "Invoke" }).click();
  return row;
};
