import { expect, test } from "@playwright/test";
import { openSubmenu } from "./projects-menu";
import { TRANSACTION_TIMEOUT } from "./tutorial";

// Tutorial 5 is marked `unavailable` (components/tutorials/meta.ts) until the
// Guardian multisig client signs with Bread Wallet again: its card and its
// project switcher item say so and can't be used. It's the only one flagged
// (6 to 12 are rewritten in MASM): delete this spec with its flag.
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

  // Under parallel load the submenu can close mid-check (the switcher
  // re-renders as late state lands), so the items are read in one go, from
  // a submenu opened again on a miss.
  await expect(async () => {
    const tutorials = await openSubmenu(page, "Tutorials");
    const items = await tutorials.getByRole("menuitem").evaluateAll((nodes) =>
      nodes.map((node) => ({
        text: (node.textContent ?? "").trim(),
        disabled: node.getAttribute("aria-disabled") === "true",
      })),
    );
    const item = (number: number) =>
      items.find(({ text }) => text.startsWith(`${number}.`));
    expect(item(5)?.text).toContain("Unavailable");
    // 5 waits for Guardian. The other tutorials stay available.
    expect(item(5)?.disabled, "tutorial 5").toBe(true);
    for (const number of [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12]) {
      expect(item(number)?.disabled, `tutorial ${number}`).toBe(false);
    }
  }).toPass({ timeout: 60_000 });
});
