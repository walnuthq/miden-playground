import { expect, type Page, test } from "@playwright/test";
import { COMPILED, createCounterScript } from "./editor";
import { invoke, submitPreview } from "./example";
import { clickProjectsItem, networkBadge, switcher } from "./projects-menu";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// A MockChain sandbox: the chain runs in the browser, so nothing reaches a
// node, a prover or a faucet, and a block is proven after each transaction.
const MOCK_TIMEOUT = 30_000;
// Its addresses carry its own prefix, on the pages and in their URLs.
const ACCOUNT_URL = /\/accounts\/mmck1[0-9a-z]+$/;

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
  await page.getByRole("menuitem", { name: "New MockChain sandbox" }).click();
  await expect(page).toHaveURL(/\/accounts$/, { timeout: MOCK_TIMEOUT });
  // A fresh mock chain: no public faucet, and a block height of its own. The
  // badge names it: until the switch is over it still shows the previous
  // network's height, and the accounts page that network's menu (against
  // production the counter packages take long enough for a click to land
  // there).
  await expect(networkBadge(page)).toContainText(/MockChain\s*\|\s*#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
};

// The counter from the MASM template, compiled, then the accounts page: the
// sandbox starts without the counter example's packages while it's hidden.
const compiledCounterScript = async (page: Page) => {
  await createCounterScript(page);
  await page.getByRole("button", { name: "Compile" }).click();
  await expect(page.getByText(COMPILED).last()).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
  await page.goto("/accounts");
  await expect(networkBadge(page)).toContainText(/MockChain\s*\|\s*#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
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
    // Miden Guardian signs for real networks.
    await expect(page.getByRole("menuitem", { name: /guardian/i })).toHaveCount(
      0,
    );
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
// does: they need apps/api on port 3001. While the example is hidden (until
// plan 06 of spec/remove-rust) it starts empty, and the counter comes from
// the MASM template.
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
  await compiledCounterScript(page);

  await page.getByRole("button", { name: "Create new account" }).click();
  await page.getByRole("menuitem", { name: "Deploy account" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Deploy Account" });
  await dialog.getByLabel("Name").fill("Mock Counter");
  await selectOption(page, "Account Component", "counter-account");
  // Nothing consumes a network account's notes on a mock chain.
  await dialog
    .getByText("Auth Component", { exact: true })
    .locator("xpath=following::button[@role='combobox'][1]")
    .click();
  await expect(page.getByRole("option", { name: "No Auth" })).toBeVisible();
  await expect(page.getByRole("option", { name: /Network/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
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
  await expect(page.getByRole("button", { name: /^Verify/ })).toHaveCount(0);
});

// The home page's card starts one too.
test("MockChain sandbox: the home card starts a sandbox", async ({ page }) => {
  logBrowserErrors(page);
  await page.goto("/");
  const create = page.getByRole("button", {
    name: "Create new MockChain sandbox",
  });
  await expect(create).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await create.click();
  await expect(page).toHaveURL(/\/accounts$/, { timeout: MOCK_TIMEOUT });
  await expect(networkBadge(page)).toContainText(/MockChain\s*\|\s*#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await createWallet(page, "Wallet A");
  await openAccount(page, "Wallet A");
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

const editorConsole = (page: Page) =>
  page.getByRole("region", { name: "Editor Console" });

const simulateInvoke = (page: Page, procedure: string) =>
  editorConsole(page).getByRole("button", { name: `Invoke ${procedure}` });

// What `get_count` returned in the Simulate tab.
const simulatedCount = (page: Page) =>
  editorConsole(page)
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: "Invoke get_count" }) })
    .getByRole("cell")
    .nth(2);

const targetDropdown = (page: Page) =>
  editorConsole(page)
    .locator("div")
    .filter({ has: page.getByText("Target account", { exact: true }) })
    .last()
    .getByRole("button");

const openScript = async (page: Page, name: string) => {
  await page.goto("/scripts");
  await page.getByRole("link", { name }).first().click();
  await expect(page).toHaveURL(/\/scripts\//);
  await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
};

// A simulated account runs on a mock client of its own, whose store has the
// name of the sandbox's: on the MockChain the Simulate tab never creates it.
test("MockChain sandbox: the Simulate tab runs on the sandbox's accounts only", async ({
  page,
}) => {
  logBrowserErrors(page);
  await newMockChainSandbox(page);
  await compiledCounterScript(page);
  await page.getByRole("button", { name: "Create new account" }).click();
  await page.getByRole("menuitem", { name: "Deploy account" }).click();
  const deploy = page.getByRole("dialog").filter({ hasText: "Deploy Account" });
  await deploy.getByLabel("Name").fill("Mock Counter");
  await selectOption(page, "Account Component", "counter-account");
  await deploy.getByRole("button", { name: "Deploy" }).click();
  await expect(deploy).toBeHidden({ timeout: MOCK_TIMEOUT });

  await test.step("an account component isn't simulated: it's deployed", async () => {
    await openScript(page, "counter-account");
    await expect(
      editorConsole(page).getByText(
        /^Account components aren't simulated on the MockChain sandbox/,
      ),
    ).toBeVisible();
    await expect(simulateInvoke(page, "get_count")).toHaveCount(0);
  });

  // The counter example's increment-note: back with the example in plan 06.
  await test.step.skip(
    "a note runs on a sandbox account, with no simulated account offered",
    async () => {
      await openScript(page, "increment-note");
      await targetDropdown(page).click();
      const options = page.getByRole("menuitemradio");
      await expect(options).toHaveText(["Mock Counter"]);
      await options.first().click();
      await editorConsole(page)
        .getByRole("button", { name: "Simulate", exact: true })
        .click();
      const dialog = page
        .getByRole("dialog")
        .filter({ hasText: "Simulation of increment-note" });
      await expect(dialog.getByText("count_map")).toBeVisible({
        timeout: MOCK_TIMEOUT,
      });
      await dialog.getByRole("button", { name: "Close" }).first().click();
    },
  );

  await test.step("the sandbox still transacts, and nothing was executed for real", async () => {
    await page.goto("/accounts");
    await createWallet(page, "Wallet A");
    await openAccount(page, "Mock Counter");
    await expect(nonceRow(page)).toHaveText(/^Nonce\s*1$/);
  });
});

// The Simulate tab's mock client, on another network, uses the same store.
test("MockChain sandbox: another tab's simulations leave its store alone", async ({
  page,
  context,
}) => {
  logBrowserErrors(page);
  // A Testnet tab that simulated: its mock client has the store.
  await createCounterScript(page);
  await page.getByRole("button", { name: "Compile" }).click();
  await expect(page.getByText(COMPILED).last()).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
  await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
  await simulateInvoke(page, "get_count").click();
  await expect(simulatedCount(page)).toHaveText("0");

  // The sandbox takes it, in a second tab.
  const sandbox = await context.newPage();
  logBrowserErrors(sandbox);
  await newMockChainSandbox(sandbox);
  await createWallet(sandbox, "Wallet A");

  await test.step("the first tab can't simulate meanwhile", async () => {
    await simulateInvoke(page, "get_count").click();
    // A failed run shows the log.
    await expect(
      editorConsole(page).getByText(
        /while the MockChain sandbox is open in another tab/,
      ),
    ).toBeVisible({ timeout: MOCK_TIMEOUT });
  });

  await test.step("the sandbox is untouched", async () => {
    // Its next account is committed in a block and synced: the store is
    // still its chain's. No reload: the two tabs write the same persisted
    // app state, and the last writer wins.
    await createWallet(sandbox, "Wallet B");
    await sandbox.getByRole("cell", { name: "Wallet B", exact: true }).click();
    await expect(nonceRow(sandbox)).toHaveText(/^Nonce\s*1$/, {
      timeout: MOCK_TIMEOUT,
    });
  });

  await test.step("once the sandbox's tab is closed, simulations run again", async () => {
    await sandbox.close();
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await simulateInvoke(page, "get_count").click();
    await expect(simulatedCount(page)).toHaveText("0", {
      timeout: MOCK_TIMEOUT,
    });
  });

  await test.step("a sandbox started in the tab that simulated takes the store from its own mock client", async () => {
    // Without a reload: the simulation's client is still alive.
    await switcher(page).click();
    await page.getByRole("menuitem", { name: "New MockChain sandbox" }).click();
    await expect(page).toHaveURL(/\/accounts$/, { timeout: MOCK_TIMEOUT });
    // The page navigates before the network switches.
    await expect(switcher(page)).toContainText("MockChain sandbox", {
      timeout: MOCK_TIMEOUT,
    });
    await createWallet(page, "Wallet C");
    await page.reload();
    await expect(page.getByRole("row", { name: /Wallet C/ })).toBeVisible({
      timeout: MOCK_TIMEOUT,
    });
  });
});
