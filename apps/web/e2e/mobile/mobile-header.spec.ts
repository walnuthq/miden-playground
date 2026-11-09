import { expect, test } from "@playwright/test";
import { logBrowserErrors, startTutorial } from "../tutorial";
import { expectHeaderFits, expectNoHorizontalOverflow } from "./layout";

// A wallet tutorial's header holds the most buttons: the network badge, the
// theme, "Select Wallet" and the tutorial toggle. Below `sm` the wallet button
// shows its icon only, so the row fits down to 320 px (it once made a 320 px
// screen 362 px wide). Tutorial 3 offers one wallet (a button), tutorial 4
// two (a menu).
for (const title of [
  "Connect a wallet and sign transactions",
  "Private transfers",
]) {
  test(`mobile: the header fits in "${title}"`, async ({ page }) => {
    logBrowserErrors(page);
    await startTutorial(page, title);
    await expect(
      page.locator("header").getByRole("button", { name: "Select Wallet" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectHeaderFits(page);
  });
}
