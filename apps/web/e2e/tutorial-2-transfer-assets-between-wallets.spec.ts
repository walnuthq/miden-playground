import { expect, test, type Page } from "@playwright/test";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  tutorialPanel,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// Wallet A, Wallet B and the MDN Faucet are created by the tutorial store and
// shared by every Playground user, so balances are compared before and after
// rather than checked against fixed values.
const mdnBalance = async (page: Page) => {
  const row = page.getByRole("row").filter({ hasText: "MDN Faucet" });
  const amount = (await row.getByRole("cell").last().textContent()) ?? "";
  expect(amount).toMatch(/^[\d,]+(\.\d+)?$/);
  return Number(amount.replaceAll(",", ""));
};

test("tutorial 2: transfer assets between wallets", async ({ page }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Transfer assets between wallets");
  await expect(page).toHaveURL(/\/accounts$/);

  await test.step("1. explore the accounts", async () => {
    await panel.openLink("Wallet A", /\/accounts\/mtst1[0-9a-z]+$/);
    expect(await mdnBalance(page)).toBeGreaterThanOrEqual(100);
    await nextStep(page);
  });

  await test.step("2. send 100 MDN from Wallet A to Wallet B", async () => {
    await panel.openLink("Wallet A", /\/accounts\/mtst1[0-9a-z]+$/);
    await page.getByRole("button", { name: "Create new transaction" }).click();
    await page.getByRole("menuitem", { name: "New send transaction" }).click();
    // Titled "Configure send transaction", then "Preview send transaction".
    const dialog = page.getByRole("dialog", { name: /send transaction$/ });
    await dialog.getByPlaceholder("Select an account").click();
    await page.getByRole("option", { name: /Wallet B/ }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: /MDN/ }).click();
    await dialog.getByRole("spinbutton", { name: "Amount" }).fill("100");
    await dialog.getByRole("button", { name: "Preview" }).click();
    await expect(dialog.getByText("will be created as a result")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await dialog.getByRole("button", { name: "Submit" }).click();
    await nextStep(page);
  });

  await test.step("3. inspect the transaction and its output note", async () => {
    await panel.openLink(
      "opening the first item",
      /\/transactions\/0x[0-9a-f]+$/,
    );
    await expect(
      page.getByRole("row").filter({ hasText: "p2id" }).filter({
        hasText: "100 MDN",
      }),
    ).toBeVisible();
    await panel.openLink("note ID", /\/notes\/0x[0-9a-f]+$/);
    await expect(
      page.getByRole("row", { name: /Target Account ID/ }),
    ).toContainText("(Wallet B)");
    await nextStep(page);
  });

  await test.step("4. consume the note with Wallet B", async () => {
    await panel.openLink("Wallet B", /\/accounts\/mtst1[0-9a-z]+$/);
    const before = await mdnBalance(page);
    // The note shows up once the next state sync detects it.
    const consumeAll = page.getByRole("button", { name: "Consume all notes" });
    await expect(consumeAll).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await consumeAll.click();
    const submit = page.getByRole("button", { name: "Submit" });
    await expect(submit).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await submit.click();
    await nextStep(page);
    await expect
      .poll(() => mdnBalance(page), { timeout: TRANSACTION_TIMEOUT })
      .toBeGreaterThanOrEqual(before + 100);
  });

  await test.step("5. Wallet B holds the transferred MDN", async () => {
    await expect(
      panel.root.getByRole("link", { name: "Wallet B" }),
    ).toBeVisible();
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
