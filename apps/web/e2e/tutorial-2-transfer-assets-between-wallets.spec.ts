import { expect, type Page, test } from "@playwright/test";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// Wallet A and the MDN Faucet are created by the tutorial store and shared by
// every Playground user, so Wallet A's balance is only checked loosely. Wallet B
// is created for each user, empty.
const mdnBalance = async (page: Page) => {
  const row = page.getByRole("row").filter({ hasText: "MDN Faucet" });
  const amount = (await row.getByRole("cell").last().textContent()) ?? "";
  expect(amount).toMatch(/^[\d,]+(\.\d+)?$/);
  return Number(amount.replaceAll(",", ""));
};

test("tutorial 2: transfer assets between wallets", async ({ page }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  // The URL changes before the account page renders the new account: wait for
  // it, or a menu opened on the old page gets unmounted mid-click.
  const openWallet = async (name: string) => {
    await panel.openLink(name, /\/accounts\/mtst1[0-9a-z]+$/);
    await expect(page.getByRole("row", { name: /^Name/ })).toHaveText(
      new RegExp(`^Name\\s*${name}$`),
    );
  };
  await startTutorial(page, "Transfer assets between wallets");
  await expect(page).toHaveURL(/\/accounts$/);

  await test.step("1. explore the accounts", async () => {
    await openWallet("Wallet B");
    await expect(page.getByRole("row", { name: /^Nonce/ })).toHaveText(
      /^Nonce\s*0$/,
    );
    await openWallet("Wallet A");
    expect(await mdnBalance(page)).toBeGreaterThanOrEqual(100);
    await nextStep(page);
  });

  await test.step("2. send 100 MDN from Wallet A to Wallet B", async () => {
    await openWallet("Wallet A");
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
    // The note page renders once the next state sync stores the output note.
    await expect(
      page.getByRole("row", { name: /Target Account ID/ }),
    ).toContainText("(Wallet B)", { timeout: 60_000 });
    // Unlocks once the fee note requested for Wallet B is committed: the
    // faucet batches requests, which can take a few minutes.
    await nextStep(page, { timeout: 2 * TRANSACTION_TIMEOUT });
  });

  await test.step("4. consume the MDN and fee notes with Wallet B", async () => {
    await openWallet("Wallet B");
    // Wallet B is new and empty: it pays the fee out of the USDCx note the
    // Playground requested for it, consumed along with the MDN note.
    await expect(
      page.getByRole("row").filter({ hasText: "(Wallet A)" }).filter({
        hasText: "100 MDN",
      }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await page.getByRole("button", { name: "Consume all notes" }).click();
    const dialog = page.getByRole("dialog", { name: /consume transaction$/ });
    await expect(
      dialog.getByText(/2 notes will be consumed as a result/),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await dialog.getByRole("button", { name: "Submit" }).click();
    await nextStep(page);
    await expect
      .poll(() => mdnBalance(page), { timeout: TRANSACTION_TIMEOUT })
      .toBe(100);
    await expect(page.getByRole("row", { name: /^Nonce/ })).toHaveText(
      /^Nonce\s*1$/,
    );
  });

  await test.step("5. Wallet B holds the transferred MDN", async () => {
    await expect(
      panel.root.getByRole("link", { name: "Wallet B" }),
    ).toBeVisible();
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
