import type { Page } from "@playwright/test";
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

// The increment note is created by a new Bread Wallet (see ./bread.ts),
// funded from its "Fund your wallet" prompt first, then consumed by the
// counter contract (No Auth, so without signing). Compiling scripts goes
// through apps/api: run it along with the dev server.
const createScript = async (
  page: Page,
  { name, type, example }: { name: string; type: string; example: string },
) => {
  await page.getByRole("button", { name: "Create new script" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create Script" });
  await dialog.getByLabel("Name").fill(name);
  await selectOption(page, "Type", type);
  await selectOption(page, "Example", example);
  await dialog.getByRole("button", { name: "Create" }).click();
  // The Playground opens the new script.
  await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
};

const compile = async (page: Page) => {
  // The Compile button is under the editor, in the Rust tab.
  await page.getByRole("tab", { name: "Rust" }).click();
  await page.getByRole("button", { name: "Compile" }).click();
  await expect(
    page.getByText("Script compiled successfully.").last(),
  ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
};

test("tutorial 11: your first smart contract and custom note", async ({
  page,
  bread,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await bread.fund();
  await startTutorial(page, "Your first smart contract and custom note");
  await expect(page).toHaveURL(/\/scripts$/);

  await test.step("1. create the counter-account script", async () => {
    // The tutorial derives the storage slot name from this exact name.
    await createScript(page, {
      name: "counter-account",
      type: "Account Component",
      example: "Counter Contract",
    });
    await nextStep(page);
  });

  await test.step("2. compile the counter contract", async () => {
    await compile(page);
    // Moving on creates the Counter Contract account component.
    await nextStep(page);
  });

  await test.step("3. create the note script and add its dependency", async () => {
    await panel.openLink("scripts page", /\/scripts$/);
    await createScript(page, {
      name: "increment-note",
      type: "Note Script",
      example: "Counter Note",
    });
    await page.getByRole("tab", { name: "Metadata" }).click();
    await page.getByRole("button", { name: "Add dependency" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Add Dependency" });
    await selectOption(page, "Dependency", "counter-account");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dialog).toBeHidden();
    await nextStep(page);
  });

  await test.step("4. compile the note script", async () => {
    await compile(page);
    await nextStep(page);
  });

  await test.step("5. deploy the counter contract", async () => {
    await panel.openLink("accounts page", /\/accounts$/);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Deploy account" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    await dialog.getByLabel("Name").fill("My Counter");
    // Public storage and No Auth are the defaults.
    await expect(dialog.getByRole("combobox").first()).toHaveText("Public");
    await expect(dialog.getByRole("combobox").nth(1)).toHaveText("No Auth");
    await selectOption(page, "Account Component", "Counter Contract");
    await expect(
      dialog.getByLabel("counter_account::counter_contract::count_map"),
    ).toHaveValue("1:0");
    await dialog.getByRole("button", { name: "Deploy" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await nextStep(page);
  });

  await test.step("6. create the increment note", async () => {
    await bread.connect(page);
    await panel.openLink("notes page", /\/notes$/);
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await pickAccount(dialog, "My Counter");
    await selectOption(page, "Script", "increment-note");
    await expect(
      dialog.getByRole("switch", { name: /Network note/ }),
    ).not.toBeChecked();
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    // Completes once the note is committed.
    await nextStep(page);
  });

  await test.step("7. consume the note with the counter contract", async () => {
    await panel.openLink(
      "counter contract's details page",
      /\/accounts\/mtst1[0-9a-z]+$/,
    );
    const noteRow = page
      .getByRole("row")
      .filter({ has: page.getByRole("button", { name: "Open menu" }) });
    await expect(noteRow).toHaveCount(1, { timeout: TRANSACTION_TIMEOUT });
    await noteRow.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("menuitem", { name: /^Consume note with / }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: /consume transaction/i });
    const submit = dialog.getByRole("button", { name: "Submit" });
    await expect(submit).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await submit.click();
    await expect(noteRow).toHaveCount(0, { timeout: TRANSACTION_TIMEOUT });
    await nextStep(page);
  });

  await test.step("8. the count is 1", async () => {
    await page.getByRole("tab", { name: "Components" }).click();
    const getCount = page
      .getByRole("row")
      .filter({ has: page.getByText("get_count", { exact: true }) })
      .last();
    await expect(async () => {
      await getCount.getByRole("button", { name: "Invoke" }).click();
      await expect(getCount.getByRole("cell").last()).toHaveText(
        /^1\s*Invoke$/,
        { timeout: 10_000 },
      );
    }).toPass({ timeout: TRANSACTION_TIMEOUT });
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
