import { expect, type Page, test } from "@playwright/test";
import { invoke, submitPreview } from "./example";
import { networkBadge, switcher } from "./projects-menu";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// A MockChain sandbox: the chain runs in the browser, so nothing reaches a
// node, a prover or a faucet, and a block is proven after each transaction.
// Its switcher entry only shows in dev builds until the sandbox is turned on,
// so this spec is skipped against a production build.
const MOCK_TIMEOUT = 30_000;
const ACCOUNT_URL = /\/accounts\/[a-z]+1[0-9a-z]+$/;

const newMockChainSandbox = async (page: Page) => {
  await page.goto("/");
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await switcher(page).click();
  // The menu is open once its other entries show.
  await expect(
    page.getByRole("menuitem", { name: "New Testnet sandbox" }),
  ).toBeVisible();
  const entry = page.getByRole("menuitem", { name: "New MockChain sandbox" });
  test.skip(
    (await entry.count()) === 0,
    "The MockChain sandbox is only offered in dev builds",
  );
  await entry.click();
  await expect(page).toHaveURL(/\/accounts$/, { timeout: MOCK_TIMEOUT });
  // A fresh mock chain: no public faucet, and a block height of its own.
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: MOCK_TIMEOUT,
  });
};

const openAccount = async (page: Page, name: string) => {
  await page.goto("/accounts");
  await page.getByRole("cell", { name, exact: true }).click();
  await expect(page).toHaveURL(ACCOUNT_URL);
  await expect(page.getByRole("row", { name: /^Name/ })).toHaveText(
    new RegExp(`^Name\\s*${name}$`),
  );
};

const nonceRow = (page: Page) => page.getByRole("row", { name: /^Nonce/ });

// The wallet's MDN amount, the last cell of its assets table's row. The row's
// text runs its cells together ("MDN1,000"), so match the faucet's name.
const mdnAmount = (page: Page) =>
  page
    .getByRole("row")
    .filter({ hasText: "(Faucet A)" })
    .getByRole("cell")
    .last();

