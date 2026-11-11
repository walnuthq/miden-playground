import { expect, type Page, test } from "@playwright/test";
import { createCounterScript } from "./editor";
import { launchExample, startExample } from "./example";
import {
  clickProjectsItem,
  closeMenu,
  networkBadge,
  openProjectsMenu,
  switcher,
} from "./projects-menu";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

// What can happen while a workspace is being replaced: the store is cleared,
// then the next one is imported. That takes milliseconds, too little to hit by
// timing, so these tests hold the switch open at that point.

declare global {
  interface Window {
    releaseStoreClear?: () => void;
  }
}

// Saves the workspace as a new project, named `name`.
const saveAs = async (page: Page, name: string) => {
  await clickProjectsItem(page, "Save as…");
  const dialog = page.getByRole("dialog", { name: "Save Project As" });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(switcher(page)).toContainText(name);
};

const newTestnetSandbox = async (page: Page) => {
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await switcher(page).click();
  await page.getByRole("menuitem", { name: "New Testnet sandbox" }).click();
  await expect(switcher(page)).toContainText("Testnet sandbox", {
    timeout: TRANSACTION_TIMEOUT,
  });
};

const openProject = (page: Page, name: string) =>
  clickProjectsItem(page, `${name} Testnet`);

// Holds the next switch right after it cleared the store, until
// `window.releaseStoreClear()`. clearMidenStorage starts by listing the
// databases: this deletes them there, waits, and has nothing left for it.
const holdNextStoreClear = (page: Page) =>
  page.evaluate(() => {
    const databases = indexedDB.databases.bind(indexedDB);
    indexedDB.databases = async () => {
      indexedDB.databases = databases;
      const miden = (await databases()).flatMap(({ name }) =>
        name?.toLowerCase().includes("miden") ? [name] : [],
      );
      await Promise.all(
        miden.map(
          (name) =>
            new Promise<void>((resolve) => {
              const request = indexedDB.deleteDatabase(name);
              request.onsuccess = () => resolve();
              request.onerror = () => resolve();
              request.onblocked = () => resolve();
            }),
        ),
      );
      await new Promise<void>((resolve) => {
        window.releaseStoreClear = resolve;
      });
      return [];
    };
  });

const releaseStoreClear = async (page: Page) => {
  await page.waitForFunction(() => !!window.releaseStoreClear);
  await page.evaluate(() => {
    window.releaseStoreClear?.();
    delete window.releaseStoreClear;
  });
};

// The rows of a saved project's store, its dump as a string.
const savedStore = (page: Page, name: string) =>
  page.evaluate(
    (name) =>
      new Promise<string>((resolve, reject) => {
        const open = indexedDB.open("PlaygroundProjects");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const transaction = database.transaction(["meta", "projects"]);
          const getMetas = transaction.objectStore("meta").getAll();
          getMetas.onsuccess = () => {
            const meta = (
              getMetas.result as { kind: string; id: string; name: string }[]
            ).find((meta) => meta.kind === "project" && meta.name === name);
            if (!meta) {
              reject(new Error(`No saved project named "${name}".`));
              return;
            }
            const get = transaction
              .objectStore("projects")
              .get(`${meta.kind}:${meta.id}`);
            get.onsuccess = () => {
              database.close();
              resolve(get.result.store);
            };
          };
        };
      }),
    name,
  );

// A second switch during the first one's import ends on the second workspace,
// with its own store.
test("a second switch during an import gets its own store", async ({
  page,
}) => {
  logBrowserErrors(page);
  await launchExample(page, {
    title: "Counter Contract",
    accountName: "Counter Contract",
  });
  await saveAs(page, "With account");
  await newTestnetSandbox(page);
  await saveAs(page, "Empty");
  // Opening the active project wouldn't switch.
  await saveAs(page, "Current");

  await holdNextStoreClear(page);
  await openProject(page, "Empty");
  await page.waitForFunction(() => !!window.releaseStoreClear);
  await openProject(page, "With account");
  // The second one is queued once the menu's action is done: it reads the
  // project from IndexedDB, then sets the app's `nextState`. Neither shows in
  // the page (the menu closes before, the switcher's label and the Save item
  // already reflect the first switch), so there is no condition to wait on
  // without a test hook in the app; this is the time that read takes.
  await page.waitForTimeout(1_000);
  await releaseStoreClear(page);

  await expect(switcher(page)).toContainText("With account", {
    timeout: TRANSACTION_TIMEOUT,
  });
  await expect(page.getByRole("row", { name: /Counter Contract/ })).toBeVisible(
    { timeout: TRANSACTION_TIMEOUT },
  );
  // Syncing again, on the store the second project saved.
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await saveAs(page, "Saved after");
  const after = await savedStore(page, "Saved after");
  const expected = await savedStore(page, "With account");
  const accounts = (dump: string) =>
    (JSON.parse(dump) as { accountCode: unknown[] }).accountCode.length;
  expect(accounts(expected)).toBeGreaterThan(0);
  expect(accounts(after)).toBe(accounts(expected));
});

