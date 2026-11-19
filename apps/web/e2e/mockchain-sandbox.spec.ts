import { expect, type Page, test } from "@playwright/test";
import { invoke, submitPreview } from "./example";
import { clickProjectsItem, networkBadge, switcher } from "./projects-menu";
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

// A project's snapshot carries its chain with its store: a mock chain lives in
// the client's memory, and a store only syncs with the chain it came from.
test("MockChain sandbox: a saved project opens on its own chain", async ({
  page,
}) => {
  logBrowserErrors(page);
  await newMockChainSandbox(page);
  await createWallet(page, "Wallet A");

  await test.step("save it, then go on in a new MockChain sandbox", async () => {
    await clickProjectsItem(page, "Save");
    const dialog = page.getByRole("dialog", { name: /^Save Project/ });
    await dialog.getByLabel("Name").fill("Mock one");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Project saved.").last()).toBeVisible();
    await expect(switcher(page)).toContainText("Mock one");
    await createWallet(page, "Wallet B");
    await newMockChainSandbox(page);
    await expect(page.getByRole("row", { name: /Wallet/ })).toHaveCount(0);
    await createWallet(page, "Wallet C");
  });

  await test.step("open the project: its accounts, on a chain that takes a transaction", async () => {
    await clickProjectsItem(page, "Mock one MockChain");
    await expect(switcher(page)).toContainText("Mock one", {
      timeout: MOCK_TIMEOUT,
    });
    await expect(page.getByRole("row", { name: /Wallet A/ })).toBeVisible({
      timeout: MOCK_TIMEOUT,
    });
    await expect(page.getByRole("row", { name: /Wallet [BC]/ })).toHaveCount(0);
    await createWallet(page, "Wallet D");
    await openAccount(page, "Wallet D");
    await expect(nonceRow(page)).toHaveText(/^Nonce\s*1$/, {
      timeout: MOCK_TIMEOUT,
    });
    await openAccount(page, "Wallet A");
    await expect(nonceRow(page)).toHaveText(/^Nonce\s*1$/);
  });

  await test.step("and after a reload", async () => {
    await page.reload();
    await expect(networkBadge(page)).toContainText(/#\d+/, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(nonceRow(page)).toHaveText(/^Nonce\s*1$/);
  });
});

// Truncates the chain saved with a project, which the client then refuses.
const corruptProjectChain = (page: Page, name: string) =>
  page.evaluate(
    (name) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("PlaygroundProjects");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const transaction = database.transaction("projects", "readwrite");
          const projects = transaction.objectStore("projects");
          const cursor = projects.openCursor();
          cursor.onsuccess = () => {
            const entry = cursor.result;
            if (!entry) {
              return;
            }
            if (entry.value.name === name) {
              const { chain, transport } = entry.value.mockChain;
              entry.update({
                ...entry.value,
                mockChain: { chain: chain.slice(0, 16), transport },
              });
            }
            entry.continue();
          };
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    name,
  );

test("MockChain sandbox: a project whose chain can't be loaded falls back to a new sandbox", async ({
  page,
}) => {
  logBrowserErrors(page);
  await newMockChainSandbox(page);
  await createWallet(page, "Wallet A");
  await clickProjectsItem(page, "Save");
  const dialog = page.getByRole("dialog", { name: /^Save Project/ });
  await dialog.getByLabel("Name").fill("Mock broken");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Project saved.").last()).toBeVisible();
  await corruptProjectChain(page, "Mock broken");
  await newMockChainSandbox(page);

  await clickProjectsItem(page, "Mock broken MockChain");
  await expect(page.getByText("The project couldn't be restored.")).toBeVisible(
    { timeout: MOCK_TIMEOUT },
  );
  await expect(switcher(page)).toContainText("MockChain sandbox");
  await expect(page.getByRole("row", { name: /Wallet/ })).toHaveCount(0);
  // The new sandbox's store and chain agree.
  await createWallet(page, "Wallet B");
  await openAccount(page, "Wallet B");
  await expect(nonceRow(page)).toHaveText(/^Nonce\s*1$/, {
    timeout: MOCK_TIMEOUT,
  });
});

// Two tabs would each run a chain of their own over the one store.
test("MockChain sandbox: one tab at a time", async ({ page, context }) => {
  logBrowserErrors(page);
  await newMockChainSandbox(page);
  await createWallet(page, "Wallet A");

  const second = await context.newPage();
  await second.goto("/accounts");
  await expect(
    second.getByText("the MockChain sandbox is open in another tab"),
  ).toBeVisible({ timeout: MOCK_TIMEOUT });
  await expect(
    second.getByRole("button", { name: "Reset local data" }),
  ).toHaveCount(0);

  // The first tab is untouched, and frees the sandbox when it closes.
  await createWallet(page, "Wallet B");
  await page.close();
  await second.getByRole("button", { name: "Retry" }).click();
  await expect(networkBadge(second)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await expect(second.getByRole("row", { name: /Wallet B/ })).toBeVisible({
    timeout: MOCK_TIMEOUT,
  });
  await createWallet(second, "Wallet C");
});
