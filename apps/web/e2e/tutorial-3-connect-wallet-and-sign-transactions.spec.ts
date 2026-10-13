import { expect, test } from "./bread";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  tutorialPanel,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// Signs with a new Bread Wallet (see ./bread.ts), funded by the tutorial's
// Mint button (10 USDCx). Sends 0.1 USDCx, within the tutorial's 1 USDCx
// limit, as the rest pays fees.
test("tutorial 3: connect a wallet and sign transactions", async ({
  page,
  bread,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Connect a wallet and sign transactions");

  await test.step("1. connect Bread Wallet", async () => {
    await bread.connect(page);
    await panel.openLink("click its name", /\/accounts\/mtst1[0-9a-z]+$/);
    await nextStep(page);
  });

  await test.step("2. mint 10 USDCx, auto-consumed by Bread", async () => {
    await panel.root.getByRole("button", { name: "Mint" }).click();
    // The note must be committed, then consumed by Bread and synced back.
    // Moving on creates the Test Wallet.
    await nextStep(page, { timeout: 2 * TRANSACTION_TIMEOUT });
  });

  await test.step("3. meet the Test Wallet", async () => {
    await panel.openLink("accounts page", /\/accounts$/);
    await expect(
      page.getByRole("row").filter({ hasText: "Test Wallet" }),
    ).toContainText("Public");
    await nextStep(page);
  });

  await test.step("4. send 0.1 USDCx privately to the Test Wallet", async () => {
    const breadRow = page.getByRole("row").filter({ hasText: "Private" });
    await breadRow.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("menuitem", { name: "New send transaction" }).click();
    const dialog = page.getByRole("dialog", { name: /send transaction$/ });
    await dialog.getByPlaceholder("Select an account").click();
    await page.getByRole("option", { name: /Test Wallet/ }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: /USDCX/i }).click();
    await dialog.getByRole("spinbutton", { name: "Amount" }).fill("0.1");
    await expect(
      dialog.getByRole("switch", { name: /Note type/ }),
    ).not.toBeChecked();
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Preview" }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    expect(request).toMatch(/Amount\s*-0\.1\b/);
    await nextStep(page);
  });

  await test.step("5. done", async () => {
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