// Saving during a switch would write the store being replaced over the project.
test("saving during a switch leaves the project as it was", async ({
  page,
}) => {
  logBrowserErrors(page);
  await page.goto("/");
  await newTestnetSandbox(page);
  await saveAs(page, "Mine");
  await saveAs(page, "Other");
  await openProject(page, "Mine");
  await expect(switcher(page)).toContainText("Mine", {
    timeout: TRANSACTION_TIMEOUT,
  });
  const before = await savedStore(page, "Mine");

  await holdNextStoreClear(page);
  await openProject(page, "Other");
  await page.waitForFunction(() => !!window.releaseStoreClear);
  const menu = await openProjectsMenu(page);
  const save = menu.getByRole("menuitem", { name: "Save", exact: true });
  await expect(save).toHaveAttribute("aria-disabled", "true");
  await save.click({ force: true });
  // Waits for a save that must not happen: nothing in the page reports a
  // refused save (it is dropped silently), so there is no condition to wait
  // on. Longer than a save of a sandbox store takes.
  await page.waitForTimeout(2_000);
  const during = await savedStore(page, "Mine");
  await closeMenu(page).catch(() => {});
  await releaseStoreClear(page);
  await expect(switcher(page)).toContainText("Other", {
    timeout: TRANSACTION_TIMEOUT,
  });
  expect(during.length).toBe(before.length);
});

// A store that can't be imported, in a switch without a fallback of its own,
// must not leave the app waiting forever.
test("a failed import starts a new sandbox", async ({ page }) => {
  logBrowserErrors(page);
  await launchExample(page, {
    title: "Counter Contract",
    accountName: "Counter Contract",
  });
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  // The next time the client's store is opened, it fails: that's the import.
  await page.evaluate(() => {
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = (name, version) => {
      if (name.toLowerCase().includes("miden")) {
        indexedDB.open = open;
        throw new Error("Store import failed (test).");
      }
      return open(name, version);
    };
  });
  await switcher(page).click();
  await page.getByRole("menuitem", { name: "New Testnet sandbox" }).click();

  await expect(page.getByText("The workspace couldn't be opened.")).toBeVisible(
    { timeout: TRANSACTION_TIMEOUT },
  );
  await expect(switcher(page)).toContainText("Testnet sandbox");
  await expect(page.getByRole("row", { name: /Counter Contract/ })).toHaveCount(
    0,
  );
  // Not stuck: saving is available again.
  const menu = await openProjectsMenu(page);
  await expect(
    menu.getByRole("menuitem", { name: "Save", exact: true }),
  ).not.toHaveAttribute("aria-disabled", "true");
});

// Opening the project that's already open must not throw away what changed
// since its last save.
test("clicking the active project keeps unsaved work", async ({ page }) => {
  logBrowserErrors(page);
  await page.goto("/");
  await newTestnetSandbox(page);
  await saveAs(page, "Mine");
  await createCounterScript(page);
  // The script page's header has a badge of its own.
  await page.getByRole("link", { name: "Accounts" }).first().click();
  await expect(page).toHaveURL(/\/accounts$/);
  const imports: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Store imported successfully.")) {
      imports.push(message.text());
    }
  });

  await openProject(page, "Mine");
  await expect(page).toHaveURL(/\/accounts$/);
  // Waits for a re-import that must not happen. The URL assertion above
  // already waited for navigation, and the header has no idle indicator to
  // wait on instead, so this is longer than a reload of the project takes.
  await page.waitForTimeout(5_000);
  expect(imports).toEqual([]);
  await expect(switcher(page)).toContainText("Mine");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page.getByRole("link", { name: "Scripts" }).first().click();
  await expect(page.getByText("counter-account").first()).toBeVisible();
});

