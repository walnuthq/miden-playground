import { expect, type Page, test } from "@playwright/test";
import {
  expectStep,
  logBrowserErrors,
  nextStep,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "../tutorial";
import { expectHeaderFits, expectNoHorizontalOverflow } from "./layout";

// Closes the tutorial panel to its bar, which names the step.
const closePanel = async (page: Page, step: number) => {
  const panel = tutorialPanel(page);
  await panel.root.getByRole("button", { name: "Close tutorial" }).click();
  const bar = page.getByRole("button", { name: "Open tutorial" });
  await expect(bar).toBeVisible();
  await expect(bar).toContainText(`Step ${step} of 6`);
};

// The panel opened again by itself once its step's action was done, scrolled
// to its Next button.
const expectReopenedForNext = async (page: Page) => {
  const { nextStepButton } = tutorialPanel(page);
  await expect(nextStepButton).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await expect(nextStepButton).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Open tutorial" }),
  ).toBeHidden();
};

// On a phone the tutorial is a panel at the bottom of the screen, under the
// header: closed, it's a bar naming the step, and it opens again by itself
// when the step's action is done in the page.
test("mobile: tutorial panel", async ({ page }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Create and fund a wallet");
  await expect(page).toHaveURL(/\/accounts$/);

  await test.step("the panel and the header both show", async () => {
    await expect(panel.root).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Toggle tutorial" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectHeaderFits(page);
  });

  await test.step("1. create a wallet with the panel closed", async () => {
    await closePanel(page, 1);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Create new wallet" }).click();
    const dialog = page.getByRole("dialog", { name: "Create Wallet" });
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await expectReopenedForNext(page);
    await nextStep(page);
  });

  await test.step("2. a new step starts at its top", async () => {
    await expect
      .poll(() =>
        panel.root.locator(".overflow-y-auto").evaluate((el) => el.scrollTop),
      )
      .toBe(0);
    await nextStep(page);
    await expectStep(page, 3);
  });

  await test.step("3. mint with the panel closed", async () => {
    await closePanel(page, 3);
    await page
      .getByRole("row")
      .filter({ hasText: "MDN Faucet" })
      .getByRole("button", { name: "Open menu" })
      .click();
    await page.getByRole("menuitem", { name: "New mint transaction" }).click();
    const dialog = page.getByRole("dialog", { name: /mint transaction$/ });
    await dialog.getByRole("button", { name: "Select account" }).click();
    await page.getByRole("menuitemradio", { name: "Wallet A" }).click();
    await dialog.getByRole("spinbutton", { name: "Amount" }).fill("100");
    await dialog.getByRole("button", { name: "Preview" }).click();
    await expect(dialog.getByText("will be created as a result")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await dialog.getByRole("button", { name: "Submit" }).click();
    await expectReopenedForNext(page);
    // Toasts show at the top on a phone, off the panel's buttons.
    await expect(page.locator("[data-sonner-toaster]")).toHaveAttribute(
      "data-y-position",
      "top",
    );
    await nextStep(page);
  });
});
