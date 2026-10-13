import { expect, type Locator, type Page } from "@playwright/test";

// Testnet transactions are executed, proven (remotely) and submitted from the
// browser, so they take from a few seconds to a couple of minutes.
export const TRANSACTION_TIMEOUT = 3 * 60_000;

// Helpers for driving the tutorial side panel.
export const tutorialPanel = (page: Page) => {
  const root = page.locator("#tutorial");
  return {
    root,
    step: root.getByText(/^Step \d+ of \d+$/),
    nextStepButton: root.getByRole("button", { name: "Next step", exact: true }),
    nextTutorialButton: root.getByRole("button", { name: "Next tutorial" }),
    // Clicks a step link (e.g. "faucet page", "Click here") once its target is known: links built from synced
    // state (e.g. the minted note) point to ".../undefined" until the next
    // state sync picks it up. A step can mention the same link several times.
    openLink: async (name: string, href: RegExp) => {
      const link = root
        .locator("a")
        .filter({ hasText: new RegExp(`^${name}$`) })
        .first();
      await expect(link).toHaveAttribute("href", href, {
        timeout: TRANSACTION_TIMEOUT,
      });
      await link.click();
      await expect(page).toHaveURL(href);
    },
  };
};

export const startTutorial = async (page: Page, title: string) => {
  await page.goto("/");
  // The Playground syncs with testnet before rendering, which can be slow.
  const showAll = page.getByRole("button", { name: /Show all \d+ tutorials/ });
  await expect(showAll).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  await showAll.click();
  const card: Locator = page
    .locator("div")
    .filter({ has: page.getByText(title, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Start tutorial" }) })
    .last();
  await card.getByRole("button", { name: "Start tutorial" }).click();
  await expectStep(page, 1);
};

export const expectStep = async (page: Page, step: number) =>
  expect(tutorialPanel(page).step).toHaveText(new RegExp(`^Step ${step} of`), {
    timeout: 60_000,
  });

// Waits for the current step to be completed, then moves to the next one.
export const nextStep = async (
  page: Page,
  { timeout = TRANSACTION_TIMEOUT }: { timeout?: number } = {},
) => {
  const { step, nextStepButton } = tutorialPanel(page);
  const current = Number((await step.textContent())?.match(/Step (\d+)/)?.[1]);
  await expect(nextStepButton).toBeEnabled({ timeout });
  await nextStepButton.click();
  await expectStep(page, current + 1);
};

// Surfaces browser errors and error toasts in the test output, so a failure
// caused by the app (or testnet) is visible without opening the trace.
export const logBrowserErrors = (page: Page) => {
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.log(`[browser error] ${message.text().slice(0, 500)}`);
    }
  });
  page.on("pageerror", (error) => {
    console.log(`[page error] ${error.message.slice(0, 500)}`);
  });
};
