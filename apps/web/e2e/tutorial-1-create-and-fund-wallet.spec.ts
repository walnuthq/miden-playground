import { expect, test } from "@playwright/test";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// Tutorial 1 needs no wallet: every transaction is signed by accounts the
// Playground creates and stores in the browser. Each test gets a fresh browser
// context, so this runs as a brand new user.
test("tutorial 1: create and fund a wallet", async ({ page }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Create and fund a wallet");
  await expect(page).toHaveURL(/\/accounts$/);

  await test.step("1. create a public wallet", async () => {
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Create new wallet" }).click();
    const dialog = page.getByRole("dialog", { name: "Create Wallet" });
    await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Wallet A",
    );
    await expect(
      dialog.getByRole("switch", { name: /Storage mode/ }),
    ).toBeChecked();
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    const walletRow = page.getByRole("row", { name: /Wallet A/ });
    await expect(walletRow).toContainText("Public");
    await nextStep(page);
  });

  await test.step("2. inspect the account ID", async () => {
    await expect(
      panel.root.getByRole("link", { name: /\(Wallet A\)/ }),
    ).toBeVisible();
    await nextStep(page);
  });

  await test.step("3. mint 100 MDN to the wallet", async () => {
    await panel.openLink("faucet page", /\/accounts\/mtst1[0-9a-z]+$/);
    await page.getByRole("button", { name: "Create new transaction" }).click();
    await page.getByRole("menuitem", { name: "New mint transaction" }).click();
    // Titled "Configure mint transaction", then "Preview mint transaction".
    const dialog = page.getByRole("dialog", { name: /mint transaction$/ });
    await dialog.getByRole("button", { name: "Select account" }).click();
    await page.getByRole("menuitemradio", { name: "Wallet A" }).click();
    await dialog.getByRole("spinbutton", { name: "Amount" }).fill("100");
    await dialog.getByRole("button", { name: "Preview" }).click();
    // The preview executes the transaction locally before it's proven.
    await expect(dialog.getByText("will be created as a result")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await dialog.getByRole("button", { name: "Submit" }).click();
    await nextStep(page);
  });

  await test.step("4. inspect the mint transaction", async () => {
    await panel.openLink("Click here", /\/transactions\/0x[0-9a-f]+$/);
    await expect(
      page.getByRole("row").filter({ hasText: "p2id" }).filter({
        hasText: "100 MDN",
      }),
    ).toBeVisible();
    await nextStep(page);
  });

  await test.step("5. consume the P2ID note with the wallet", async () => {
    await panel.openLink("Click here", /\/notes\/0x[0-9a-f]+$/);
    await expect(
      page.getByRole("row", { name: /Target Account ID/ }),
    ).toContainText("(Wallet A)");
    await page
      .getByRole("button", { name: "Consume note with Wallet A" })
      .click();
    const submit = page.getByRole("button", { name: "Submit" });
    await expect(submit).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await submit.click();
    await nextStep(page);
  });

  await test.step("6. the wallet holds 100 MDN", async () => {
    await panel.openLink("your wallet", /\/accounts\/mtst1[0-9a-z]+$/);
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: "MDN Faucet" })
        .filter({
          hasText: /\bMDN\b/,
        }),
    ).toContainText("100");
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