// A deploy that fails is tried once: each attempt asks the faucet for funds,
// and tells the user again. Its toast offers to try again.
test("a failed example deploy doesn't retry by itself", async ({ page }) => {
  logBrowserErrors(page);
  const prover = /tx-prover\.testnet\.miden\.io/;
  let attempts = 0;
  await page.route(prover, (route) => {
    attempts++;
    return route.abort();
  });
  await startExample(page);
  const failed = page.getByText("Counter Contract couldn't be deployed.");
  await expect(failed.first()).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  // Waits for a retry that must not happen. A retry would come from the
  // deploy effect in components/lib/network-badge.tsx re-running past its
  // `deployingWorkspaceRun` guard; the likeliest trigger is the sync loop,
  // which ticks every 2.5 s, so 45 s covers about 18 ticks. Not a hard bound:
  // nothing in the app bounds a retry.
  await page.waitForTimeout(45_000);
  console.info("Deploy attempts:", attempts);
  expect(attempts).toBe(1);

  await page.unroute(prover);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(failed).toHaveCount(0);
  await expect(page.getByText("Counter Contract deployed.")).toBeVisible({
    timeout: 2 * TRANSACTION_TIMEOUT,
  });
  await expect(
    page.getByRole("cell", { name: "Counter Contract", exact: true }),
  ).toBeVisible();
});

// A database read that fails says so: the project is still there, not deleted.
test("a failed project read doesn't claim the project is gone", async ({
  page,
}) => {
  logBrowserErrors(page);
  await page.goto("/");
  await newTestnetSandbox(page);
  await saveAs(page, "Mine");
  await saveAs(page, "Other");
  await page.evaluate(() => {
    const { get } = IDBObjectStore.prototype;
    IDBObjectStore.prototype.get = function (key) {
      if (this.name === "projects") {
        IDBObjectStore.prototype.get = get;
        throw new Error("Read failed (test).");
      }
      return get.call(this, key);
    };
  });
  await openProject(page, "Mine");
  await expect(page.getByText("Mine couldn't be opened.")).toBeVisible();
  await expect(page.getByText(/couldn't be read/)).toBeVisible();
  await expect(page.getByText(/It was deleted/)).toHaveCount(0);
  await expect(switcher(page)).toContainText("Other");
  // It's still there: the next try opens it.
  await openProject(page, "Mine");
  await expect(switcher(page)).toContainText("Mine", {
    timeout: TRANSACTION_TIMEOUT,
  });
});

// A blank or taken name says what's wrong, and the dialog stays open.
test("the save dialog refuses blank and duplicate names", async ({ page }) => {
  logBrowserErrors(page);
  await page.goto("/");
  await newTestnetSandbox(page);
  await saveAs(page, "Mine");

  await clickProjectsItem(page, "Save as…");
  const dialog = page.getByRole("dialog", { name: "Save Project As" });
  const name = dialog.getByLabel("Name");
  const save = dialog.getByRole("button", { name: "Save", exact: true });
  const projectRows = async () => {
    const menu = await openProjectsMenu(page);
    const count = await menu
      .getByRole("menuitem", { name: /Testnet$/ })
      .count();
    await closeMenu(page);
    return count;
  };

  await name.fill("   ");
  await save.click();
  await expect(dialog.getByText("Enter a name.")).toBeVisible();
  await expect(dialog).toBeVisible();

  // Whatever the case and the spaces around it.
  await name.fill(" mine ");
  await expect(dialog.getByText("Enter a name.")).toHaveCount(0);
  await save.click();
  await expect(
    dialog.getByText("A project with this name already exists."),
  ).toBeVisible();
  await expect(dialog).toBeVisible();

  await name.fill("Mine 2");
  await save.click();
  await expect(dialog).toBeHidden();
  await expect(switcher(page)).toContainText("Mine 2");
  expect(await projectRows()).toBe(2);
});
