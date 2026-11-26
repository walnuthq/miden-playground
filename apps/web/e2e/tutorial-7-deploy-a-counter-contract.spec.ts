import { expect, type Page, test } from "@playwright/test";
import { COMPILED, replaceInEditor, scriptHeader } from "./editor";
import { submitPreview } from "./example";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// Tutorial 7 needs no wallet: the contract uses No Auth. The script is created
// and compiled through apps/api and the compile service: run them along with
// the dev server.
// The deployed contract is new, so its count goes from 0 to INCREMENT.
const INCREMENT = 5;
// The tutorial leaves the script's name to the user. The storage slot's name
// is the template's (counter-account.masm), whatever the script's: the edit
// leaves it alone, so the script keeps its schema and the typed forms.
const SCRIPT_NAME = "counter-v2";
const SLOT_NAME = "counter_account::count_map";

const invoke = async (page: Page, procedure: string) => {
  const row = page
    .getByRole("row")
    .filter({ has: page.getByText(procedure, { exact: true }) })
    // The innermost row: the component's row contains its procedures table.
    .last();
  await row.getByRole("button", { name: "Invoke" }).click();
  return row.getByRole("cell").last();
};

test("tutorial 7: deploy a counter contract", async ({ page }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Deploy a counter contract");
  await expect(page).toHaveURL(/\/scripts$/);

  await test.step("1. create a script from the Counter Contract example", async () => {
    await page.getByRole("button", { name: "Create new script" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await dialog.getByLabel("Name").fill(SCRIPT_NAME);
    await selectOption(page, "Type", "Account Component");
    await selectOption(page, "Example", "Counter Contract");
    await dialog.getByRole("button", { name: "Create" }).click();
    // The Playground opens the new script, whose ID is the API's UUID.
    await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/);
    // The header shows the script's name, not its ID.
    await expect(scriptHeader(page).name).toHaveText(SCRIPT_NAME);
    await nextStep(page);
  });

  await test.step(`2. increment by ${INCREMENT} and compile`, async () => {
    // The step isn't done by the edit alone: the script must compile.
    // The source file is named after the script.
    await expect(
      page.getByText("counter_v2.masm", { exact: true }).first(),
    ).toBeVisible();
    await replaceInEditor(page, "add.1", `add.${INCREMENT}`);
    await expect(scriptHeader(page).status).toHaveText("Draft");
    await expect(panel.nextStepButton).toBeDisabled();
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(scriptHeader(page).status).toHaveText("Compiled");
    await nextStep(page);
  });

  await test.step("3. the contract's storage layout", async () => {
    // No action: the step quotes the slot's name, which the compile kept in
    // the script's schema and the Simulate tab lists.
    await expect(panel.root.getByText(SLOT_NAME).first()).toBeVisible();
    await expect(panel.nextStepButton).toBeEnabled();
    // openLink expects a page named after its id: this one shows its name.
    await panel.root.getByRole("link", { name: "script's code" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/);
    await expect(scriptHeader(page).name).toHaveText(SCRIPT_NAME);
    const editorConsole = page.getByRole("region", { name: "Editor Console" });
    await editorConsole.getByRole("tab", { name: "Simulate" }).click();
    await expect(editorConsole.getByText(SLOT_NAME)).toBeVisible();
    await nextStep(page);
  });

  await test.step("4. deploy the counter contract", async () => {
    await panel.openLink("accounts page", /\/accounts$/);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Deploy account" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    await dialog.getByLabel("Name").fill("My Counter Contract");
    // Public storage and No Auth are the defaults.
    await expect(dialog.getByRole("combobox").first()).toContainText("Public");
    await expect(dialog.getByRole("combobox").nth(1)).toContainText("No Auth");
    await selectOption(page, "Account Component", SCRIPT_NAME);
    // Its slot comes from the compiled script's storage layout: the map
    // starts empty.
    await expect(dialog.getByText(SLOT_NAME)).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Add entry" }),
    ).toBeVisible();
    await expect(dialog.getByPlaceholder("Key")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Deploy" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await nextStep(page);
  });

  // A key the map never had reads as zero: the deployed counter starts at 0.
  await test.step(`5. increment the counter by ${INCREMENT}`, async () => {
    await panel.openLink("Click its name", /\/accounts\/mtst1[0-9a-z]+$/);
    await page.getByRole("tab", { name: "Components" }).click();
    const count = await invoke(page, "get_count");
    await expect(count).toHaveText(/^0\s*Invoke$/, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await invoke(page, "increment_count");
    await submitPreview(page, "increment_count");
    // Completes once the increment transaction is committed.
    await nextStep(page);
  });

  await test.step(`6. the count is ${INCREMENT}`, async () => {
    await expect(async () => {
      const count = await invoke(page, "get_count");
      await expect(count).toHaveText(new RegExp(`^${INCREMENT}\\s*Invoke$`), {
        timeout: 10_000,
      });
    }).toPass({ timeout: TRANSACTION_TIMEOUT });
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
