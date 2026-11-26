import { expect, test } from "@playwright/test";
import {
  expectStep,
  logBrowserErrors,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// Creating the count-reader script from its template.
const CREATE_SCRIPT = "**/scripts";

// Tutorial 10 fetches its scripts from the API when it starts (the counter
// example's counter-account and the count-reader template, assembled by the
// API), and adds the Counter Contract account that runs the first. When the
// API can't create them it still opens, with a warning, and its steps offer
// to restart it, which fetches them again. No wallet needed: nothing is
// deployed.
test("tutorial 10 started without the API offers to restart", async ({
  page,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  const alert = panel.root.getByText(
    "The tutorial's scripts couldn't be loaded.",
  );
  const cell = (name: string) => page.getByRole("cell", { name, exact: true });

  await test.step("start the tutorial while the API is down", async () => {
    await page.route(CREATE_SCRIPT, (route) =>
      route.request().method() === "POST" ? route.abort() : route.continue(),
    );
    await startTutorial(page, "Foreign procedure invocation");
    await expect(
      page.getByText("The tutorial's scripts couldn't be added."),
    ).toBeVisible();
    await expect(alert).toBeVisible();
    await page.getByRole("link", { name: "Scripts", exact: true }).click();
    await expect(cell("No results.")).toBeVisible();
  });

  await test.step("restart it once the API answers", async () => {
    await page.unroute(CREATE_SCRIPT);
    await panel.root.getByRole("button", { name: "Restart tutorial" }).click();
    await expect(alert).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await expectStep(page, 1);
    await page.getByRole("link", { name: "Scripts", exact: true }).click();
    await expect(cell("counter-account")).toBeVisible();
    await expect(cell("count-reader")).toBeVisible();
    await page.getByRole("link", { name: "Accounts", exact: true }).click();
    await expect(cell("Counter Contract")).toBeVisible();
  });
});
