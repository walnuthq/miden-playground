import { expect, type Locator, type Page, test } from "@playwright/test";
import { COMPILED, createCounterScript, replaceInEditor } from "./editor";
import { launchExample } from "./example";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// The counter template's map (apps/api/templates/counter-account.masm), and
// its description in the template's storage schema.
const SLOT = "counter_account::count_map";
const SLOT_DESCRIPTION = "The count, under the key [1, 0, 0, 0].";

// What the log says of a procedure that spends more than the vault holds:
// the kernel's bare error code, explained (`targetErrorHint`,
// lib/simulation/run.ts).
const VAULT_SHORT = /The account's vault holds less of the asset/;

// The Count Reader's slot, which `copy_count` sets to the counter's count.
const COUNT_SLOT = "count_reader::count";

// What a foreign call's account argument says of the sandbox's accounts
// (`SANDBOX_FOREIGN_ACCOUNT_REASON` in lib/simulation/blocked.ts).
const SANDBOX_REASON =
  "A simulated foreign call can only reach the simulated accounts: sandbox accounts aren't on the simulation's chain.";

// The tutorials' counter contract (`TESTNET_COUNTER_CONTRACT_ADDRESS` in
// lib/constants.ts, which reads Vite's env and so can't be imported here).
const OTHER_ACCOUNT_ADDRESS =
  "mtst1azefsm04uzhwuytxgt8syk3xgyv59pyr_qr7qqq9wr6w";

// A public basic wallet on Testnet: the faucet's funding account
// (`TESTNET_FAUCET_FUNDER_ACCOUNT_ID` in lib/constants.ts). It's busy: a page
// load after importing it waits minutes for the sync, so import it last.
const WALLET_ACCOUNT_ID = "0x4e6fb40fd2f6a55140df2c42dfb5b7";

// Where the spec adds procedures to the counter template: before its first.
const FIRST_PROCEDURE = "#! Returns the current count.\n";

// Two procedures on the counter: one reads the vault, one moves an asset from
// it to a new private note.
const VAULT_IMPORTS = `use {Asset} from miden::protocol::types
use miden::protocol::active_account
use miden::protocol::output_note
`;
const VAULT_PROCEDURES = `#! Returns the vault's balance of the asset's faucet.
@account_procedure
pub proc balance(asset: Asset) -> felt
    exec.active_account::get_asset
    # => [ASSET_VALUE, ASSET_VALUE, pad(8)]
    exec.sys::truncate_stack
end

#! Moves the asset from the vault to a new private note.
@account_procedure
pub proc send(asset: Asset)
    push.14.13.12.11 push.0 push.0
    # => [tag, note_type, RECIPIENT, ASSET_ID, ASSET_VALUE, pad(8)]
    exec.output_note::create
    # => [note_idx, ASSET_ID, ASSET_VALUE, pad(8)]
    movdn.8
    dupw.1 dupw.1
    exec.native_account::remove_asset dropw
    exec.output_note::add_asset
    exec.sys::truncate_stack
end

`;

// The Counter Contract example's increment note (apps/api/examples), and
// what the spec makes of it: a note that reads the count of the account its
// storage names, by a foreign call as tutorial 10's count reader does, and
// checks it against the count its storage gives.
const INCREMENT_NOTE_MAIN = `@note_script
@locals(1)
pub proc main()
    # \`call\` runs an account procedure on the top 16 elements of the stack,
    # and puts its 16 outputs in their place
    call.counter_account::get_count
    # => [count, pad(15)]

    # keep the count we expect after the increment
    add.1 loc_store.0
    # => [pad(16)]

    call.counter_account::increment_count
    # => [new_count, pad(15)]

    drop call.counter_account::get_count
    # => [final_count, pad(15)]

    loc_load.0 assert_eq.err=ERR_COUNT_NOT_INCREMENTED
    # => [pad(16)]
end`;
const FPI_NOTE_IMPORTS = `use counter_account
use miden::protocol::active_note
use miden::protocol::tx
use miden::core::sys

const ERR_UNEXPECTED_COUNT = "the count isn't the expected one"
`;
const FPI_NOTE_MAIN = `@note_script
pub proc main()
    # the storage: the counter's id, prefix then suffix, and the count
    push.3 push.0 exec.active_note::get_bounded_storage drop
    # => [pad(16)]

    padw padw padw padw procref.counter_account::get_count
    mem_load.0 mem_load.1
    # => [counter_id_suffix, counter_id_prefix, GET_COUNT_ROOT, pad(32)]

    exec.tx::execute_foreign_procedure
    # => [count, pad(31)]

    mem_load.2 assert_eq.err=ERR_UNEXPECTED_COUNT
    exec.sys::truncate_stack
end`;

// An account id's two felts, as decimal strings: its prefix, the first 8
// bytes of its hex, and its suffix, the next 7 bytes above a zero byte.
const accountIdFelts = (id: string) => ({
  prefix: BigInt(`0x${id.slice(2, 18)}`).toString(),
  suffix: (BigInt(`0x${id.slice(18, 32)}`) << 8n).toString(),
});

