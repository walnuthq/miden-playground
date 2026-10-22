import { expect, test } from "./bread";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// Deploys a guardian wallet signed by a new Bread Wallet (see ./bread.ts),
// funds it through a consume proposal co-signed by Miden Guardian, then
// restores it from Miden Guardian once the tutorial has deleted it. Every
// guardian wallet action opens several "Opaque signature request" popups in
// Bread: bread.approveAll approves them, however many there are.
test("tutorial 5: wallet backup using Miden Guardian", async ({
  page,
  bread,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Wallet backup using Miden Guardian");
  // Read before the tutorial deletes the guardian wallet, to restore it.
  let address = "";

  await test.step("1. connect a private Bread Wallet", async () => {
    await bread.connect(page);
    await nextStep(page);
  });

  await test.step("2. deploy a guardian wallet", async () => {
    await panel.openLink("accounts page", /\/accounts$/);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page
      .getByRole("menuitem", { name: "Deploy guardian wallet" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Deploy Guardian Wallet" });
    await dialog.getByLabel("Name").fill("Guardian Wallet");
    await bread.approveAll(
      () => dialog.getByRole("button", { name: "Deploy" }).click(),
      () => expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT }),
    );
    await page
      .getByRole("row")
      .filter({ hasText: "Guardian Wallet" })
      .getByRole("link")
      .first()
      .click();
    await expect(page).toHaveURL(/\/accounts\/mtst1[0-9a-z]+$/);
    address =
      (await page
        .getByRole("row", { name: /^Address/ })
        .getByRole("cell")
        .last()
        .textContent()) ?? "";
    expect(address).toMatch(/^mtst1[0-9a-z_]+$/);
    await nextStep(page);
  });

  await test.step("3. mint 10 USDCx to the guardian wallet", async () => {
    await panel.root.getByRole("button", { name: "Mint" }).click();
    await nextStep(page);
  });

  await test.step("4. propose to consume the note", async () => {
    await bread.approveAll(
      async () => {
        await page
          .getByRole("row")
          .filter({ hasText: "USDC" })
          .getByRole("button", { name: "Open menu" })
          .click();
        await page
          .getByRole("menuitem", { name: /^Consume note with / })
          .click();
      },
      () =>
        expect(panel.nextStepButton).toBeEnabled({
          timeout: TRANSACTION_TIMEOUT,
        }),
    );
    await nextStep(page);
  });

  await test.step("5. sign and execute the proposal", async () => {
    await panel.openLink("Guardian", /\?tab=guardian$/);
    const proposal = page.getByRole("row").filter({ hasText: "Consume" });
    const status = proposal.getByRole("cell").nth(3);
    const openMenu = () =>
      proposal.getByRole("button", { name: "Open menu" }).click();
    await expect(status).toHaveText(/pending/i);
    await bread.approveAll(
      async () => {
        await openMenu();
        await page.getByRole("menuitem", { name: "Sign proposal" }).click();
      },
      () =>
        expect(status).toHaveText(/ready/i, { timeout: TRANSACTION_TIMEOUT }),
    );
    await bread.approveAll(
      async () => {
        await openMenu();
        await page.getByRole("menuitem", { name: "Execute proposal" }).click();
      },
      () =>
        expect(panel.nextStepButton).toBeEnabled({
          timeout: TRANSACTION_TIMEOUT,
        }),
    );
    // Moving on disconnects Bread Wallet and deletes the guardian wallet.
    await nextStep(page);
  });

  await test.step("6. restore the guardian wallet", async () => {
    await expect(
      page.getByRole("button", { name: "Select Wallet" }),
    ).toBeVisible();
    await bread.connect(page);
    await panel.openLink("accounts page", /\/accounts$/);
    await expect(
      page.getByRole("row").filter({ hasText: "Guardian Wallet" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page
      .getByRole("menuitem", { name: "Restore guardian wallet" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Restore Guardian Wallet",
    });
    await dialog.getByLabel("Name").fill("Guardian Wallet");
    await dialog.getByLabel("Address").fill(address);
    await bread.approveAll(
      () => dialog.getByRole("button", { name: "Restore" }).click(),
      () =>
        expect(panel.nextStepButton).toBeEnabled({
          timeout: TRANSACTION_TIMEOUT,
        }),
    );
    await nextStep(page);
  });

  await test.step("7. done", async () => {
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
