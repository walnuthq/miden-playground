import { expect, test } from "@playwright/test";
import { logBrowserErrors, startTutorial, tutorialPanel } from "./tutorial";

// This browser has no Bread Wallet extension. A tutorial's first step asks to
// install it only when one of its steps signs with the wallet
// (`requiresWallet` in components/tutorials/meta.ts).
test("only tutorials that sign with Bread Wallet ask to install it", async ({
  page,
}) => {
  logBrowserErrors(page);
  const installAlert = tutorialPanel(page).root.getByText(
    "You need to install Bread Wallet.",
  );

  // Tutorial 7 deploys a No Auth contract: nothing to sign.
  await startTutorial(page, "Deploy a counter contract");
  await expect(installAlert).toBeHidden();

  // Tutorial 3 connects the wallet in its first step.
  await startTutorial(page, "Connect a wallet and sign transactions");
  await expect(installAlert).toBeVisible();
});
