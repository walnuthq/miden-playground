import { expect, test } from "./bread";
import { COMPILED, replaceInEditor, scriptHeader } from "./editor";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The note is created by a new Bread Wallet (see ./bread.ts), funded from its
// "Fund your wallet" prompt first. The note script is created and compiled
// through apps/api and the compile service: run them along with the dev
// server.
// The tutorial leaves the script's name to the user.
const SCRIPT_NAME = "timelock-p2id";

test("tutorial 8: timelock P2ID note", async ({ page, bread }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await bread.fund();
  await startTutorial(page, "Timelock P2ID note");
  await expect(page).toHaveURL(/\/scripts$/);

  await test.step("1. create a script from the P2ID Note example", async () => {
    await page.getByRole("button", { name: "Create new script" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await dialog.getByLabel("Name").fill(SCRIPT_NAME);
    await selectOption(page, "Type", "Note Script");
    await selectOption(page, "Example", "P2ID Note");
    await dialog.getByRole("button", { name: "Create" }).click();
    // The Playground opens the new script, whose ID is the API's UUID.
    await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/);
    await expect(scriptHeader(page).name).toHaveText(SCRIPT_NAME);
    await nextStep(page);
  });

  await test.step("2. read the P2ID implementation", async () => {
    await nextStep(page);
  });

  await test.step("3. add the timelock and compile", async () => {
    // Typed as the step shows it (the mobile spec uses its buttons): the
    // imports, the note's new input, the constructor that sets it, the check.
    await replaceInEditor(
      page,
      "use miden::{account, felt_repr::ToFeltRepr, note, AccountId, Recipient, Word};",
      "use miden::{account, felt_repr::ToFeltRepr, note, tx, AccountId, Felt, Recipient, Word};",
    );
    await replaceInEditor(
      page,
      "target_account_id: AccountId,",
      ["target_account_id: AccountId,", "    timelock_height: Felt,"].join(
        "\n",
      ),
    );
    await replaceInEditor(
      page,
      "pub fn build_recipient(target: AccountId, serial_num: Word) -> Recipient {",
      [
        "pub fn build_recipient(",
        "        target: AccountId,",
        "        serial_num: Word,",
        "        timelock_height: Felt,",
        "    ) -> Recipient {",
      ].join("\n"),
    );
    await replaceInEditor(
      page,
      "target_account_id: target,",
      ["target_account_id: target,", "            timelock_height,"].join("\n"),
    );
    await replaceInEditor(
      page,
      "let current_account = account.get_id();",
      [
        "let block_number = tx::get_reference_block_number();",
        "        assert!(block_number.as_felt() >= self.timelock_height);",
        "",
        "        let current_account = account.get_id();",
      ].join("\n"),
    );
    // The step isn't done by the edits alone: the script must compile.
    await expect(scriptHeader(page).status).toHaveText("Draft");
    await expect(panel.nextStepButton).toBeDisabled();
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(scriptHeader(page).status).toHaveText("Compiled");
    // Moving on creates the Test Wallet, the note's target account, with the
    // Rust basic wallet the script is compiled against.
    await nextStep(page);
  });

  await test.step("4. create the timelocked note", async () => {
    await bread.connect(page);
    // The note storage, in the order of the script's struct fields: the Test
    // Wallet's Account ID prefix and suffix, then a block height.
    const values = panel.root.locator("strong").filter({ hasText: /^\d+$/ });
    await expect(values).toHaveCount(3, { timeout: TRANSACTION_TIMEOUT });
    const [prefix, suffix, height] = await values.allTextContents();
    await panel.openLink("notes page", /\/notes$/);
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await dialog.getByPlaceholder("Select an account").click();
    await page.getByRole("option", { name: /Test Wallet/ }).click();
    await selectOption(page, "Script", SCRIPT_NAME);
    await dialog.getByRole("button", { name: "Add note assets" }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: /USDCX/i }).click();
    await dialog.getByLabel("Amount").fill("1");
    for (const [index, value] of [prefix, suffix, height].entries()) {
      await dialog.getByRole("button", { name: "Add note storage" }).click();
      await dialog.getByPlaceholder(`Note storage #${index}`).fill(value!);
    }
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    // Completes once the note is committed, recognized as the script's (its
    // script root is the compiled script's entry point) and targeted at the
    // Test Wallet.
    await nextStep(page);
  });

  await test.step("5. the timelock holds the note", async () => {
    await panel.openLink("Test Wallet", /\/accounts\/mtst1[0-9a-z]+$/);
    const noteRow = page
      .getByRole("row")
      .filter({ hasText: SCRIPT_NAME })
      .filter({ has: page.getByRole("button", { name: "Open menu" }) });
    await expect(noteRow).toHaveCount(1, { timeout: TRANSACTION_TIMEOUT });
    // The note runs the compiled script: consuming it before the timelock
    // height fails on the assertion the tutorial added.
    await noteRow.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("menuitem", { name: "Consume note with Test Wallet" })
      .click();
    await expect(
      page.locator("[data-sonner-toast]").filter({
        hasText: "assertion failed",
      }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await expect(noteRow).toHaveCount(1);
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
