import { expect, type Page, test } from "@playwright/test";
import { waitForEditorText } from "../editor";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  tutorialPanel,
} from "../tutorial";
import {
  closePanel,
  expectNoHorizontalOverflow,
  expectWithinWidth,
} from "./layout";

// The collapsed console: its header bar only (as in script-layout.spec.ts).
const COLLAPSED_HEIGHT = 52;

const editorConsole = (page: Page) =>
  page.getByRole("region", { name: "Editor Console" });

const consoleHeight = async (page: Page) =>
  (await editorConsole(page).boundingBox())?.height ?? 0;

// A tutorial's read-only script that can be simulated has a console, whose
// bar takes height from the page above the closed tutorial panel: the source
// stays readable, and the page fits the screen (down to 320 px in
// `mobile-small`), console collapsed and open.
test("mobile: a tutorial's read-only script fits the screen", async ({
  page,
}) => {
  logBrowserErrors(page);
  await startTutorial(page, "Foreign procedure invocation");
  await nextStep(page);
  await tutorialPanel(page).openLink(
    "count-reader script",
    /\/scripts\/count-reader$/,
  );
  await closePanel(page, 2);
  await waitForEditorText(page, "fn copy_count");
  // No Compile button: the console is there for its Simulate tab.
  await expect(page.getByRole("button", { name: "Compile" })).toHaveCount(0);
  await expect
    .poll(() => consoleHeight(page))
    .toBeLessThanOrEqual(COLLAPSED_HEIGHT);
  // The source keeps most of the page.
  const source = page.getByRole("tabpanel").locator(".view-lines").first();
  await expect
    .poll(async () => (await source.boundingBox())?.height ?? 0)
    .toBeGreaterThan(200);
  await expectNoHorizontalOverflow(page);
  await editorConsole(page)
    .getByRole("button", { name: "Restore console" })
    .click();
  await expect.poll(() => consoleHeight(page)).toBeGreaterThan(100);
  await expect(
    editorConsole(page).getByRole("button", { name: "Invoke copy_count" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  // The argument's field carries the parameter's name from the WIT, the
  // longest of the tutorials' (`counter_account_id`).
  await expectWithinWidth(
    editorConsole(page)
      .locator("label")
      .filter({ hasText: /^counter_account_id/ }),
  );
  await expectWithinWidth(
    editorConsole(page).getByRole("button", { name: "Select account" }),
  );
  // The Manifest tab's signature line names it too, wrapped to fit.
  await page.getByRole("tab", { name: "Manifest" }).click();
  await expectWithinWidth(
    page
      .getByTestId("editor")
      .getByText("fn copy_count(counter_account_id: AccountId)"),
  );
  await expectNoHorizontalOverflow(page);
});

// The Rust basic wallet's procedures take types the form doesn't know,
// entered as raw felts: one input for a note index, a group of four for a
// recipient (a word), two by two on a phone.
test("mobile: raw felt arguments fit the screen", async ({ page }) => {
  logBrowserErrors(page);
  await startTutorial(page, "Timelock P2ID note");
  // Step 1 asks for a script: step 2 links to the wallet's.
  await closePanel(page, 1);
  await page.getByRole("button", { name: "Create new script" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create Script" });
  await dialog.getByLabel("Name").fill("timelock-p2id");
  await selectOption(page, "Type", "Note Script");
  await selectOption(page, "Example", "P2ID Note");
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
  await nextStep(page);
  // Not `openLink`, which expects a script named as its id.
  await tutorialPanel(page)
    .root.locator("a")
    .filter({ hasText: /^basic-wallet$/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/scripts\/rust-basic-wallet$/);
  await closePanel(page, 2);
  await waitForEditorText(page, "fn create_note");
  await editorConsole(page)
    .getByRole("button", { name: "Restore console" })
    .click();
  await expect(
    editorConsole(page).getByRole("button", { name: "Invoke create_note" }),
  ).toBeVisible();
  const recipient = editorConsole(page).getByRole("group", {
    name: /^recipient/,
  });
  await expect(recipient).toContainText("recipient, 4 felts");
  for (const name of ["a", "b", "c", "d"]) {
    await expectWithinWidth(recipient.getByLabel(`recipient ${name}`));
  }
  await expectWithinWidth(
    recipient.getByText(
      "Entered as raw felts: the form doesn't know this type.",
    ),
  );
  await expectWithinWidth(editorConsole(page).getByLabel(/^note_idx/));
  // The longest name breaks: its row's button stays on the screen.
  await expectWithinWidth(
    editorConsole(page).getByRole("button", {
      name: "Invoke move_asset_to_note",
    }),
  );
  await expectNoHorizontalOverflow(page);
});
