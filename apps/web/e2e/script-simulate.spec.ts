import { expect, type Locator, type Page, test } from "@playwright/test";
import { COMPILED, createCounterScript, replaceInEditor } from "./editor";
import { launchExample } from "./example";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

const SLOT = "counter_account::counter_contract::count_map";

// The Count Reader's slot, which `copy_count` sets to the counter's count.
const COUNT_SLOT = "count_reader::count_reader::count";

// The tutorials' counter contract (`TESTNET_COUNTER_CONTRACT_ADDRESS` in
// lib/constants.ts, which reads Vite's env and so can't be imported here).
const OTHER_ACCOUNT_ADDRESS =
  "mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv_qr7qqq9wr6w";

// A public basic wallet on Testnet: the faucet's funding account
// (`TESTNET_FAUCET_FUNDER_ACCOUNT_ID` in lib/constants.ts). It's busy: a page
// load after importing it waits minutes for the sync, so import it last.
const WALLET_ACCOUNT_ID = "0x4e6fb40fd2f6a55140df2c42dfb5b7";

const editorConsole = (page: Page) =>
  page.getByRole("region", { name: "Editor Console" });

const invoke = (page: Page, procedure: string) =>
  editorConsole(page).getByRole("button", { name: `Invoke ${procedure}` });

// A procedure's row in the Simulate tab: its name, signature, result, Invoke.
const procedureRow = (page: Page, procedure: string) =>
  editorConsole(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("button", { name: `Invoke ${procedure}` }),
    });

// The databases the SDK's clients opened.
const clientStores = (page: Page) =>
  page.evaluate(async () =>
    (await indexedDB.databases())
      .map(({ name }) => name ?? "")
      .filter((name) => name.includes("MidenClientDB") || name.includes("mock"))
      .sort(),
  );

// How many records the network store's account tables hold.
const networkStoreAccounts = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open("MidenClientDB_mtst");
        open.onerror = () => reject(open.error);
        open.onsuccess = async () => {
          const db = open.result;
          const names = [...db.objectStoreNames].filter((name) =>
            /account/i.test(name),
          );
          if (names.length === 0) {
            reject(new Error("no account table in the store"));
            return;
          }
          const transaction = db.transaction(names, "readonly");
          const counts = await Promise.all(
            names.map(
              (name) =>
                new Promise<number>((resolveCount) => {
                  const count = transaction.objectStore(name).count();
                  count.onsuccess = () => resolveCount(count.result);
                }),
            ),
          );
          db.close();
          resolve(counts.reduce((sum, count) => sum + count, 0));
        };
      }),
  );

