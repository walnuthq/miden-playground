import { expect, type Locator, type Page } from "@playwright/test";
import { TRANSACTION_TIMEOUT } from "./tutorial";

// Launching an example creates its precompiled packages through apps/api (run
// it along with the dev server), opens the accounts page, then deploys the
// example's account in the background.
export const launchExample = async (
  page: Page,
  { title, accountName }: { title: string; accountName: string },
) => {
  await startExample(page, title);
  await expect(page.getByText(`${accountName} deployed.`)).toBeVisible({
    timeout: 2 * TRANSACTION_TIMEOUT,
  });
  // The sidebar lists the account under the same name: open it from its
  // (clickable) row.
  await page.getByRole("cell", { name: accountName, exact: true }).click();
  await expect(page).toHaveURL(/\/accounts\/mtst1[0-9a-z]+$/);
};

// Launches an example without waiting for its account.
export const startExample = async (page: Page, title = "Counter Contract") => {
  await page.goto("/");
  // The Playground syncs with testnet before rendering, which can be slow.
  const card: Locator = page
    .locator("div")
    .filter({ has: page.getByText(title, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Launch example" }) })
    .last();
  const launch = card.getByRole("button", { name: "Launch example" });
  // The app shell shows it disabled until the client is ready.
  await expect(launch).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await launch.click();
  await expect(page).toHaveURL(/\/accounts$/, { timeout: TRANSACTION_TIMEOUT });
  await expect(page.getByText(`${title} example loaded.`)).toBeVisible();
};

// The innermost row holding `text` in the Components tab: a component's row
// contains its storage slots and procedures tables.
export const componentRow = (page: Page, text: string) =>
  page
    .getByRole("row")
    .filter({ has: page.getByText(text, { exact: true }) })
    .last();

// Invokes a procedure from the Components tab. Read-only procedures show
// their result in the row, others open their transaction's preview (see
// `invokeAndSubmit`).
export const invoke = async (page: Page, procedure: string) => {
  const row = componentRow(page, procedure);
  await row.getByRole("button", { name: "Invoke" }).click();
  return row;
};

// The Invoke Procedure dialog on a state-changing procedure's preview.
export const previewDialog = (page: Page, procedure: string) =>
  page.getByRole("dialog").filter({ hasText: `Preview ${procedure}` });

// Waits for the preview of a state-changing procedure's transaction, submits
// it and waits for the dialog to close.
export const submitPreview = async (page: Page, procedure: string) => {
  const dialog = previewDialog(page, procedure);
  await expect(dialog.getByText("Storage changes:")).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
  await dialog.getByRole("button", { name: "Submit" }).click();
  await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
};

// Invokes a state-changing procedure without arguments: Invoke opens its
// preview, Submit submits it.
export const invokeAndSubmit = async (page: Page, procedure: string) => {
  await invoke(page, procedure);
  await submitPreview(page, procedure);
};
