import { expect, test } from "@playwright/test";
import {
  expectStep,
  logBrowserErrors,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

const EXAMPLE_IMPORT = "**/scripts/examples/counter-account";

const SLOT = "counter_account::counter_contract::count_map";

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

  await test.step("simulate its read-only note on the simulated account", async () => {
    // The tutorial's scripts are read-only, and can be simulated: the console
    // opens on Simulate, without a Compile button.
    await page.getByRole("link", { name: "increment-note" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    const editorConsole = page.getByRole("region", { name: "Editor Console" });
    await expect(
      editorConsole.getByRole("tab", { name: "Simulate", selected: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Compile" })).toHaveCount(0);
    const target = editorConsole
      .locator("div")
      .filter({ has: page.getByText("Target account", { exact: true }) })
      .last()
      .getByRole("button");
    await target.click();
    await page
      .getByRole("menuitemradio", { name: "Simulated account", exact: true })
      .click();
    // Its `counter-account` dependency resolves to the workspace's read-only
    // counter, whose storage schema gives the slot.
    const counter = editorConsole.getByRole("region", {
      name: "Simulated account counter-account",
    });
    await counter.getByRole("button", { name: "Add entry" }).click();
    await counter.getByLabel(`${SLOT} key 1`).fill("1");
    await counter.getByLabel(`${SLOT} value 1`).fill("5");
    await editorConsole
      .getByRole("button", { name: "Simulate", exact: true })
      .click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Simulation of increment-note" });
    await expect(dialog.getByText("on a throwaway account")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await dialog.getByRole("button", { name: "Apply to storage" }).click();
    await expect(dialog).toBeHidden();
    await expect(counter.getByLabel(`${SLOT} value 1`)).toHaveValue("6");
  });
});
