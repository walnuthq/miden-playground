import { expect, test } from "@playwright/test";
import { switcher } from "./projects-menu";
import { TRANSACTION_TIMEOUT } from "./tutorial";

// Tutorial 5 is marked `unavailable` (components/tutorials/meta.ts) until the
// Guardian multisig client signs with Bread Wallet again: its card and its
// project switcher item say so and can't be used. Delete this spec with the
// flag.
const title = "Wallet backup using Miden Guardian";

test("an unavailable tutorial can't be started", async ({ page }) => {
  await page.goto("/");
  const showAll = page.getByRole("button", { name: /Show all \d+ tutorials/ });
  // The app shell shows it disabled until the client is ready.
  await expect(showAll).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await showAll.click();
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title, { exact: true }) });
  await expect(card.getByText(/^Temporarily unavailable: /)).toBeVisible();
  await expect(card.getByRole("button")).toHaveCount(1);
  await expect(
    card.getByRole("button", { name: "Unavailable" }),
  ).toBeDisabled();

  await switcher(page).click();
  await page.getByRole("menuitem", { name: "Tutorials" }).click();
  const item = page.getByRole("menuitem", { name: /^5\. / });
  await expect(item).toContainText("Unavailable");
  await expect(item).toHaveAttribute("aria-disabled", "true");
  // The other tutorials stay available.
  await expect(
    page.getByRole("menuitem", { name: /^6\. / }),
  ).not.toHaveAttribute("aria-disabled", "true");
});
