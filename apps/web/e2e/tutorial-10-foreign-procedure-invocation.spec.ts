import { expect, type Page, test } from "@playwright/test";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The counter's slot, in the Count Reader's Simulate tab.
const COUNTER_SLOT = "counter_account::counter_contract::count_map";

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
    await panel.openLink("count-reader script", /\/scripts\/count-reader$/);
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
    await dialog.getByRole("button", { name: "Apply to storage" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      editorConsole.getByLabel("count_reader::count_reader::count value", {
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
    await selectOption(page, "Account Component", "Count Reader");
    await expect(
      dialog.getByText("count_reader::count_reader::count"),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Deploy" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await panel.openLink("click its name", /\/accounts\/mtst1[0-9a-z]+$/);
    await nextStep(page);
  });

  await test.step("5. invoke copy_count with the Counter Contract", async () => {
    await page.getByRole("tab", { name: "Components" }).click();
    await procedureRow(page, "copy_count")
      .getByRole("button", { name: "Invoke" })
      .click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Invoke Procedure" });
    // Step 5 names the argument: the copy and the dialog must agree.
    await expect(dialog.getByText("param_0")).toBeVisible();
    await dialog.getByRole("button", { name: "Select account" }).click();
    await page.getByRole("menuitemradio", { name: "Counter Contract" }).click();
    await dialog.getByRole("button", { name: "Invoke", exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
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
