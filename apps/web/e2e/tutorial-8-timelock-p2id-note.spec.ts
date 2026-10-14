import { expect, test } from "./bread";
import { replaceInEditor } from "./editor";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  tutorialPanel,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// The note is created by a new Bread Wallet (see ./bread.ts), funded from its
// "Fund your wallet" prompt first. The note script is created and compiled by
// the web app's mock API routes (app/api/scripts), not apps/api.
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
    await dialog.getByLabel("Name").fill("timelock-p2id");
    await selectOption(page, "Type", "Note Script");
    await selectOption(page, "Example", "P2ID Note");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/scripts\/p2id-note_[0-9a-f-]+$/);
    await nextStep(page);
  });

  await test.step("2. read the P2ID implementation", async () => {
    await nextStep(page);
  });

  await test.step("3. add the timelock and compile", async () => {
    await replaceInEditor(
      page,
      "assert_eq(storage.len().into(), felt!(2));",
      "assert_eq(storage.len().into(), felt!(3));",
    );
    await replaceInEditor(
      page,
      "let target_account_id_prefix = storage[1];",
      [
        "let target_account_id_prefix = storage[1];",
        "        let timelock_height = storage[2];",
        "        let block_number = tx::get_block_number();",
        "        assert!(block_number >= timelock_height);",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText("Script compiled successfully.")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    // Moving on creates the Test Wallet, the note's target account.
    await nextStep(page);
  });

  await test.step("4. create the timelocked note", async () => {
    await bread.connect(page);
    // The Test Wallet's Account ID suffix and prefix, then a block height.
    const values = panel.root.locator("strong").filter({ hasText: /^\d+$/ });
    await expect(values).toHaveCount(3, { timeout: TRANSACTION_TIMEOUT });
    const [suffix, prefix, height] = await values.allTextContents();
    await panel.openLink("notes page", /\/notes$/);
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await dialog.getByPlaceholder("Select an account").click();
    await page.getByRole("option", { name: /Test Wallet/ }).click();
    await selectOption(page, "Script", "timelock-p2id");
    await dialog.getByRole("button", { name: "Add note assets" }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: /USDCX/i }).click();
    await dialog.getByLabel("Amount").fill("1");
    for (const [index, value] of [suffix, prefix, height].entries()) {
      await dialog.getByRole("button", { name: "Add note storage" }).click();
      await dialog.getByPlaceholder(`Note storage #${index}`).fill(value!);
    }
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    // Completes once the note is committed.
    await nextStep(page);
  });

  await test.step("5. done", async () => {
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