// Procedures whose parameters the forms enter in every way: a struct the
// source defines, an account id, integers below a felt, an enum, a word, a
// \`u64\`.
const RAW_IMPORTS = `use {AccountId, NoteRecipient, NoteTag, NoteType} from miden::protocol::types
use miden::protocol::active_account
use miden::protocol::output_note
`;
const RAW_PROCEDURES = `#! Two felts, laid out as an account id is.
pub type Pair = struct { first: felt, second: felt }

@account_procedure
pub proc prefix_of(id: AccountId) -> felt
    drop
end

@account_procedure
pub proc suffix_of(id: AccountId) -> felt
    swap drop
end

#! One when the pair's felts are the id's, in its fields' order.
@account_procedure
pub proc same_id(id: AccountId, pair: Pair) -> felt
    movup.2 eq movdn.2 eq and
end

#! Each argument's felt as a digit.
@account_procedure
pub proc pick(pair: Pair, idx: u16, last: felt) -> felt
    push.1000 mul swap push.100 mul add swap push.10 mul add add
end

#! The basic wallet's \`create_note\`.
@account_procedure
pub proc create_note(tag: NoteTag, note_type: NoteType, recipient: NoteRecipient) -> u16
    exec.output_note::create
end

#! A u64's limbs as digits: its low limb, then its high one.
@account_procedure
pub proc scalar(big: u64) -> felt
    push.10 mul add
end

#! No signature, as most Miden Assembly declares a procedure.
#!
#! Inputs:  [a, b, pad(14)]
#! Outputs: [a + 10 * b, pad(15)]
@account_procedure
pub proc combine
    swap push.10 mul add
end

`;

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
    await expect(
      procedureRow(page, "get_count").getByText("proc get_count() -> Felt"),
    ).toBeVisible();
  });

  await test.step("the template's storage schema lists its slots", async () => {
    // The counter's map, with its description, and no slot to add by hand.
    await expect(editorConsole(page).getByText(SLOT)).toBeVisible();
    await expect(editorConsole(page).getByText(SLOT_DESCRIPTION)).toBeVisible();
    await expect(editorConsole(page).getByLabel("New slot name")).toHaveCount(
      0,
    );
    await expect(
      editorConsole(page).getByRole("button", { name: `Remove slot ${SLOT}` }),
    ).toHaveCount(0);
    // The map starts empty: the count reads zero.
    await invoke(page, "get_count").click();
    await expect(procedureResult(page, "get_count")).toHaveText("0");
  });

  await test.step("a read-only procedure returns the storage's value", async () => {
    // Under the key [1, 0, 0, 0]: a felt is a word's first element.
    await editorConsole(page)
      .getByRole("button", { name: "Add entry" })
      .click();
    await editorConsole(page).getByLabel(`${SLOT} key 1`).fill("1");
    await editorConsole(page).getByLabel(`${SLOT} value 1`).fill("5");
    await invoke(page, "get_count").click();
    await expect(procedureResult(page, "get_count")).toHaveText("5");
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
    await expect(procedureResult(page, "get_count")).toHaveText("5");
  });

  await test.step("applying the result chains the next run", async () => {
    await invoke(page, "increment_count").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Apply to state" })
      .click();
    await expect(editorConsole(page).getByLabel(`${SLOT} value 1`)).toHaveValue(
      "6",
    );
    await invoke(page, "get_count").click();
    await expect(procedureResult(page, "get_count")).toHaveText("6");
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
    await replaceInEditor(page, "    add.1\n", "    add.2\n");
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(invoke(page, "get_count")).toBeDisabled();
    await compileScript(page);
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

  await test.step("a procedure spends the vault it starts from", async () => {
    await replaceInEditor(
      page,
      "use miden::protocol::active_account\n",
      VAULT_IMPORTS,
    );
    await replaceInEditor(
      page,
      FIRST_PROCEDURE,
      `${VAULT_PROCEDURES}${FIRST_PROCEDURE}`,
    );
    await compileScript(page);
    // An empty vault by default: the account starts as before, with no seed.
    await expect(
      assetRows(page, "Vault").getByText("The vault is empty."),
    ).toBeVisible();
    await addAsset(page, "Vault", "SIM", "1000");
    // A read-only procedure sees the seeded balance.
    await setAssetArgument(page, "balance", "SIM", "1");
    await invoke(page, "balance").click();
    await expect(procedureResult(page, "balance")).toHaveText("1000");
    // A transaction that spends: the changes are shown against the seeded
    // vault, at nonce 1.
    await setAssetArgument(page, "send", "SIM", "400");
    await invoke(page, "send").click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Simulation of send" });
    await expect(
      dialog.getByRole("row", {
        name: "Fungible Asset Simulated asset SIM -400",
      }),
    ).toBeVisible();
    await expect(dialog.getByText(/1 note\s*will be created/)).toBeVisible();
    await expect(dialog.getByText("New nonce: 2.")).toBeVisible();
    // "Apply to state" leaves 600 in the vault, and the next run starts there.
    await dialog.getByRole("button", { name: "Apply to state" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      assetRows(page, "Vault").getByLabel("Vault amount 1"),
    ).toHaveValue("600");
    await invoke(page, "balance").click();
    await expect(procedureResult(page, "balance")).toHaveText("600");
    // A simulated asset of the script's own: another faucet.
    await newAsset(page, "Vault", "USDC");
    await addAsset(page, "Vault", "USDC", "25");
    await setAssetArgument(page, "balance", "USDC", "1");
    await invoke(page, "balance").click();
    await expect(procedureResult(page, "balance")).toHaveText("25");
    // An invalid row blocks the runs.
    await assetRows(page, "Vault").getByLabel("Vault amount 2").fill("2.5");
    await expect(invoke(page, "balance")).toBeDisabled();
    await assetRows(page, "Vault").getByLabel("Vault amount 2").fill("25");
    await expect(invoke(page, "balance")).toBeEnabled();
  });

  await test.step("spending more than the vault holds fails, saying why", async () => {
    await setAssetArgument(page, "send", "SIM", "5000");
    await invoke(page, "send").click();
    await expect(
      editorConsole(page).getByText("Simulation of send failed.").last(),
    ).toBeVisible();
    await expect(
      editorConsole(page).getByText(VAULT_SHORT).last(),
    ).toBeVisible();
  });

  await test.step("a renamed slot drops the schema: the slots are the names the source declares", async () => {
    // The template's schema names `counter_account::count_map`: a source
    // that declares another slot keeps no schema (plan 02's stale rule).
    await replaceInEditor(
      page,
      `word("${SLOT}")`,
      'word("counter_account::renamed_map")',
    );
    await compileScript(page);
    await expect(editorConsole(page).getByText(SLOT_DESCRIPTION)).toHaveCount(
      0,
    );
    // The schema's slot stays, with its values, as a slot added by hand.
    await editorConsole(page)
      .getByRole("button", { name: `Remove slot ${SLOT}` })
      .click();
    await expect(editorConsole(page).getByText(SLOT)).toHaveCount(0);
    const name = editorConsole(page).getByLabel("New slot name");
    await expect(name).toBeVisible();
    await expect(name).toHaveAttribute(
      "placeholder",
      "counter_account::slot_name",
    );
    // The name the source now declares is listed, read from its
    // `word("…")`: as a value, since the source doesn't say it's a map.
    await expect(
      editorConsole(page).getByLabel("counter_account::renamed_map value"),
    ).toHaveValue("0");
    await editorConsole(page)
      .getByRole("combobox", { name: "counter_account::renamed_map type" })
      .click();
    await page.getByRole("option", { name: "Map" }).click();
    // Set to a map, it reaches the procedure.
    await editorConsole(page)
      .getByRole("button", { name: "Add entry" })
      .click();
    await editorConsole(page)
      .getByLabel("counter_account::renamed_map key 1")
      .fill("1");
    await editorConsole(page)
      .getByLabel("counter_account::renamed_map value 1")
      .fill("9");
    await invoke(page, "get_count").click();
    await expect(procedureResult(page, "get_count")).toHaveText("9");
  });
});

test("script: simulate a foreign call", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("the counter, as the template ships it", async () => {
    // Its package has the commitment the Count Reader's built-in dependency
    // names: the dependency resolves to it.
    await createCounterScript(page);
    await compileScript(page);
  });

  await test.step("a foreign call runs against a staged account", async () => {
    // The Count Reader's `copy_count` reads the counter through FPI: the
    // counter is staged on the mock chain from the script's `counter-account`
    // dependency, with the storage set in the tab.
    await createExampleScript(
      page,
      "count-reader",
      "Account Component",
      "Count Reader",
    );
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
    await compileScript(page);
    // The argument and the signature are named from the source.
    await expect(
      procedureArguments(page, "copy_count")
        .locator("label")
        .filter({ hasText: /^counter_account_id/ }),
    ).toBeVisible();
    await expect(
      procedureRow(page, "copy_count").getByText(
        "proc copy_count(counter_account_id: AccountId)",
      ),
    ).toBeVisible();
    // The workspace's counter, with the template's storage schema.
    const foreign = foreignAccount(page, "counter-account");
    await expect(foreign.getByText(SLOT)).toBeVisible();
    await foreign.getByRole("button", { name: "Add entry" }).click();
    await foreign.getByLabel(`${SLOT} key 1`).fill("1");
    await foreign.getByLabel(`${SLOT} value 1`).fill("7");
    // The account id reaches the kernel's FPI as `[suffix, prefix]`: another
    // order names no account, and the call fails.
    await selectCopyCountAccount(page, "counter-account");
    await copyCount(page, "7");
    // An edit is a new account, staged at the next run.
    await foreign.getByLabel(`${SLOT} value 1`).fill("42");
    await copyCount(page, "42");
  });

  await test.step("a foreign call can't pick a sandbox account", async () => {
    // A sandbox account is out of the mock chain's reach: `copy_count` makes
    // a foreign call (`callsForeign`), so its account argument lists the
    // sandbox's accounts disabled, saying why.
    await importAccount(page, "Other Counter", OTHER_ACCOUNT_ADDRESS);
    await page.getByRole("link", { name: "count-reader" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await copyCountAccountDropdown(page).click();
    await expect(
      page.getByRole("menuitemradio", { name: "Other Counter", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("menu").getByText(SANDBOX_REASON),
    ).toBeVisible();
    const simulated = page.getByRole("menuitemradio", {
      name: "counter-account",
      exact: true,
    });
    await expect(simulated).toBeEnabled();
    await simulated.click();
    await expect(copyCountAccountDropdown(page)).toHaveText("counter-account");
  });

  await test.step("a crash of the mock client is reported and recovered", async () => {
    // As if api-compile couldn't tell (`callsForeign` missing): the sandbox
    // account can be picked, and the mock client panics on it.
    await compileWithout(page, "callsForeign");
    await copyCountAccountDropdown(page).click();
    await expect(page.getByRole("menu").getByText(SANDBOX_REASON)).toHaveCount(
      0,
    );
    await page
      .getByRole("menuitemradio", { name: "Other Counter", exact: true })
      .click();
    await invoke(page, "copy_count").click();
    // The worker's crash is caught at once, well before the run's timeout. A
    // failed run shows the log.
    await expect(
      editorConsole(page).getByText(/The simulation's client crashed/),
    ).toBeVisible({ timeout: 30_000 });
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(procedureResult(page, "copy_count")).toHaveText("Failed");
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
    await expect(procedureResult(page, "get_count")).toHaveText("0");
  });

  await test.step("after a crash, a note gets a new simulated account and asset", async () => {
    // Through the sidebar: the imported counter makes page loads slow.
    await page
      .getByRole("link", { name: "Scripts", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/scripts$/);
    await createExampleScript(page, "p2id-note", "Note Script", "P2ID Note");
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    // The first run makes the mock client's faucet.
    await receiveSimulatedAsset(page);
    // The crash, as in the step above (the Count Reader's package still has
    // no `callsForeign`): the client is discarded, its accounts and its
    // faucet with it.
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
    // A compile that brings `callsForeign` back clears the sandbox account.
    await compileScript(page);
    await expect(copyCountAccountDropdown(page)).toHaveText("Select account");
    await page.getByRole("link", { name: "p2id-note" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await receiveSimulatedAsset(page);
  });

  await test.step("a compile without names falls back to positions", async () => {
    // As if api-compile found no names (an older api-compile): the argument
    // is `param_0`, the signature types only.
    await page
      .getByRole("link", { name: "Scripts", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/scripts$/);
    await page.getByRole("link", { name: "count-reader" }).first().click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
    await compileWithout(page, "parameters");
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await expect(
      procedureArguments(page, "copy_count")
        .locator("label")
        .filter({ hasText: /^param_0/ }),
    ).toBeVisible();
    await expect(
      procedureRow(page, "copy_count").getByText("proc copy_count(AccountId)"),
    ).toBeVisible();
  });

  await test.step("a script runs against the workspace's dependency", async () => {
    await page
      .getByRole("link", { name: "Scripts", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/scripts$/);
    await createExampleScript(
      page,
      "counter-script",
      "Transaction Script",
      "Counter Script",
    );
    await page.getByRole("tab", { name: "Manifest" }).click();
    await page.getByRole("button", { name: "Add dependency" }).click();
    const dependency = page
      .getByRole("dialog")
      .filter({ hasText: "Add Dependency" });
    await selectOption(page, "Dependency", "counter-account");
    await dependency.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dependency).toBeHidden();
    await compileScript(page);
    // The workspace's counter, which adds 1. The imported Other Counter runs
    // the same code (a MASM procedure's root doesn't depend on its package's
    // name), so it's a target too and nothing is preselected.
    await selectTarget(page, "Simulated account");
    const dialog = await simulateOnThrowaway(page, "counter-script");
    await expect(afterValue(dialog)).toHaveText(shownFelt(1));
    await dialog.getByRole("button", { name: "Close" }).first().click();
  });

  await test.step("a dependency recompiled since is reported, until the script is compiled again", async () => {
    // The package `counter-script` was compiled against is no longer the
    // workspace's, and isn't one the web app embeds.
    await page.getByRole("link", { name: "counter-account" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await replaceInEditor(page, "    add.1\n", "    add.3\n");
    await compileScript(page);
    await page.getByRole("link", { name: "counter-script" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    // Other Counter still runs the code the script was compiled against.
    await selectTarget(page, "Simulated account");
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

// Creates a script from one of the Create dialog's examples.
const createExampleScript = async (
  page: Page,
  name: string,
  type: string,
  example: string,
) => {
  // Not again on the page: after an import, a page load waits for its sync.
  if (!page.url().endsWith("/scripts")) {
    await page.goto("/scripts");
  }
  const button = page.getByRole("button", { name: "Create new script" });
  // The app shell shows it disabled until the client is ready.
  await expect(button).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await button.click();
  const create = page.getByRole("dialog").filter({ hasText: "Create Script" });
  await create.getByLabel("Name").fill(name);
  await selectOption(page, "Type", type);
  await selectOption(page, "Example", example);
  await create.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
};

// The result cell of a procedure's row.
const procedureResult = (page: Page, procedure: string) =>
  procedureRow(page, procedure).getByRole("cell").nth(2);

// Picks the SIM asset's faucet for a procedure's only `AccountId` argument.
const pickSimFaucet = async (page: Page, procedure: string) => {
  await procedureArguments(page, procedure).getByRole("button").first().click();
  await page
    .getByRole("menuitemradio", { name: "SIM faucet", exact: true })
    .click();
};

test("script: a Count Reader alone simulates its foreign call", async ({
  page,
}) => {
  logBrowserErrors(page);

  await test.step("the workspace holds no counter", async () => {
    // The template depends on the API's built-in `counter-account`, which no
    // script of the workspace holds: the tab asks the API for its package.
    await createExampleScript(
      page,
      "count-reader",
      "Account Component",
      "Count Reader",
    );
    await compileScript(page);
  });

  await test.step("the counter is staged from the built-in package", async () => {
    const foreign = foreignAccount(page, "counter-account");
    // With the template's storage schema.
    await expect(foreign.getByText(SLOT)).toBeVisible();
    await expect(invoke(page, "copy_count")).toBeVisible();
    await foreign.getByRole("button", { name: "Add entry" }).click();
    await foreign.getByLabel(`${SLOT} key 1`).fill("1");
    await foreign.getByLabel(`${SLOT} value 1`).fill("7");
    await selectCopyCountAccount(page, "counter-account");
    await copyCount(page, "7");
  });
});

test("script: the arguments of every type", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("a counter with a struct, an account id, integers, an enum and a u64", async () => {
    await createCounterScript(page);
    await replaceInEditor(
      page,
      "use miden::protocol::active_account\n",
      RAW_IMPORTS,
    );
    await replaceInEditor(
      page,
      FIRST_PROCEDURE,
      `${RAW_PROCEDURES}${FIRST_PROCEDURE}`,
    );
    await compileScript(page);
  });

  await test.step("a struct is entered as its layout's felts", async () => {
    const args = procedureArguments(page, "pick");
    // A struct of two felts: a group, one input per field. A u16: one
    // bounded felt.
    const pair = args.getByRole("group", { name: /^pair/ });
    await expect(pair).toContainText("Pair, 2 felts");
    await expect(args.getByText("u16", { exact: true })).toBeVisible();
    await expect(
      args.getByText("Entered as raw felts: the form doesn't know this type."),
    ).toHaveCount(1);
    await expect(args.getByText(/aren't supported yet/)).toHaveCount(0);
    await expect(invoke(page, "pick")).toBeDisabled();
    await pair.getByLabel("pair first").fill("1");
    await pair.getByLabel("pair second").fill("2");
    // Above a u16: flagged, and the run is blocked.
    await args.getByLabel(/^idx/).fill("65536");
    await args.getByLabel(/^last/).fill("4");
    await expect(args.getByLabel(/^idx/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(invoke(page, "pick")).toBeDisabled();
    await args.getByLabel(/^idx/).fill("3");
    await expect(invoke(page, "pick")).toBeEnabled();
    // Not a felt: flagged, and the run is blocked.
    await pair.getByLabel("pair second").fill("two");
    await expect(pair.getByLabel("pair second")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(invoke(page, "pick")).toBeDisabled();
    await pair.getByLabel("pair second").fill("0x2");
    // The felts reach the procedure in the fields' order, between the typed
    // arguments.
    await invoke(page, "pick").click();
    await expect(procedureResult(page, "pick")).toHaveText("1234");
  });

  await test.step("raw felts in field order are the typed argument", async () => {
    // The SIM faucet's id through the typed field, then its two felts by
    // hand: the same value to the procedure.
    await pickSimFaucet(page, "prefix_of");
    await invoke(page, "prefix_of").click();
    await expect(procedureResult(page, "prefix_of")).toHaveText(/^\d+$/);
    await pickSimFaucet(page, "suffix_of");
    await invoke(page, "suffix_of").click();
    await expect(procedureResult(page, "suffix_of")).toHaveText(/^\d+$/);
    const prefix =
      (await procedureResult(page, "prefix_of").textContent()) ?? "";
    const suffix =
      (await procedureResult(page, "suffix_of").textContent()) ?? "";
    expect(prefix).not.toBe(suffix);
    const args = procedureArguments(page, "same_id");
    await pickSimFaucet(page, "same_id");
    // An `AccountId` is `{ suffix, prefix }`.
    await args.getByLabel("pair first").fill(suffix);
    await args.getByLabel("pair second").fill(prefix);
    await invoke(page, "same_id").click();
    await expect(procedureResult(page, "same_id")).toHaveText("1");
    // The other way round isn't.
    await args.getByLabel("pair first").fill(prefix);
    await args.getByLabel("pair second").fill(suffix);
    await invoke(page, "same_id").click();
    await expect(procedureResult(page, "same_id")).toHaveText("0");
  });

  await test.step("the wallet's create_note runs from typed fields", async () => {
    const args = procedureArguments(page, "create_note");
    // The source's type names, the manifest's layouts: a tag is a u32, a
    // note type an enum, a recipient a word.
    await expect(args.getByText("NoteTag (u32)")).toBeVisible();
    await expect(
      args.getByText("NoteType (0 PRIVATE, 1 PUBLIC)"),
    ).toBeVisible();
    await args.getByLabel(/^tag/).fill("0");
    await args.getByLabel(/^recipient/).fill(`0x${"0b".repeat(32)}`);
    // Not a note type.
    await args.getByLabel(/^note_type/).fill("2");
    await expect(invoke(page, "create_note")).toBeDisabled();
    await args.getByLabel(/^note_type/).fill("0");
    await invoke(page, "create_note").click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Simulation of create_note" });
    // The note's index, a u16, in decimal.
    await expect(dialog.getByText("Returned: 0")).toBeVisible();
    await expect(dialog.getByText(/1 note\s*will be created/)).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).first().click();
  });

  await test.step("a u64 is entered as its two limbs", async () => {
    const args = procedureArguments(page, "scalar");
    const big = args.getByRole("group", { name: /^big/ });
    await expect(big).toContainText("u64, 2 felts");
    await big.getByLabel("big lo").fill("1");
    await big.getByLabel("big hi").fill("2");
    // The low limb on top, as miden-core-lib takes a u64.
    await invoke(page, "scalar").click();
    await expect(procedureResult(page, "scalar")).toHaveText("12");
  });

  await test.step("a procedure without a signature takes its stack as felts", async () => {
    // The manifest has no signature for it: the row shows it as the source
    // writes it, and the form takes the stack, its top first.
    await expect(
      procedureRow(page, "combine").getByText("proc combine", { exact: true }),
    ).toBeVisible();
    const args = procedureArguments(page, "combine");
    const stack = args.getByLabel(/^stack/);
    await expect(args.getByText("0 felts, top first")).toBeVisible();
    await stack.fill("3 x");
    await expect(invoke(page, "combine")).toBeDisabled();
    await stack.fill("3, 4");
    await expect(args.getByText("2 felts, top first")).toBeVisible();
    await invoke(page, "combine").click();
    // The stack it leaves, without its padding.
    await expect(procedureResult(page, "combine")).toHaveText("[43]");
    // An empty stack is one too.
    await stack.fill("");
    await invoke(page, "combine").click();
    await expect(procedureResult(page, "combine")).toHaveText("[0]");
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
  // A seeded vault too, kept across the crash (in memory, no page load): the
  // new client makes the faucet and the seed again.
  if (
    (await assetRows(page, "Vault").getByLabel("Vault amount 1").count()) === 0
  ) {
    await addAsset(page, "Vault", "SIM", "500");
  }
  await addAsset(page, "Note", "SIM", "100");
  const dialog = await simulateOnThrowaway(page, "p2id-note");
  await expect(
    dialog.getByRole("row", {
      name: "Fungible Asset Simulated asset SIM +100",
    }),
  ).toBeVisible();
  // Against the seeded state, at nonce 1.
  await expect(dialog.getByText("New nonce: 2.")).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).first().click();
};

// The arguments of a procedure, in the row under its own.
const procedureArguments = (page: Page, procedure: string) =>
  procedureRow(page, procedure).locator("xpath=following-sibling::tr[1]");

// Sets a procedure's `Asset` argument: a simulated asset and an amount.
const setAssetArgument = async (
  page: Page,
  procedure: string,
  symbol: string,
  amount: string,
) => {
  const args = procedureArguments(page, procedure);
  await args.getByRole("button").first().click();
  await page.getByRole("menuitemradio", { name: symbol, exact: true }).click();
  await args.getByPlaceholder("Amount").fill(amount);
};

// A foreign account's block in the Simulate tab.
const foreignAccount = (page: Page, name: string) =>
  editorConsole(page).getByRole("region", { name: `Foreign account ${name}` });

// The dropdown of the account `copy_count` reads, in the row under its own.
const copyCountAccountDropdown = (page: Page) =>
  procedureRow(page, "copy_count")
    .locator("xpath=following-sibling::tr[1]")
    .getByRole("button");

// Picks the account `copy_count` reads.
const selectCopyCountAccount = async (page: Page, name: string) => {
  await copyCountAccountDropdown(page).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
};

// Compiles the open script with a key stripped from the response's exports,
// as if api-compile hadn't reported it: without `callsForeign` the Simulate
// tab doesn't restrict the account arguments, and a sandbox account reaches
// the mock client; without `parameters` the arguments are named `param_N`.
const compileWithout = async (
  page: Page,
  key: "callsForeign" | "parameters",
) => {
  const compile = /\/scripts\/[0-9a-z_-]+$/;
  // The log may already show an earlier compile's line, which
  // `compileScript` accepts: unroute only once this one was answered.
  let resolve = () => {};
  const answered = new Promise<void>((done) => {
    resolve = done;
  });
  await page.route(compile, async (route) => {
    if (route.request().method() !== "PATCH") {
      return route.continue();
    }
    const response = await route.fetch();
    const body = await response.json();
    for (const { Procedure } of body.package.exports) {
      delete Procedure[key];
    }
    await route.fulfill({ response, json: body });
    resolve();
  });
  try {
    await compileScript(page);
    await answered;
  } finally {
    await page.unroute(compile);
  }
};

// Runs the Count Reader's `copy_count` and applies its result: `count` holds
// the counter's count.
const copyCount = async (page: Page, count: string) => {
  await invoke(page, "copy_count").click();
  const dialog = page
    .getByRole("dialog")
    .filter({ hasText: "Simulation of copy_count" });
  await dialog.getByRole("button", { name: "Apply to state" }).click();
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

// A list of assets in the Simulate tab: the note's ("Note") or the vault's
// ("Vault").
const assetRows = (page: Page, label: string) =>
  editorConsole(page).getByRole("group", { name: `${label} assets` });

// Adds a row to a list of assets: `symbol` (a simulated asset, or a sandbox
// faucet's symbol) and its amount in base units.
const addAsset = async (
  page: Page,
  label: string,
  symbol: string,
  amount: string,
) => {
  const rows = assetRows(page, label);
  const index =
    (await rows.getByRole("button", { name: /^Remove / }).count()) + 1;
  await rows.getByRole("button", { name: "Add asset" }).click();
  const amountField = rows.getByLabel(`${label} amount ${index}`);
  const row = rows
    .locator("div")
    .filter({ has: page.getByLabel(`${label} amount ${index}`) })
    .last();
  // The row's asset dropdown: the first simulated asset no row holds, or
  // none on a sandbox account.
  const dropdown = row.getByRole("button").first();
  if ((await dropdown.textContent())?.trim() !== symbol) {
    await dropdown.click();
    await page
      .getByRole("menuitemradio", { name: symbol, exact: true })
      .click();
  }
  await expect(dropdown).toHaveText(symbol);
  await amountField.fill(amount);
};

// Adds a simulated asset to the script's list.
const newAsset = async (page: Page, label: string, symbol: string) => {
  const rows = assetRows(page, label);
  await rows.getByLabel(`New ${label} asset symbol`).fill(symbol);
  await rows.getByRole("button", { name: "New asset" }).click();
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
    dialog.getByRole("button", { name: "Apply to state" }),
  ).toHaveCount(0);
  return dialog;
};

// On the Counter Contract example's packages.
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
    await dialog.getByRole("button", { name: "Apply to state" }).click();
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
    await addAsset(page, "Note", "SIM", "100");
    await expectAssetNotTaken(page, "increment-note");
    // A sandbox account takes no simulated asset: switching clears the
    // note's assets, and the vault's editor goes.
    await selectTarget(page, "Counter Contract");
    await expect(
      assetRows(page, "Note").getByText("The note carries no asset."),
    ).toBeVisible();
    await expect(assetRows(page, "Vault")).toHaveCount(0);
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
      editorConsole(page).getByRole("button", { name: "Add note storage" }),
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
    // The template calls the standard basic wallet's `receive_asset` by its
    // root, which the simulated account has: with no dependency, it holds
    // the basic wallet only.
    await selectTarget(page, "Simulated account");
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
    // Only the simulated assets: a sandbox faucet would crash the mock
    // client.
    await addAsset(page, "Note", "SIM", "100");
    await assetRows(page, "Note").getByRole("button", { name: "SIM" }).click();
    await expect(page.getByRole("menuitemradio")).toHaveCount(1);
    await page.getByRole("menuitemradio", { name: "SIM", exact: true }).click();
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

  await test.step("a note's assets land in the seeded vault", async () => {
    const storeBefore = await networkStoreAccounts(page);
    // The failed run above showed the log.
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    const field = editorConsole(page)
      .locator("div")
      .filter({ hasText: "target-account-id" })
      .last();
    await field.getByRole("button", { name: "Other Counter" }).click();
    await page
      .getByRole("menuitemradio", { name: "Simulated account", exact: true })
      .click();
    // The note carries 100 SIM (the row above) and 50 of another simulated
    // asset; the vault starts with 1000 SIM.
    await newAsset(page, "Note", "USDC");
    await addAsset(page, "Note", "USDC", "50");
    await addAsset(page, "Vault", "SIM", "1000");
    const dialog = await simulateOnThrowaway(page, "p2id-note");
    await expect(dialog.getByText(/1 note\s*will be consumed/)).toBeVisible();
    for (const name of [
      "Fungible Asset Simulated asset SIM +100",
      "Fungible Asset Simulated asset USDC +50",
    ]) {
      await expect(dialog.getByRole("row", { name })).toBeVisible();
    }
    // The seed isn't a change: the vault was seeded at nonce 1.
    await expect(dialog.getByText("New nonce: 2.")).toBeVisible();
    await dialog.getByRole("button", { name: "Apply to state" }).click();
    await expect(dialog).toBeHidden();
    const vault = assetRows(page, "Vault");
    await expect(vault.getByLabel("Vault amount 1")).toHaveValue("1100");
    await expect(vault.getByLabel("Vault amount 2")).toHaveValue("50");
    await expect(vault.getByRole("button", { name: "USDC" })).toBeVisible();
    await editorConsole(page).getByRole("tab", { name: "Output" }).click();
    await expect(
      editorConsole(page)
        .getByText(
          "Simulated p2id-note on the simulated account: no storage change, 2 vault changes.",
          { exact: true },
        )
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

  await test.step("a note's foreign call reads a dependency marked as a foreign account", async () => {
    // The note no longer calls its target: it reads the counter of the
    // account its storage names, through FPI, and checks the count.
    await page.getByRole("link", { name: "increment-note" }).first().click();
    await expect(page).toHaveURL(/\/scripts\//);
    await replaceInEditor(page, "use counter_account\n", FPI_NOTE_IMPORTS);
    await replaceInEditor(
      page,
      'const ERR_COUNT_NOT_INCREMENTED = "the count didn\'t go up by one"\n',
      "",
    );
    await replaceInEditor(page, INCREMENT_NOTE_MAIN, FPI_NOTE_MAIN);
    await compileScript(page);
    await selectTarget(page, "Simulated account");
    // The dependency is a component of the simulated account until it's
    // marked: then it's another account, staged on the mock chain.
    await simulatedComponent(page, "counter-account")
      .getByRole("switch", { name: "Foreign account" })
      .click();
    const foreign = editorConsole(page).getByRole("region", {
      name: "Foreign account counter-account",
    });
    await foreign.getByRole("button", { name: "Add entry" }).click();
    await foreign.getByLabel(`${SLOT} key 1`).fill("1");
    await foreign.getByLabel(`${SLOT} value 1`).fill("7");
    // A MASM note's storage is raw felts: the foreign account's id, prefix
    // then suffix, then the count it should hold. The id is known once the
    // account is staged: a first run, naming no account, gives it in the log.
    const storage = (index: number) =>
      editorConsole(page).getByLabel(`Note storage item ${index}`, {
        exact: true,
      });
    for (const index of [1, 2, 3]) {
      await editorConsole(page)
        .getByRole("button", { name: "Add note storage" })
        .click();
      await storage(index).fill("0");
    }
    await simulateButton(page).click();
    await expect(
      editorConsole(page)
        .getByText("Simulation of increment-note failed.", { exact: true })
        .last(),
    ).toBeVisible();
    const staged = editorConsole(page)
      .getByText(/Foreign account counter-account: 0x[0-9a-f]{30}/)
      .last();
    await expect(staged).toBeVisible();
    const id = (await staged.textContent())?.match(/0x[0-9a-f]{30}/)?.[0];
    if (!id) {
      throw new Error("no foreign account id in the log");
    }
    const { prefix, suffix } = accountIdFelts(id);
    await editorConsole(page).getByRole("tab", { name: "Simulate" }).click();
    await storage(1).fill(prefix);
    await storage(2).fill(suffix);
    await storage(3).fill("7");
    const dialog = await simulateOnThrowaway(page, "increment-note");
    await expect(
      dialog.getByText("1 note will be consumed", { exact: false }),
    ).toBeVisible();
    await expect(
      dialog.getByText("Storage will not be changed."),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).first().click();
    // Another count than the foreign account's fails the note's assertion:
    // a second failure, with the kernel's error code for it.
    await storage(3).fill("8");
    await simulateButton(page).click();
    await expect(
      editorConsole(page).getByText("Simulation of increment-note failed.", {
        exact: true,
      }),
    ).toHaveCount(2);
    await expect(
      editorConsole(page).getByText(/assertion failed with error code/),
    ).toHaveCount(2);
  });

  // Lists the tutorials' counter as a target, after the note no longer calls
  // its target.
  await test.step("a plain wallet can't run the counter's scripts", async () => {
    await importAccount(page, "Plain Wallet", WALLET_ACCOUNT_ID);
    // Through the sidebar: a page load would wait for the wallet's sync. It
    // has neither `get_count` nor `increment_count`. The note no longer
    // calls its target since the step above: every account is its target.
    for (const script of ["counter-script"]) {
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
