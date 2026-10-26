import { expect, type Page, test } from "@playwright/test";
import { replaceInEditor, waitForEditorText } from "./editor";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The script is created and compiled by the web app's local mocks
// (lib/mock-api.ts), not apps/api.
// The deployed contract is new, so its count goes from 0 to INCREMENT.
const INCREMENT = 5;
const SLOT_NAME = "counter_contract::counter_contract::count_map";

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
    await dialog.getByLabel("Name").fill("my-counter");
    await selectOption(page, "Type", "Account Component");
    await selectOption(page, "Example", "Counter Contract");
    await dialog.getByRole("button", { name: "Create" }).click();
    // The Playground opens the new script, whose ID comes from the example's
    // package name.
    await expect(page).toHaveURL(/\/scripts\/counter-account_[0-9a-f-]+$/);
    await nextStep(page);
  });

  await test.step(`2. increment by ${INCREMENT} and compile`, async () => {
    await replaceInEditor(page, "felt!(1)", `felt!(${INCREMENT})`);
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText("Script compiled successfully.")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await page.getByRole("tab", { name: "MASM" }).click();
    await waitForEditorText(page, `add.${INCREMENT}`);
    await nextStep(page);
  });

  await test.step("3. create an account component", async () => {
    await panel.openLink("components page", /\/components$/);
    await page.getByRole("button", { name: "Create new component" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Create Component" });
    await dialog.getByLabel("Name").fill("My Counter");
    await selectOption(page, "Type", "Account Component");
    await selectOption(page, "Script", "my-counter");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/components\/[^/]+$/);
    await nextStep(page);
  });

  await test.step("4. add the count_map storage slot", async () => {
    await page.getByRole("button", { name: "Add storage slot" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Create Storage Slot" });
    await dialog.getByLabel("Name").fill(SLOT_NAME);
    await selectOption(page, "Type", "Map");
    await dialog.getByRole("button", { name: "Add key-value pair" }).click();
    await dialog.getByPlaceholder("Key").fill("1");
    await dialog.getByPlaceholder("Value").fill("0");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).toBeHidden();
    await nextStep(page);
  });

  await test.step("5. deploy the counter contract", async () => {
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
    await selectOption(page, "Account Component", "My Counter");
    await expect(dialog.getByText(SLOT_NAME)).toBeVisible();
    await dialog.getByRole("button", { name: "Deploy" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await nextStep(page);
  });

  await test.step(`6. increment the counter by ${INCREMENT}`, async () => {
    await panel.openLink("Click its name", /\/accounts\/mtst1[0-9a-z]+$/);
    await page.getByRole("tab", { name: "Components" }).click();
    const count = await invoke(page, "get_count");
    await expect(count).toHaveText(/^0\s*Invoke$/, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await invoke(page, "increment_count");
    // Completes once the increment transaction is committed.
    await nextStep(page);
  });

  await test.step(`7. the count is ${INCREMENT}`, async () => {
    await expect(async () => {
      const count = await invoke(page, "get_count");
      await expect(count).toHaveText(new RegExp(`^${INCREMENT}\\s*Invoke$`), {
        timeout: 10_000,
      });
    }).toPass({ timeout: TRANSACTION_TIMEOUT });
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
