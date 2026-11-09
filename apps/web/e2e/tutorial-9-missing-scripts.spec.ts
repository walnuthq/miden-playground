import { expect, test } from "@playwright/test";
import {
  expectStep,
  logBrowserErrors,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

const EXAMPLE_IMPORT = "**/scripts/examples/counter-account";

// Tutorial 9 fetches its scripts from the API when it starts (the counter
// example's precompiled packages). When the API can't be reached it still
// opens, with a warning, and its steps offer to restart it, which fetches
// them again. No wallet needed: nothing is deployed.
test("tutorial 9 started without the API offers to restart", async ({
  page,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  const alert = panel.root.getByText(
    "The tutorial's scripts couldn't be loaded.",
  );
  const scriptCell = (name: string) =>
    page.getByRole("cell", { name, exact: true });
  const openScripts = () =>
    page.getByRole("link", { name: "Scripts", exact: true }).click();

  await test.step("start the tutorial while the API is down", async () => {
    await page.route(EXAMPLE_IMPORT, (route) => route.abort());
    await startTutorial(page, "Network transactions");
    await expect(
      page.getByText("The tutorial's scripts couldn't be added."),
    ).toBeVisible();
    await expect(alert).toBeVisible();
    await openScripts();
    // The scripts page leaves the built-in scripts out: nothing to list.
    await expect(scriptCell("No results.")).toBeVisible();
  });

  await test.step("restart it once the API answers", async () => {
    await page.unroute(EXAMPLE_IMPORT);
    await panel.root.getByRole("button", { name: "Restart tutorial" }).click();
    await expect(alert).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await expectStep(page, 1);
    await openScripts();
    await expect(scriptCell("counter-account")).toBeVisible();
    await expect(scriptCell("increment-note")).toBeVisible();
  });
});
