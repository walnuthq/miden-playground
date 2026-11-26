import { expect, test } from "./bread";
import { COMPILED, replaceInEditor, scriptHeader } from "./editor";
import { atPhoneWidth, expectWithinDialog } from "./mobile/layout";
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

// The error the timelock fails with (lib/utils/tutorial-code.ts), and how
// the VM reports a failed assertion: by a code derived from its message.
const TIMELOCKED = "P2ID note is timelocked until its timelock height";
const ASSERTION_FAILED = "assertion failed with error code";

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
    // import, the third storage item and its address, the error, the check.
    await replaceInEditor(
      page,
      "use miden::protocol::active_note",
      "use miden::protocol::active_note\nuse miden::protocol::tx",
    );
    await replaceInEditor(
      page,
      "const NUM_STORAGE_ITEMS = 2",
      "const NUM_STORAGE_ITEMS = 3",
    );
    await replaceInEditor(
      page,
      "const TARGET_ACCOUNT_ID_SUFFIX_PTR = STORAGE_PTR + 1",
      [
        "const TARGET_ACCOUNT_ID_SUFFIX_PTR = STORAGE_PTR + 1",
        "const TIMELOCK_HEIGHT_PTR = STORAGE_PTR + 2",
      ].join("\n"),
    );
    await replaceInEditor(
      page,
      "exactly 2 note storage items",
      "exactly 3 note storage items",
    );
    await replaceInEditor(
      page,
      'const ERR_P2ID_WRONG_TARGET = "P2ID note can only be consumed by its target account"',
      [
        'const ERR_P2ID_WRONG_TARGET = "P2ID note can only be consumed by its target account"',
        "",
        `const ERR_P2ID_TIMELOCKED = "${TIMELOCKED}"`,
      ].join("\n"),
    );
    await replaceInEditor(
      page,
      "eq.NUM_STORAGE_ITEMS assert.err=ERR_P2ID_WRONG_NUMBER_OF_STORAGE_ITEMS\n    # => []",
      [
        "eq.NUM_STORAGE_ITEMS assert.err=ERR_P2ID_WRONG_NUMBER_OF_STORAGE_ITEMS",
        "    # => []",
        "",
        "    # the timelock height, then the transaction's reference block",
        "    mem_load.TIMELOCK_HEIGHT_PTR exec.tx::get_reference_block_number",
        "    # => [block_number, timelock_height]",
        "",
        "    lte assert.err=ERR_P2ID_TIMELOCKED",
        "    # => []",
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
    // Moving on creates the Test Wallet, the note's target account, a
    // standard wallet.
    await nextStep(page);
  });

  await test.step("4. create the timelocked note", async () => {
    await bread.connect(page);
    // The edited note has no typed form: the panel gives the raw storage
    // items, the Test Wallet's prefix and suffix then the block height.
    const values = panel.root.locator("strong").filter({ hasText: /^\d+$/ });
    await expect(values).toHaveCount(3, { timeout: TRANSACTION_TIMEOUT });
    const items = await values.allTextContents();
    await panel.openLink("notes page", /\/notes$/);
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    const addStorage = dialog.getByRole("button", { name: "Add note storage" });
    const item = (index: number) =>
      dialog.getByLabel(`Note storage item ${index + 1}`, { exact: true });
    // The raw items fit a 320 px phone. The dialog is opened at that size: a
    // resize across the phone breakpoint remounts it, empty.
    await atPhoneWidth(page, async () => {
      await page.getByRole("button", { name: "Add note" }).click();
      await page.getByRole("menuitem", { name: "Create note" }).click();
      await selectOption(page, "Script", SCRIPT_NAME);
      for (const index of items.keys()) {
        await addStorage.click();
        await item(index).scrollIntoViewIfNeeded();
        await expectWithinDialog(item(index), dialog);
      }
      for (const name of ["Preview consumption", "Create", "Cancel"]) {
        const button = dialog.getByRole("button", { name, exact: true });
        await button.scrollIntoViewIfNeeded();
        await expectWithinDialog(button, dialog);
      }
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toBeHidden();
    });
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    await dialog.getByPlaceholder("Select an account").click();
    await page.getByRole("option", { name: /Test Wallet/ }).click();
    await selectOption(page, "Script", SCRIPT_NAME);
    await dialog.getByRole("button", { name: "Add note assets" }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: /USDCX/i }).click();
    await dialog.getByLabel("Amount").fill("1");
    // No typed field: the schema went with the edit.
    await expect(
      dialog.getByRole("switch", { name: "Enter as raw felts" }),
    ).toHaveCount(0);
    for (const [index, value] of items.entries()) {
      await addStorage.click();
      await item(index).fill(value);
    }
    const create = dialog.getByRole("button", { name: "Create", exact: true });
    await expect(create).toBeEnabled();
    // The preview runs at the current block: the timelock fails it, which
    // doesn't stop the note from being created.
    await dialog.getByRole("button", { name: "Preview consumption" }).click();
    const failure = dialog.getByRole("alert");
    await expect(failure).toContainText(ASSERTION_FAILED, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(failure).toContainText(
      "This doesn't stop you from creating the note.",
    );
    await expect(create).toBeEnabled();
    const request = await bread.approve(() => create.click(), {
      timeout: TRANSACTION_TIMEOUT,
    });
    expect(request).toContain("Confirm Transaction");
    // Completes once the note is committed, recognized as the script's (its
    // script root is the compiled script's entry point) and targeted at the
    // Test Wallet: its storage starts with the Test Wallet's prefix and
    // suffix.
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
      page.locator("[data-sonner-toast]").filter({ hasText: ASSERTION_FAILED }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await expect(noteRow).toHaveCount(1);
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
