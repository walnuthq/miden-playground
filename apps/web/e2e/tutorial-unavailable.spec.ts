import { expect, test } from "@playwright/test";
import { switcher } from "./projects-menu";
import { TRANSACTION_TIMEOUT } from "./tutorial";

// Tutorial 5 is marked `unavailable` (components/tutorials/meta.ts) until the
// Guardian multisig client signs with Bread Wallet again: its card and its
// project switcher item say so and can't be used. So are tutorials 6 to 12
// until they're rewritten in MASM. Delete this spec with the last flag.
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
  // Tutorials 6 to 12 wait for their MASM rewrite (spec/remove-rust plan 07).
  for (const number of [6, 7, 8, 9, 10, 11, 12]) {
    await expect(
      page.getByRole("menuitem", { name: new RegExp(`^${number}\\. `) }),
    ).toHaveAttribute("aria-disabled", "true");
  }
  // The other tutorials stay available.
  for (const number of [1, 2, 3, 4]) {
    await expect(
      page.getByRole("menuitem", { name: new RegExp(`^${number}\\. `) }),
    ).not.toHaveAttribute("aria-disabled", "true");
  }
});

test("tutorials 6 to 12 say they're being rewritten", async ({ page }) => {
  await page.goto("/");
  const showAll = page.getByRole("button", { name: /Show all \d+ tutorials/ });
  await expect(showAll).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await showAll.click();
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByText("Foreign procedure invocation", { exact: true }),
  });
  await expect(
    card.getByText("Being rewritten for Miden Assembly."),
  ).toBeVisible();
  await expect(
    card.getByRole("button", { name: "Unavailable" }),
  ).toBeDisabled();
});
