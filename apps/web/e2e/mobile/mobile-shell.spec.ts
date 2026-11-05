import { expect, test } from "@playwright/test";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "../tutorial";
import { expectHeaderFits, expectNoHorizontalOverflow } from "./layout";

// While the Miden client initializes (seconds in Chrome, about 30 s in
// WebKit), the app shell shows the home page with its actions disabled, then
// the app takes over.
test("mobile: app shell while the client initializes", async ({ page }) => {
  logBrowserErrors(page);
  await page.goto("/");
  const showAll = page.getByRole("button", {
    name: /Show all \d+ tutorials/,
  });
  await expect(showAll).toBeVisible();
  await expect(showAll).toBeDisabled();
  await expectNoHorizontalOverflow(page);
  await expectHeaderFits(page);
  await expect(showAll).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await expectNoHorizontalOverflow(page);
  await expectHeaderFits(page);
});