test("script: simulate an account component", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("a draft can't be simulated", async () => {
    await createCounterScript(page);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(
      editorConsole(page).getByText(/^Compile the script to simulate it/),
    ).toBeVisible();
    // Never compiled: no procedures yet.
    await expect(invoke(page, "get_count")).toHaveCount(0);
  });

  await test.step("compiling shows the log, then the tab is ready", async () => {
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(invoke(page, "get_count")).toBeEnabled();
    await expect(procedureRow(page, "get_count")).toContainText("Read-only");
  });

  await test.step("the package's storage schema lists its slots", async () => {
    // The counter's map, with its description, and no slot to add by hand.
    await expect(editorConsole(page).getByText(SLOT)).toBeVisible();
    await expect(
      editorConsole(page).getByText(
        "counter contract storage map (word → felt)",
      ),
    ).toBeVisible();
    await expect(editorConsole(page).getByLabel("New slot name")).toHaveCount(
      0,
    );
    await expect(
      editorConsole(page).getByRole("button", { name: `Remove slot ${SLOT}` }),
    ).toHaveCount(0);
    // The map starts empty: the count reads zero.
    await invoke(page, "get_count").click();
    await expect(
      procedureRow(page, "get_count").getByRole("cell").nth(2),
    ).toHaveText("0");
  });

  await test.step("a read-only procedure returns the storage's value", async () => {
    await editorConsole(page)
      .getByRole("button", { name: "Add entry" })
      .click();
    await editorConsole(page).getByLabel(`${SLOT} key 1`).fill("1");
    await editorConsole(page).getByLabel(`${SLOT} value 1`).fill("5");
    await invoke(page, "get_count").click();
    await expect(
      procedureRow(page, "get_count").getByRole("cell").nth(2),
    ).toHaveText("5");
  });

  await test.step("a state change shows its effects, without a submit", async () => {
    await invoke(page, "increment_count").click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Simulation of increment_count" });
    await expect(dialog.getByText("Returned: 6")).toBeVisible();
    await expect(dialog.getByText("Storage changes:")).toBeVisible();
    await expect(dialog.getByText("New nonce: 1.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: /submit/i })).toHaveCount(
      0,
    );
    await dialog.getByRole("button", { name: "Close" }).first().click();
    // Nothing was saved: the next run starts from the same storage.
    await invoke(page, "get_count").click();
    await expect(
      procedureRow(page, "get_count").getByRole("cell").nth(2),
    ).toHaveText("5");
  });

  await test.step("applying the result chains the next run", async () => {
    await invoke(page, "increment_count").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Apply to storage" })
      .click();
    await expect(editorConsole(page).getByLabel(`${SLOT} value 1`)).toHaveValue(
      "6",
    );
    await invoke(page, "get_count").click();
    await expect(
      procedureRow(page, "get_count").getByRole("cell").nth(2),
    ).toHaveText("6");
  });

  await test.step("an invalid value blocks the runs", async () => {
    await editorConsole(page).getByLabel(`${SLOT} value 1`).fill("six");
    await expect(invoke(page, "get_count")).toBeDisabled();
    await editorConsole(page).getByLabel(`${SLOT} value 1`).fill("6");
    await expect(invoke(page, "get_count")).toBeEnabled();
  });

  await test.step("the runs are in the log", async () => {
    await editorConsole(page).getByRole("tab", { name: "Output" }).click();
    await expect(
      editorConsole(page).getByText("Simulated get_count: returned 6.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      editorConsole(page)
        .getByText("Simulated increment_count: returned 6, 1 storage change.", {
          exact: true,
        })
        .first(),
    ).toBeVisible();
  });

  await test.step("simulated accounts stay out of the network's store", async () => {
    expect(await clientStores(page)).toEqual([
      "MidenClientDB_mtst",
      "mock_client_db",
    ]);
    // No account was added to the sandbox's store: it never had one.
    expect(await networkStoreAccounts(page)).toBe(0);
  });

  await test.step("an edit blocks the runs until the next compile", async () => {
    await replaceInEditor(page, "felt!(1);", "felt!(2);");
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(invoke(page, "get_count")).toBeDisabled();
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    // The slot's edits were kept; the recompiled procedure adds 2.
    await expect(editorConsole(page).getByLabel(`${SLOT} value 1`)).toHaveValue(
      "6",
    );
    await invoke(page, "increment_count").click();
    await expect(
      page.getByRole("dialog").getByText("Returned: 8"),
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close" })
      .first()
      .click();
  });

  await test.step("a foreign call runs against a staged account", async () => {
    // The Count Reader's `copy_count` reads the counter through FPI: the
    // counter is staged on the mock chain from the script's `counter-account`
    // dependency, with the storage set in the tab.
    await page.goto("/scripts");
    await page.getByRole("button", { name: "Create new script" }).click();
    const create = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await create.getByLabel("Name").fill("count-reader");
    await selectOption(page, "Type", "Account Component");
    await selectOption(page, "Example", "Count Reader");
    await create.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
    // The example depends on `counter-account` on its own, under the API's
    // built-in id: the workspace's script of that name isn't offered again.
    await page.getByRole("tab", { name: "Manifest" }).click();
    await page.getByRole("button", { name: "Add dependency" }).click();
    const dependency = page
      .getByRole("dialog")
      .filter({ hasText: "Add Dependency" });
    await dependency.getByRole("combobox").click();
    await expect(
      page.getByRole("option", { name: "basic-wallet" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "counter-account" }),
    ).toHaveCount(0);
    // Closes the list: a key press can loop on a non-modal dialog's Select.
    await page.getByRole("option", { name: "basic-wallet" }).click();
    await dependency.getByRole("button", { name: "Cancel" }).click();
    await expect(dependency).toBeHidden();
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    // The workspace's `counter-account` was edited since: the dependency
    // resolves to the package the web app embeds, with its storage schema.
    const foreign = foreignAccount(page, "counter-account");
    await expect(foreign.getByText(SLOT)).toBeVisible();
    await foreign.getByRole("button", { name: "Add entry" }).click();
    await foreign.getByLabel(`${SLOT} key 1`).fill("1");
    await foreign.getByLabel(`${SLOT} value 1`).fill("7");
    await selectCopyCountAccount(page, "counter-account");
    await copyCount(page, "7");
    // An edit is a new account, staged at the next run.
    await foreign.getByLabel(`${SLOT} value 1`).fill("42");
    await copyCount(page, "42");
  });

  await test.step("a crash of the mock client is reported and recovered", async () => {
    // A sandbox account is out of the mock chain's reach: the mock client
    // panics on it.
    await importAccount(page, "Other Counter", OTHER_ACCOUNT_ADDRESS);
    await page.getByRole("link", { name: "count-reader" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await selectCopyCountAccount(page, "Other Counter");
    await invoke(page, "copy_count").click();
    // The worker's crash is caught at once, well before the run's timeout. A
    // failed run shows the log.
    await expect(
      editorConsole(page).getByText(/The simulation's client crashed/),
    ).toBeVisible({ timeout: 30_000 });
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(
      procedureRow(page, "copy_count").getByRole("cell").nth(2),
    ).toHaveText("Failed");
    // The next run gets a new client, on which the counter is staged again.
    // The import's page load dropped the slot edits, which live in memory.
    const foreign = foreignAccount(page, "counter-account");
    await foreign.getByRole("button", { name: "Add entry" }).click();
    await foreign.getByLabel(`${SLOT} key 1`).fill("1");
    await foreign.getByLabel(`${SLOT} value 1`).fill("3");
    await selectCopyCountAccount(page, "counter-account");
    await copyCount(page, "3");
    await page.getByRole("link", { name: "counter-account" }).first().click();
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await invoke(page, "get_count").click();
    await expect(
      procedureRow(page, "get_count").getByRole("cell").nth(2),
    ).toHaveText("0");
  });

  await test.step("after a crash, a note gets a new simulated account and asset", async () => {
    // Through the sidebar: the imported counter makes page loads slow.
    await page
      .getByRole("link", { name: "Scripts", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/scripts$/);
    await page.getByRole("button", { name: "Create new script" }).click();
    const create = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await create.getByLabel("Name").fill("p2id-note");
    await selectOption(page, "Type", "Note Script");
    await selectOption(page, "Example", "P2ID Note");
    await create.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    // The first run makes the mock client's faucet.
    await receiveSimulatedAsset(page);
    // The crash, as in the step above: the client is discarded, its accounts
    // and its faucet with it.
    await page.getByRole("link", { name: "count-reader" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await selectCopyCountAccount(page, "Other Counter");
    await invoke(page, "copy_count").click();
    await expect(
      editorConsole(page)
        .getByText(/The simulation's client crashed/)
        .last(),
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: "p2id-note" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await receiveSimulatedAsset(page);
  });

  await test.step("a script runs against the workspace's dependency", async () => {
    await page
      .getByRole("link", { name: "Scripts", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/scripts$/);
    await page.getByRole("button", { name: "Create new script" }).click();
    const create = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await create.getByLabel("Name").fill("counter-script");
    await selectOption(page, "Type", "Transaction Script");
    await selectOption(page, "Example", "Counter Script");
    await create.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
    await page.getByRole("tab", { name: "Manifest" }).click();
    await page.getByRole("button", { name: "Add dependency" }).click();
    const dependency = page
      .getByRole("dialog")
      .filter({ hasText: "Add Dependency" });
    await selectOption(page, "Dependency", "counter-account");
    await dependency.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dependency).toBeHidden();
    await compileScript(page);
    // The workspace's counter, which adds 2 since its last compile. No
    // sandbox account has it: the simulated account is preselected.
    await expect(targetDropdown(page)).toHaveText("Simulated account");
    const dialog = await simulateOnThrowaway(page, "counter-script");
    await expect(afterValue(dialog)).toHaveText(shownFelt(2));
    await dialog.getByRole("button", { name: "Close" }).first().click();
  });

  await test.step("a dependency recompiled since is reported, until the script is compiled again", async () => {
    // The package `counter-script` was compiled against is no longer the
    // workspace's, and isn't one the web app embeds.
    await page.getByRole("link", { name: "counter-account" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await replaceInEditor(page, "felt!(2);", "felt!(3);");
    await compileScript(page);
    await page.getByRole("link", { name: "counter-script" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(targetDropdown(page)).toHaveText("Simulated account");
    await expect(
      editorConsole(page).getByText(
        "changed since this script was compiled. Compile this script again to run it against it.",
      ),
    ).toBeVisible();
    // The simulated account can't hold the counter: no storage to edit.
    await expect(simulatedComponent(page, "counter-account")).toHaveCount(0);
    await compileScript(page);
    await expect(
      simulatedComponent(page, "counter-account").getByText(SLOT),
    ).toBeVisible();
    const dialog = await simulateOnThrowaway(page, "counter-script");
    await expect(afterValue(dialog)).toHaveText(shownFelt(3));
    await dialog.getByRole("button", { name: "Close" }).first().click();
  });
});

// The P2ID note, naming the simulated account and carrying 100 of the
// simulated asset, consumed by the simulated account.
const receiveSimulatedAsset = async (page: Page) => {
  await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
  await selectTarget(page, "Simulated account");
  const field = editorConsole(page)
    .locator("div")
    .filter({ hasText: "target-account-id" })
    .last();
  await field.getByRole("button", { name: "Select account" }).click();
  await page
    .getByRole("menuitemradio", { name: "Simulated account", exact: true })
    .click();
  await selectAsset(page, "Simulated asset", "100");
  const dialog = await simulateOnThrowaway(page, "p2id-note");
  await expect(
    dialog.getByRole("row", {
      name: "Fungible Asset Simulated asset SIM +100",
    }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).first().click();
};

// A foreign account's block in the Simulate tab.
const foreignAccount = (page: Page, name: string) =>
  editorConsole(page).getByRole("region", { name: `Foreign account ${name}` });

// Picks the account `copy_count` reads.
const selectCopyCountAccount = async (page: Page, name: string) => {
  await procedureRow(page, "copy_count")
    .locator("xpath=following-sibling::tr[1]")
    .getByRole("button")
    .click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
};

// Runs the Count Reader's `copy_count` and applies its result: `count` holds
// the counter's count.
const copyCount = async (page: Page, count: string) => {
  await invoke(page, "copy_count").click();
  const dialog = page
    .getByRole("dialog")
    .filter({ hasText: "Simulation of copy_count" });
  await dialog.getByRole("button", { name: "Apply to storage" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    editorConsole(page).getByLabel(`${COUNT_SLOT} value`, { exact: true }),
  ).toHaveValue(count);
};

// The Simulate tab's target dropdown, under its label.
const targetDropdown = (page: Page) =>
  editorConsole(page)
    .locator("div")
    .filter({ has: page.getByText("Target account", { exact: true }) })
    .last()
    .getByRole("button");

// Picks the Simulate tab's target account.
const selectTarget = async (page: Page, name: string) => {
  await targetDropdown(page).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
  await expect(targetDropdown(page)).toHaveText(name);
};

// The accounts the Simulate tab's target dropdown lists, then closes it.
const targetOptions = async (page: Page) => {
  await targetDropdown(page).click();
  const options = page.getByRole("menuitemradio");
  await expect(options.first()).toBeVisible();
  const names = await options.allInnerTexts();
  await page.keyboard.press("Escape");
  await expect(options).toHaveCount(0);
  return names.map((name) => name.trim()).sort();
};

const importAccount = async (page: Page, name: string, address: string) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "Create new account" }).click();
  await page.getByRole("menuitem", { name: "Import account" }).click();
  const dialog = page.getByRole("dialog", { name: "Import Account" });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Address").fill(address);
  await dialog.getByRole("button", { name: "Import" }).click();
  await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
};

// A block of the simulated account's storage: one per dependency.
const simulatedComponent = (page: Page, name: string) =>
  editorConsole(page).getByRole("region", {
    name: `Simulated account ${name}`,
  });

const simulateButton = (page: Page) =>
  editorConsole(page).getByRole("button", { name: "Simulate", exact: true });

// A storage change's value in the result dialog: a felt as a word, shown as
// its first and last 16 hex digits.
const shownFelt = (value: number) =>
  `0x${value.toString(16).padStart(2, "0").padEnd(16, "0")}…${"0".repeat(16)}`;

// The value a storage change ends at, in the result dialog.
const afterValue = (dialog: Locator) =>
  dialog
    .locator("p")
    .filter({ hasText: /^After:/ })
    .getByRole("button");

// Picks the asset a note carries, and its amount in base units.
const selectAsset = async (page: Page, name: string, amount: string) => {
  await editorConsole(page)
    .getByRole("button", { name: "Select asset" })
    .click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
  await editorConsole(page).getByPlaceholder("Amount").fill(amount);
};

// A run that fails shows the log, which explains the kernel's bare error
// code: the note's script never took the note's asset.
const expectAssetNotTaken = async (page: Page, script: string) => {
  await simulateButton(page).click();
  await expect(
    editorConsole(page).getByText(`Simulation of ${script} failed.`).last(),
  ).toBeVisible();
  await expect(
    editorConsole(page)
      .getByText(/A note's asset isn't received on its own/)
      .last(),
  ).toBeVisible();
  await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
};

// Runs the script on the simulated account: the dialog says so.
const simulateOnThrowaway = async (page: Page, script: string) => {
  await simulateButton(page).click();
  const dialog = page
    .getByRole("dialog")
    .filter({ hasText: `Simulation of ${script}` });
  await expect(dialog.getByText("on a throwaway account")).toBeVisible();
  await expect(dialog.getByRole("button", { name: /submit/i })).toHaveCount(0);
  return dialog;
};

const simulate = async (page: Page, script: string) => {
  await editorConsole(page)
    .getByRole("button", { name: "Simulate", exact: true })
    .click();
  const dialog = page
    .getByRole("dialog")
    .filter({ hasText: `Simulation of ${script}` });
  await expect(dialog.getByText("Storage changes:")).toBeVisible();
  // The counter goes from 0 to 1, on the deployed account.
  await expect(dialog.getByText("count_map")).toBeVisible();
  await expect(dialog.getByRole("button", { name: /submit/i })).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Apply to storage" }),
  ).toHaveCount(0);
  return dialog;
};

test("script: simulate a note and a transaction script", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("launch the counter contract example", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
  });

  await test.step("the note runs as if the counter consumed it", async () => {
    await page.getByRole("link", { name: "increment-note" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    const run = editorConsole(page).getByRole("button", {
      name: "Simulate",
      exact: true,
    });
    await expect(run).toBeDisabled();
    await selectTarget(page, "Counter Contract");
    const dialog = await simulate(page, "increment-note");
    await expect(
      dialog.getByText("1 note will be consumed", { exact: false }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).first().click();
    await editorConsole(page).getByRole("tab", { name: "Output" }).click();
    await expect(
      editorConsole(page).getByText(
        "Simulated increment-note on Counter Contract: 1 storage change.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  await test.step("a sandbox target never starts the mock client", async () => {
    expect(await clientStores(page)).toEqual(["MidenClientDB_mtst"]);
  });

  await test.step("an invalid argument blocks the run", async () => {
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await editorConsole(page).getByLabel("Note argument").fill("nope");
    await expect(
      editorConsole(page).getByRole("button", {
        name: "Simulate",
        exact: true,
      }),
    ).toBeDisabled();
  });

  await test.step("the note runs on the simulated account", async () => {
    const storeBefore = await networkStoreAccounts(page);
    await editorConsole(page).getByLabel("Note argument").fill("");
    await selectTarget(page, "Simulated account");
    // A throwaway account holding the note's `counter-account` dependency,
    // with the storage set in the tab.
    const counter = simulatedComponent(page, "counter-account");
    await expect(counter.getByText(SLOT)).toBeVisible();
    await counter.getByRole("button", { name: "Add entry" }).click();
    await counter.getByLabel(`${SLOT} key 1`).fill("1");
    await counter.getByLabel(`${SLOT} value 1`).fill("5");
    let dialog = await simulateOnThrowaway(page, "increment-note");
    await expect(afterValue(dialog)).toHaveText(shownFelt(6));
    await dialog.getByRole("button", { name: "Apply to storage" }).click();
    await expect(dialog).toBeHidden();
    await expect(counter.getByLabel(`${SLOT} value 1`)).toHaveValue("6");
    // The next run starts from the applied storage.
    dialog = await simulateOnThrowaway(page, "increment-note");
    await expect(afterValue(dialog)).toHaveText(shownFelt(7));
    await dialog.getByRole("button", { name: "Close" }).first().click();
    await editorConsole(page).getByRole("tab", { name: "Output" }).click();
    await expect(
      editorConsole(page)
        .getByText(
          "Simulated increment-note on the simulated account: 1 storage change.",
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    // The simulated account isn't in the network's store.
    expect(await clientStores(page)).toEqual([
      "MidenClientDB_mtst",
      "mock_client_db",
    ]);
    expect(await networkStoreAccounts(page)).toBe(storeBefore);
    // The same note with the simulated asset, which it doesn't take either.
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await selectAsset(page, "Simulated asset", "100");
    await expectAssetNotTaken(page, "increment-note");
  });

  await test.step("a transaction script runs against the counter", async () => {
    await page.goto("/scripts");
    await page.getByRole("button", { name: "Create new script" }).click();
    const create = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await create.getByLabel("Name").fill("counter-script");
    await selectOption(page, "Type", "Transaction Script");
    await selectOption(page, "Example", "Counter Script");
    await create.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
    await page.getByRole("tab", { name: "Manifest" }).click();
    await page.getByRole("button", { name: "Add dependency" }).click();
    const dependency = page
      .getByRole("dialog")
      .filter({ hasText: "Add Dependency" });
    await selectOption(page, "Dependency", "counter-account");
    await dependency.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dependency).toBeHidden();
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await selectTarget(page, "Counter Contract");
    await editorConsole(page).getByLabel("Script argument").fill("7");
    const dialog = await simulate(page, "counter-script");
    await dialog.getByRole("button", { name: "Close" }).first().click();
  });

  await test.step("a transaction script runs on the simulated account", async () => {
    await selectTarget(page, "Simulated account");
    // The script's own slots, empty: the count goes from 0 to 1.
    await expect(
      simulatedComponent(page, "counter-account").getByText(SLOT),
    ).toBeVisible();
    const dialog = await simulateOnThrowaway(page, "counter-script");
    await expect(afterValue(dialog)).toHaveText(shownFelt(1));
    await dialog.getByRole("button", { name: "Close" }).first().click();
  });

  await test.step("import a second account", async () => {
    // The tutorials' counter contract: another account a note can target.
    await importAccount(page, "Other Counter", OTHER_ACCOUNT_ADDRESS);
  });

  await test.step("only the accounts with the procedures are targets", async () => {
    // The tutorials' counter was deployed from the same `counter-account`
    // package as the example (lib/constants.ts): same procedure roots, so it
    // can run the counter's note and script.
    for (const script of ["increment-note", "counter-script"]) {
      await page.getByRole("link", { name: script }).first().click();
      await expect(page).toHaveURL(/\/scripts\//);
      await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
      expect(await targetOptions(page)).toEqual([
        "Counter Contract",
        "Other Counter",
        "Simulated account",
      ]);
    }
  });

  await test.step("a note's storage is typed by its storage schema", async () => {
    await page.goto("/scripts");
    await page.getByRole("button", { name: "Create new script" }).click();
    const create = page
      .getByRole("dialog")
      .filter({ hasText: "Create Script" });
    await create.getByLabel("Name").fill("p2id-note");
    await selectOption(page, "Type", "Note Script");
    await selectOption(page, "Example", "P2ID Note");
    await create.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    // One account field, named as the note's storage names it: no raw felts.
    const field = editorConsole(page)
      .locator("div")
      .filter({ hasText: "target-account-id" })
      .last();
    await expect(field.getByText("AccountId")).toBeVisible();
    await expect(
      editorConsole(page).getByRole("button", { name: "Add storage item" }),
    ).toHaveCount(0);
    // Its storage field lists every account: only the target is filtered.
    await field.getByRole("button", { name: "Select account" }).click();
    for (const name of ["Counter Contract", "Other Counter"]) {
      await expect(
        page.getByRole("menuitemradio", { name, exact: true }),
      ).toBeVisible();
    }
    await page
      .getByRole("menuitemradio", { name: "Counter Contract", exact: true })
      .click();
  });

  await test.step("the simulated account is the P2ID note's target", async () => {
    const storeBefore = await networkStoreAccounts(page);
    // The template calls the Rust basic wallet's `receive-asset`
    // (lib/tutorials/basic-wallet.ts), which none of the sandbox's accounts
    // has: they carry the standard basic wallet, whose `receive_asset` has
    // another root. The simulated account holds the note's `basic-wallet`
    // dependency: it's preselected.
    await expect(targetDropdown(page)).toHaveText("Simulated account");
    await expect(
      editorConsole(page).getByText(/It lacks procedures/),
    ).toHaveCount(0);
    const field = editorConsole(page)
      .locator("div")
      .filter({ hasText: "target-account-id" })
      .last();
    await field.getByRole("button", { name: "Counter Contract" }).click();
    await page
      .getByRole("menuitemradio", { name: "Simulated account", exact: true })
      .click();
    // Only the simulated asset: a sandbox faucet would crash the mock client.
    await editorConsole(page)
      .getByRole("button", { name: "Select asset" })
      .click();
    await expect(page.getByRole("menuitemradio")).toHaveCount(1);
    await page
      .getByRole("menuitemradio", { name: "Simulated asset", exact: true })
      .click();
    await editorConsole(page).getByPlaceholder("Amount").fill("100");
    const dialog = await simulateOnThrowaway(page, "p2id-note");
    await expect(dialog.getByText("Vault changes:")).toBeVisible();
    // The simulated asset has no decimals: the amount, as typed.
    await expect(
      dialog.getByRole("row", {
        name: "Fungible Asset Simulated asset SIM +100",
      }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).first().click();
    // Another account named in the note: its assertion fails.
    await field.getByRole("button", { name: "Simulated account" }).click();
    await page
      .getByRole("menuitemradio", { name: "Other Counter", exact: true })
      .click();
    await simulateButton(page).click();
    // A failed run shows the log.
    await expect(
      editorConsole(page).getByText("Simulation of p2id-note failed.").last(),
    ).toBeVisible();
    await expect(
      editorConsole(page)
        .getByText(/assert/i)
        .last(),
    ).toBeVisible();
    expect(await networkStoreAccounts(page)).toBe(storeBefore);
  });

  await test.step("nothing was submitted", async () => {
    // The example's deployment is the sandbox's only account, at count 0.
    await page.goto("/accounts");
    await page
      .getByRole("cell", { name: "Counter Contract", exact: true })
      .click();
    await page.getByRole("tab", { name: "Components" }).click();
    const row = page
      .getByRole("row")
      .filter({ has: page.getByText("get_count", { exact: true }) })
      .last();
    await row.getByRole("button", { name: "Invoke" }).click();
    await expect(row.getByRole("cell").last()).toHaveText(/^0\s*Invoke$/);
  });

  await test.step("a plain wallet can't run the counter's scripts", async () => {
    await importAccount(page, "Plain Wallet", WALLET_ACCOUNT_ID);
    // Through the sidebar: a page load would wait for the wallet's sync. It
    // has neither `get-count` nor `increment-count`.
    for (const script of ["increment-note", "counter-script"]) {
      await page.getByRole("link", { name: script }).first().click();
      await expect(page).toHaveURL(/\/scripts\//);
      await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
      expect(await targetOptions(page)).toEqual([
        "Counter Contract",
        "Other Counter",
        "Simulated account",
      ]);
    }
  });
});

// Compiles the open script, then shows its Simulate tab again.
const compileScript = async (page: Page) => {
  await page.getByRole("button", { name: "Compile" }).click();
  await expect(page.getByText(COMPILED).last()).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
  await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
};
