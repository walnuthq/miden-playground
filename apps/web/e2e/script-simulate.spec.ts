import { expect, type Page, test } from "@playwright/test";
import { COMPILED, createCounterScript, replaceInEditor } from "./editor";
import { launchExample } from "./example";
import {
  logBrowserErrors,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

const SLOT = "counter_account::counter_contract::count_map";

// The tutorials' counter contract (`TESTNET_COUNTER_CONTRACT_ADDRESS` in
// lib/constants.ts, which reads Vite's env and so can't be imported here).
const OTHER_ACCOUNT_ADDRESS =
  "mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv_qr7qqq9wr6w";

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
  });
});

// Picks the Simulate tab's target account.
const selectTarget = async (page: Page, name: string) => {
  await editorConsole(page)
    .getByRole("button", { name: "Select account" })
    .click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
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
    await simulate(page, "counter-script");
  });

  await test.step("import a second account", async () => {
    // The tutorials' counter contract: another account a note can target.
    await page.goto("/accounts");
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Import account" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Account" });
    await dialog.getByLabel("Name").fill("Other Counter");
    await dialog.getByLabel("Address").fill(OTHER_ACCOUNT_ADDRESS);
    await dialog.getByRole("button", { name: "Import" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
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
    const run = editorConsole(page).getByRole("button", {
      name: "Simulate",
      exact: true,
    });
    // The target account first, then the note's storage field.
    await editorConsole(page)
      .getByRole("button", { name: "Select account" })
      .first()
      .click();
    await page
      .getByRole("menuitemradio", { name: "Counter Contract", exact: true })
      .click();
    await expect(run).toBeDisabled();
    await field.getByRole("button", { name: "Select account" }).click();
    await page
      .getByRole("menuitemradio", { name: "Counter Contract", exact: true })
      .click();
    await expect(run).toBeEnabled();
  });

  await test.step("the P2ID note is consumed by its target only", async () => {
    await editorConsole(page)
      .getByRole("button", { name: "Simulate", exact: true })
      .click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Simulation of p2id-note" });
    await expect(
      dialog.getByText("1 note will be consumed", { exact: false }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await dialog.getByRole("button", { name: "Close" }).first().click();
    // Another account as the note's target: its script's assertion fails.
    const field = editorConsole(page)
      .locator("div")
      .filter({ hasText: "target-account-id" })
      .last();
    await field.getByRole("button", { name: "Counter Contract" }).click();
    await page
      .getByRole("menuitemradio", { name: "Other Counter", exact: true })
      .click();
    await editorConsole(page)
      .getByRole("button", { name: "Simulate", exact: true })
      .click();
    await expect(
      editorConsole(page).getByText("Simulation of p2id-note failed.").last(),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
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
});
