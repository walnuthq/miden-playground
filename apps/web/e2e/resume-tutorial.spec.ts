import { expect, type Locator, type Page, test } from "@playwright/test";
import { launchExample } from "./example";
import {
  expectStep,
  logBrowserErrors,
  nextStep,
  startTutorial,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

const tutorial1 = "Create and fund a wallet";
const tutorial2 = "Transfer assets between wallets";

// A tutorial card on the home page, all tutorials shown.
const tutorialCard = async (page: Page, title: string) => {
  await page.goto("/");
  const showAll = page.getByRole("button", { name: /Show all \d+ tutorials/ });
  await expect(showAll).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  await showAll.click();
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title, { exact: true }) });
};

const resumeTutorial = async (page: Page, title: string) => {
  const card = await tutorialCard(page, title);
  await card.getByRole("button", { name: "Resume tutorial" }).click();
};

// Starts tutorial 1 and completes its first step, creating Wallet A. Returns
// the wallet's row: tutorial 2 seeds a "Wallet A" of its own, so it's told
// apart by its ID, as the accounts table shows it (shortened).
const startTutorial1WithWallet = async (page: Page) => {
  await startTutorial(page, tutorial1);
  await page.getByRole("button", { name: "Create new account" }).click();
  await page.getByRole("menuitem", { name: "Create new wallet" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Wallet" });
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
  const walletRow = page.getByRole("row", { name: /Wallet A/ });
  await expect(walletRow).toBeVisible();
  const walletId =
    (await walletRow.getByRole("link").first().textContent()) ?? "";
  expect(walletId).toMatch(/^mtst1/);
  await nextStep(page);
  return () => page.getByRole("row").filter({ hasText: walletId });
};

// Resumes tutorial 1 where `startTutorial1WithWallet` left it.
const expectTutorial1Resumed = async (page: Page, wallet: () => Locator) => {
  await resumeTutorial(page, tutorial1);
  await expectStep(page, 2);
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(wallet()).toBeVisible({ timeout: 60_000 });
};

// Leaving a tutorial saves it (app state and client store), and starting it
// again from the home page resumes it, until it's restarted.
test("resume a tutorial left for another one", async ({ page }) => {
  logBrowserErrors(page);
  let wallet = () => page.getByRole("row");

  await test.step("start tutorial 1 and create a wallet", async () => {
    wallet = await startTutorial1WithWallet(page);
  });

  await test.step("leave it for tutorial 2", async () => {
    await startTutorial(page, tutorial2);
    await expect(page.getByRole("row", { name: /Wallet B/ })).toBeVisible();
    await expect(wallet()).toBeHidden();
  });

  await test.step("both tutorials can be resumed", async () => {
    const card1 = await tutorialCard(page, tutorial1);
    await expect(card1.getByText("Step 2 of 6")).toBeVisible();
    await expect(
      card1.getByRole("button", { name: "Resume tutorial" }),
    ).toBeVisible();
    const card2 = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText(tutorial2, { exact: true }) });
    await expect(card2.getByText(/^Step 1 of \d+$/)).toBeVisible();
    await expect(
      card2.getByRole("button", { name: "Resume tutorial" }),
    ).toBeVisible();
  });

  await test.step("resume tutorial 1", async () => {
    await expectTutorial1Resumed(page, wallet);
  });

  await test.step("restart tutorial 1", async () => {
    const card1 = await tutorialCard(page, tutorial1);
    await card1.getByRole("button", { name: "Restart tutorial" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Restart tutorial" })
      .click();
    await expectStep(page, 1);
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByRole("row", { name: /MDN Faucet/ })).toBeVisible();
    await expect(wallet()).toBeHidden();
    // Tutorial 2 keeps its saved progress.
    const card2 = await tutorialCard(page, tutorial2);
    await expect(
      card2.getByRole("button", { name: "Resume tutorial" }),
    ).toBeVisible();
  });
});

// Launching an example or creating a sandbox leaves the tutorial too. The
// example's packages come from apps/api: run it along with the dev server.
test("resume a tutorial left for an example or a sandbox", async ({ page }) => {
  logBrowserErrors(page);
  const wallet = await startTutorial1WithWallet(page);

  await test.step("leave it for an example", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await expectTutorial1Resumed(page, wallet);
  });

  await test.step("leave it for a new sandbox", async () => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Create new sandbox environment" })
      .click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByRole("row", { name: /USDCx Faucet/ })).toBeVisible();
    await expect(wallet()).toBeHidden();
    await expectTutorial1Resumed(page, wallet);
  });
});

// A saved project the running client refuses to import (here, stamped by a
// newer client, as after a rollback) starts the tutorial over instead.
test("start over when saved progress can't be restored", async ({ page }) => {
  logBrowserErrors(page);
  const wallet = await startTutorial1WithWallet(page);
  await startTutorial(page, tutorial2);

  await test.step("stamp the saved store with a newer client", async () => {
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open("PlaygroundProjects");
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const database = open.result;
            const transaction = database.transaction("projects", "readwrite");
            const projects = transaction.objectStore("projects");
            const key = "tutorial:create-and-fund-wallet";
            const get = projects.get(key);
            get.onsuccess = () => {
              const project = get.result;
              const store = JSON.parse(project.store);
              for (const setting of store.settings) {
                if (setting.key === "clientVersion") {
                  setting.value.data = btoa("99.0.0");
                }
              }
              projects.put({ ...project, store: JSON.stringify(store) }, key);
            };
            transaction.oncomplete = () => {
              database.close();
              resolve();
            };
            transaction.onerror = () => reject(transaction.error);
          };
        }),
    );
  });

  await test.step("resuming starts tutorial 1 over", async () => {
    await resumeTutorial(page, tutorial1);
    await expect(
      page.getByText("Your saved progress couldn't be restored."),
    ).toBeVisible({ timeout: 60_000 });
    await expectStep(page, 1);
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByRole("row", { name: /MDN Faucet/ })).toBeVisible();
    await expect(wallet()).toBeHidden();
    // The fresh store works: a new wallet can be created.
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Create new wallet" }).click();
    const dialog = page.getByRole("dialog", { name: "Create Wallet" });
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await expect(page.getByRole("row", { name: /Wallet A/ })).toBeVisible();
  });
});
