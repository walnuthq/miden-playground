import { expect, type Page, test } from "@playwright/test";
import { waitForEditorText } from "../editor";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  tutorialPanel,
} from "../tutorial";
import { closePanel, expectNoHorizontalOverflow } from "./layout";

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
});
