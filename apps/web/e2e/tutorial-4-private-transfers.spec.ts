import { expect, test } from "./bread";
import { para, skipUnlessParaBeta } from "./para";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  tutorialPanel,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// Sends USDCx privately from a new Bread Wallet (see ./bread.ts) to a Para
// Wallet logged in with a Para test account (see ./para.ts), which then
// consumes it. The Para account is reused across runs, so its wallet can
// already hold notes from previous runs: the note to consume is the one the
// tutorial points to.
test("tutorial 4: private transfers", async ({ page, bread }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  const paraWallet = para(page);
  await startTutorial(page, "Private transfers");
  await skipUnlessParaBeta(page);

  await test.step("1. connect a private Bread Wallet", async () => {
    await bread.connect(page);
    await panel.openLink("click its name", /\/accounts\/mtst1[0-9a-z]+$/);
    await nextStep(page);
  });

  await test.step("2. mint 10 USDCx, auto-consumed by Bread", async () => {
    await panel.root.getByRole("button", { name: "Mint" }).click();
    await nextStep(page, { timeout: 2 * TRANSACTION_TIMEOUT });
  });

  await test.step("3. connect a Para Wallet", async () => {
    await bread.disconnect(page);
    await paraWallet.login();
    await panel.openLink("accounts page", /\/accounts$/);
    await expect(
      page.getByRole("row").filter({ hasText: "Para Wallet" }),
    ).toContainText("Public");
    await nextStep(page);
  });

  await test.step("4. send 1 USDCx privately to the Para Wallet", async () => {
    await paraWallet.disconnect();
    await bread.connect(page);
    await panel.openLink("accounts page", /\/accounts$/);
    const breadRow = page.getByRole("row").filter({ hasText: "Private" });
    await breadRow.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("menuitem", { name: "New send transaction" }).click();
    const dialog = page.getByRole("dialog", { name: /send transaction$/ });
    await dialog.getByPlaceholder("Select an account").click();
    await page.getByRole("option", { name: /Para Wallet/ }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: /USDCX/i }).click();
    await dialog.getByRole("spinbutton", { name: "Amount" }).fill("1");
    await expect(
      dialog.getByRole("switch", { name: /Note type/ }),
    ).not.toBeChecked();
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Preview" }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toMatch(/Amount\s*-1\b/);
    // Completes once the private note is committed.
    await nextStep(page);
  });

  await test.step("5. consume the private note with the Para Wallet", async () => {
    await bread.disconnect(page);
    await paraWallet.login();
    await panel.openLink(
      "Para Wallet details page",
      /\/accounts\/mtst1[0-9a-z]+$/,
    );
    // The note sent in step 4, e.g. "0x12345678…9abcdef0".
    const noteId = panel.root.locator("strong").filter({ hasText: /^0x.+…/ });
    await expect(noteId).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    const noteRow = page
      .getByRole("row")
      .filter({ hasText: (await noteId.textContent())! });
    // Private notes reach the Para Wallet through the note transport layer.
    await expect(noteRow).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await paraWallet.approve(async () => {
      await noteRow.getByRole("button", { name: "Open menu" }).click();
      await page
        .getByRole("menuitem", { name: "Consume note with Para Wallet" })
        .click();
    });
    await nextStep(page);
  });

  await test.step("6. done", async () => {
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
