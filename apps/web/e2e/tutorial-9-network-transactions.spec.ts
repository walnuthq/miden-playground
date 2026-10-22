import { expect, test } from "./bread";
import {
  logBrowserErrors,
  nextStep,
  pickAccount,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The network note is created by a new Bread Wallet (see ./bread.ts), funded
// from its "Fund your wallet" prompt first to pay the fees. The network
// transaction builder then consumes it, which can take a while.
test("tutorial 9: network transactions", async ({ page, bread }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await bread.fund();
  await startTutorial(page, "Network transactions");
  await expect(page).toHaveURL(/\/accounts$/);

  await test.step("1. introduction", async () => {
    await nextStep(page);
  });

  await test.step("2. deploy the network counter", async () => {
    await panel.openLink("accounts page", /\/accounts$/);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Deploy account" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    await dialog.getByLabel("Name").fill("Network Counter");
    await expect(dialog.getByRole("combobox").first()).toContainText("Public");
    await selectOption(page, "Auth Component", "Network Account");
    await selectOption(page, "Account Component", "Counter Contract");
    await dialog.getByPlaceholder("Select allowed note-scripts…").click();
    await page.getByRole("option", { name: "counter-note" }).click();
    // Escape would close the whole dialog: click another field to close the
    // list (which hides the rest of the dialog from the accessibility tree).
    await dialog.locator("#name").click();
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(
      dialog.getByRole("toolbar").getByText("counter-note"),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Deploy" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await nextStep(page);
  });

  await test.step("3. read the counter-note script", async () => {
    await nextStep(page);
  });

  await test.step("4. create the network note", async () => {
    await bread.connect(page);
    await panel.openLink("notes page", /\/notes$/);
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await pickAccount(dialog, "Network Counter");
    await selectOption(page, "Script", "counter-note");
    const networkNote = dialog.getByRole("switch", { name: /Network note/ });
    await networkNote.click();
    await expect(networkNote).toBeChecked();
    // The transaction expires about a minute after it's executed: Bread
    // approves it as soon as its popup opens.
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    // Completes once the network transaction builder has consumed the note.
    await nextStep(page, { timeout: 2 * TRANSACTION_TIMEOUT });
  });

  await test.step("5. done", async () => {
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