const createWallet = async (page: Page, name: string) => {
  await page.getByRole("button", { name: "Create new account" }).click();
  await page.getByRole("menuitem", { name: "Create new wallet" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Wallet" });
  await dialog.getByRole("textbox", { name: "Name" }).fill(name);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).toBeHidden({ timeout: MOCK_TIMEOUT });
  await expect(page.getByRole("row", { name: new RegExp(name) })).toContainText(
    "Public",
  );
};

const previewAndSubmit = async (page: Page, dialogName: RegExp) => {
  const dialog = page.getByRole("dialog", { name: dialogName });
  await dialog.getByRole("button", { name: "Preview" }).click();
  await expect(dialog.getByText("will be created as a result")).toBeVisible({
    timeout: MOCK_TIMEOUT,
  });
  await dialog.getByRole("button", { name: "Submit" }).click();
  await expect(dialog).toBeHidden({ timeout: MOCK_TIMEOUT });
};

test("MockChain sandbox: wallets, faucet, mint, consume, send", async ({
  page,
}) => {
  logBrowserErrors(page);
  await newMockChainSandbox(page);
  await expect(page.getByRole("row", { name: /USDCx/ })).toHaveCount(0);

  await test.step("create two wallets and a faucet, committed without funding", async () => {
    await createWallet(page, "Wallet A");
    await createWallet(page, "Wallet B");
    await page.getByRole("button", { name: "Create new account" }).click();
    await page
      .getByRole("menuitem", { name: "Create new fungible faucet" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Create Fungible Faucet" });
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).toBeHidden({ timeout: MOCK_TIMEOUT });
    await openAccount(page, "Wallet A");
    // The empty transaction that puts it on chain.
    await expect(nonceRow(page)).toHaveText(/^Nonce\s*1$/);
    // The mock RPC can't import an account its chain doesn't hold.
    await page.goto("/accounts");
    await page.getByRole("button", { name: "Create new account" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Deploy account" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Import account" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
  });

  await test.step("mint 1,000 MDN to Wallet A", async () => {
    await openAccount(page, "Faucet A");
    await page.getByRole("button", { name: "Create new transaction" }).click();
    await page.getByRole("menuitem", { name: "New mint transaction" }).click();
    const dialog = page.getByRole("dialog", { name: /mint transaction$/ });
    await dialog.getByRole("button", { name: "Select account" }).click();
    await page.getByRole("menuitemradio", { name: "Wallet A" }).click();
    await dialog.getByRole("spinbutton", { name: "Amount" }).fill("1000");
    await previewAndSubmit(page, /mint transaction$/);
  });

  await test.step("consume the note with Wallet A", async () => {
    await openAccount(page, "Wallet A");
    // Listed once the app's sync loop has stored the note.
    await expect(
      page.getByRole("row").filter({ hasText: "(Faucet A)" }),
    ).toBeVisible({ timeout: MOCK_TIMEOUT });
    await page.getByRole("button", { name: "Consume all notes" }).click();
    const dialog = page.getByRole("dialog", { name: /consume transaction$/ });
    await expect(dialog.getByText(/1 note will be consumed/)).toBeVisible({
      timeout: MOCK_TIMEOUT,
    });
    await dialog.getByRole("button", { name: "Submit" }).click();
    await expect(dialog).toBeHidden({ timeout: MOCK_TIMEOUT });
    await expect(mdnAmount(page)).toHaveText("1,000", {
      timeout: MOCK_TIMEOUT,
    });
    await expect(nonceRow(page)).toHaveText(/^Nonce\s*2$/);
  });

  await test.step("send 250 MDN to Wallet B, which consumes it", async () => {
    await page.getByRole("button", { name: "Create new transaction" }).click();
    await page.getByRole("menuitem", { name: "New send transaction" }).click();
    const dialog = page.getByRole("dialog", { name: /send transaction$/ });
    await dialog.getByPlaceholder("Select an account").click();
    await page.getByRole("option", { name: /Wallet B/ }).click();
    await dialog.getByRole("button", { name: "Select asset" }).click();
    await page.getByRole("menuitemradio", { name: /MDN/ }).click();
    await dialog.getByRole("spinbutton", { name: "Amount" }).fill("250");
    await previewAndSubmit(page, /send transaction$/);
    await expect(mdnAmount(page)).toHaveText("750", { timeout: MOCK_TIMEOUT });

    await openAccount(page, "Wallet B");
    await expect(
      page.getByRole("row").filter({ hasText: "(Wallet A)" }).filter({
        hasText: "250 MDN",
      }),
    ).toBeVisible({ timeout: MOCK_TIMEOUT });
    await page.getByRole("button", { name: "Consume all notes" }).click();
    const consume = page.getByRole("dialog", { name: /consume transaction$/ });
    await expect(consume.getByRole("button", { name: "Submit" })).toBeVisible({
      timeout: MOCK_TIMEOUT,
    });
    await consume.getByRole("button", { name: "Submit" }).click();
    await expect(consume).toBeHidden({ timeout: MOCK_TIMEOUT });
    await expect(mdnAmount(page)).toHaveText("250", { timeout: MOCK_TIMEOUT });
  });

  await test.step("the chain survives a reload", async () => {
    await page.reload();
    await expect(networkBadge(page)).toContainText(/#\d+/, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(mdnAmount(page)).toHaveText("250", { timeout: MOCK_TIMEOUT });
  });
});

// The sandbox starts with the counter example's packages, as a Mainnet one
// does: they need apps/api on port 3001.
test("MockChain sandbox: deploy a counter and increment it", async ({
  page,
}) => {
  logBrowserErrors(page);
  const verifications: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/verified-account-components/")) {
      verifications.push(request.url());
    }
  });
  await newMockChainSandbox(page);

  await page.getByRole("button", { name: "Create new account" }).click();
  await page.getByRole("menuitem", { name: "Deploy account" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Deploy Account" });
  await dialog.getByLabel("Name").fill("Mock Counter");
  await selectOption(page, "Account Component", "counter-account");
  await dialog.getByRole("button", { name: "Deploy" }).click();
  await expect(dialog).toBeHidden({ timeout: MOCK_TIMEOUT });

  await openAccount(page, "Mock Counter");
  await expect(nonceRow(page)).toHaveText(/^Nonce\s*1$/);
  await page.getByRole("tab", { name: "Components" }).click();
  await expect(await invoke(page, "get_count")).toHaveText(
    /^get_count\s*0\s*Invoke$/,
    {
      timeout: MOCK_TIMEOUT,
    },
  );
  await invoke(page, "increment_count");
  await submitPreview(page, "increment_count");
  await expect(async () => {
    const count = await invoke(page, "get_count");
    await expect(count).toHaveText(/^get_count\s*1\s*Invoke$/, {
      timeout: 5_000,
    });
  }).toPass({ timeout: MOCK_TIMEOUT });
  // The registry has no MockChain.
  expect(verifications).toEqual([]);
});
