import { expect, type Page, test } from "@playwright/test";
import { COMPILED, waitForEditorText } from "../editor";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "../tutorial";
import { closePanel } from "./layout";

// The editor is read-only on a phone: the tutorial steps that ask for code
// have buttons that add it to the script, which these tests use to complete
// them. Tutorials 7 and 8 compile through the web app's local mocks, tutorial
// 12 through apps/api and the compile service, which checks that the code
// the buttons add compiles.

// Creates the step's script from the "Create Script" dialog, with the panel
// closed, and waits for the panel to open again on the completed step.
const createScript = async (
  page: Page,
  { name, type, example }: { name: string; type: string; example: string },
) => {
  await closePanel(page, 1);
  await page.getByRole("button", { name: "Create new script" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create Script" });
  await dialog.getByLabel("Name").fill(name);
  await selectOption(page, "Type", type);
  await selectOption(page, "Example", example);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
  await nextStep(page);
};

const compile = async (page: Page) => {
  await page.getByRole("button", { name: "Compile", exact: true }).click();
  await expect(page.getByText(COMPILED).last()).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
};

// The open source editor's text.
const editorSource = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          monaco: {
            editor: { getEditors: () => { getValue: () => string }[] };
          };
        }
      ).monaco.editor
        .getEditors()[0]
        ?.getValue() ?? "",
  );

test("mobile: tutorial 7's increment, added by its button", async ({
  page,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Deploy a counter contract");
  await createScript(page, {
    name: "my-counter",
    type: "Account Component",
    example: "Counter Contract",
  });

  await test.step("the editor is read-only", async () => {
    await waitForEditorText(page, "current_value + felt!(1)");
    const before = await editorSource(page);
    // Focused rather than clicked: the open tutorial panel covers part of
    // the editor, and the point to click varies with the engine's layout.
    await page.locator(".monaco-editor textarea").first().focus();
    await page.keyboard.type("typed");
    expect(await editorSource(page)).toBe(before);
  });

  await test.step("2. change the increment and compile", async () => {
    await panel.root
      .getByRole("button", { name: "Change it to felt!(5) for me" })
      .click();
    await waitForEditorText(page, "current_value + felt!(5)");
    await expect(
      panel.root.getByRole("button", { name: "Increment value changed" }),
    ).toBeDisabled();
    await compile(page);
    await nextStep(page);
  });
});

test("mobile: tutorial 8's timelock, added by its buttons", async ({
  page,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Timelock P2ID note");
  await createScript(page, {
    name: "timelock-p2id",
    type: "Note Script",
    example: "P2ID Note",
  });
  await nextStep(page);

  await test.step("3. add the timelock and compile", async () => {
    await panel.root
      .getByRole("button", { name: "Apply to my script" })
      .click();
    await waitForEditorText(page, "felt!(3)");
    // The last snippet's button adds the two before it too.
    await panel.root
      .getByRole("button", { name: "Add to my script" })
      .last()
      .click();
    await waitForEditorText(page, "assert!(block_number >= timelock_height);");
    await expect(panel.root.getByRole("button", { name: "Added" })).toHaveCount(
      3,
    );
    await expect(
      panel.root.getByRole("button", { name: "Add to my script" }),
    ).toHaveCount(0);
    await compile(page);
    // Moving on creates the Test Wallet, the note's target account.
    await nextStep(page);
  });
});

test("mobile: tutorial 12's reset_count, added by its buttons", async ({
  page,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Contract verification");
  // The script name has a random suffix, unique to this run.
  const scriptName = (await panel.root
    .locator("strong")
    .filter({ hasText: /^counter-account-/ })
    .first()
    .textContent()) as string;
  await createScript(page, {
    name: scriptName,
    type: "Account Component",
    example: "Counter Contract",
  });

  await test.step("2. add reset_count and compile", async () => {
    // The implementation's button declares it in the trait too.
    await panel.root
      .getByRole("button", { name: "Add to my script" })
      .first()
      .click();
    await waitForEditorText(page, "fn reset_count(&mut self) {");
    await waitForEditorText(page, "fn reset_count(&mut self);");
    await expect(panel.root.getByRole("button", { name: "Added" })).toHaveCount(
      2,
    );
    await compile(page);
    await nextStep(page);
  });
});
