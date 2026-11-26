import { expect, type Page, test } from "@playwright/test";
import { waitForEditorText } from "./editor";
import { previewDialog } from "./example";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The slots, as the MASM sources name them: the counter's, in the Count
// Reader's Simulate tab, and the Count Reader's.
const COUNTER_SLOT = "counter_account::count_map";
const COUNT_READER_SLOT = "count_reader::count";

// Tutorial 10 needs no wallet: the Count Reader uses No Auth. It copies the
// count of the shared testnet Counter Contract, which anyone can increment,
// so the copy is checked by the tutorial itself (step 5 compares both).
const procedureRow = (page: Page, procedure: string) =>
  page
    .getByRole("row")
    .filter({ has: page.getByText(procedure, { exact: true }) })
    // The innermost row: the component's row contains its procedures table.
    .last();

test("tutorial 10: foreign procedure invocation", async ({ page }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Foreign procedure invocation");

  await test.step("1. introduction", async () => {
    await nextStep(page);
  });

  await test.step("2. open the count-reader script", async () => {
    // The starter's scripts have the API's ids.
    await panel.openLink("count-reader script", /\/scripts\/[0-9a-f-]{36}$/, {
      breadcrumb: "count-reader",
    });
    await waitForEditorText(page, "pub proc copy_count");
    await nextStep(page);
  });

  await test.step("3. read the Count Reader code, simulate copy_count", async () => {
    // A read-only script that can be simulated: its console opens on
    // Simulate, with nothing to compile.
    const editorConsole = page.getByRole("region", { name: "Editor Console" });
    await expect(
      editorConsole.getByRole("tab", { name: "Simulate", selected: true }),
    ).toBeVisible();
    await expect(
      editorConsole.getByText("Simulation runs are logged here."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Compile" })).toHaveCount(0);
    // Step 3's simulation: the counter, staged from the script's
    // `counter-account` dependency, at 7.
    const counter = editorConsole.getByRole("region", {
      name: "Foreign account counter-account",
    });
    await counter.getByRole("button", { name: "Add entry" }).click();
    await counter.getByLabel(`${COUNTER_SLOT} key 1`).fill("1");
    await counter.getByLabel(`${COUNTER_SLOT} value 1`).fill("7");
    const copyCount = editorConsole.getByRole("row").filter({
      has: page.getByRole("button", { name: "Invoke copy_count" }),
    });
    await copyCount
      .locator("xpath=following-sibling::tr[1]")
      .getByRole("button")
      .click();
    await page
      .getByRole("menuitemradio", { name: "counter-account", exact: true })
      .click();
    await editorConsole
      .getByRole("button", { name: "Invoke copy_count" })
      .click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Simulation of copy_count" });
    await expect(dialog.getByText("on a throwaway account")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await dialog.getByRole("button", { name: "Apply to state" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      editorConsole.getByLabel(`${COUNT_READER_SLOT} value`, {
        exact: true,
      }),
    ).toHaveValue("7");
    await nextStep(page);
  });

  await test.step("4. deploy the Count Reader", async () => {
    await panel.openLink("accounts page", /\/accounts$/);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Deploy account" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    await dialog.getByLabel("Name").fill("My Count Reader");
    // Public storage and No Auth are the defaults.
    await expect(dialog.getByRole("combobox").first()).toContainText("Public");
    await expect(dialog.getByRole("combobox").nth(1)).toContainText("No Auth");
    await selectOption(page, "Account Component", "count-reader");
    await expect(dialog.getByText(COUNT_READER_SLOT)).toBeVisible();
    await dialog.getByRole("button", { name: "Deploy" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await panel.openLink("click its name", /\/accounts\/mtst1[0-9a-z]+$/);
    await nextStep(page);
  });

  await test.step("5. invoke copy_count with the Counter Contract", async () => {
    await page.getByRole("tab", { name: "Components" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Invoke Procedure" });
    // Every deployed account carries the built-in basic wallet, assembled
    // from MASM: its procedure is called by name, with its hand-written
    // signature's arguments (the recipient is a word). Previewed only.
    await procedureRow(page, "create_note")
      .getByRole("button", { name: "Invoke" })
      .click();
    await dialog.getByLabel(/^tag/).fill("0");
    await dialog.getByLabel(/^note_type/).fill("0");
    await dialog
      .getByLabel(/^recipient/)
      .fill(
        "0x0b000000000000000c000000000000000d000000000000000e00000000000000",
      );
    await dialog.getByRole("button", { name: "Preview", exact: true }).click();
    const notePreview = previewDialog(page, "create_note");
    await expect(notePreview.getByText(/1 note\s*will be created/)).toBeVisible(
      { timeout: TRANSACTION_TIMEOUT },
    );
    await notePreview.getByRole("button", { name: "Cancel" }).click();
    await expect(notePreview).toBeHidden();
    await procedureRow(page, "copy_count")
      .getByRole("button", { name: "Invoke" })
      .click();
    // Step 5 names the argument: the copy and the dialog must agree.
    await expect(dialog.getByText("counter_account_id")).toBeVisible();
    // The Count Reader isn't a counter: copy_count fails as it executes, and
    // the dialog stays on the arguments with the error.
    await dialog.getByRole("button", { name: "Select account" }).click();
    await page.getByRole("menuitemradio", { name: "My Count Reader" }).click();
    await dialog.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page.getByText("Transaction failed.")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(dialog.getByText("counter_account_id")).toBeVisible();
    await dialog.getByRole("button", { name: "My Count Reader" }).click();
    await page.getByRole("menuitemradio", { name: "Counter Contract" }).click();
    await dialog.getByRole("button", { name: "Preview", exact: true }).click();
    // Step 5 names the slot the preview changes.
    const preview = previewDialog(page, "copy_count");
    await expect(
      preview.getByRole("cell", { name: "count", exact: true }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await preview.getByRole("button", { name: "Submit" }).click();
    await expect(preview).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    // Completes once the Count Reader holds the Counter Contract's count.
    await nextStep(page);
  });

  await test.step("6. compare with the Counter Contract", async () => {
    await panel.openLink("Counter Contract", /\/accounts\/mtst1[0-9a-z]+$/);
    await page.getByRole("tab", { name: "Components" }).click();
    const getCount = procedureRow(page, "get_count");
    await getCount.getByRole("button", { name: "Invoke" }).click();
    await expect(getCount.getByRole("cell").last()).toHaveText(
      /^\d+\s*Invoke$/,
      { timeout: TRANSACTION_TIMEOUT },
    );
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
