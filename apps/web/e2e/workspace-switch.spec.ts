import { expect, type Page, test } from "@playwright/test";
import { launchExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

// What can happen while a workspace is being replaced: the store is cleared,
// then the next one is imported. That takes milliseconds, too little to hit by
// timing, so these tests hold the switch open at that point.

declare global {
  interface Window {
    releaseStoreClear?: () => void;
  }
}

const switcher = (page: Page) =>
  page
    .locator('[data-sidebar="sidebar"]')
    .getByRole("button", { name: /Miden Playground/ });

const networkBadge = (page: Page) => page.locator('header [data-slot="badge"]');

const openProjectsMenu = async (page: Page) => {
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await switcher(page).click();
  await page.getByRole("menuitem", { name: "Projects" }).click();
  await expect(page.getByRole("menu")).toHaveCount(2);
  return page.getByRole("menu").last();
};

const closeMenu = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
};

// Saves the workspace as a new project, named `name`.
const saveAs = async (page: Page, name: string) => {
  const menu = await openProjectsMenu(page);
  await menu.getByRole("menuitem", { name: "Save as…" }).click();
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

const openProject = async (page: Page, name: string) => {
  const menu = await openProjectsMenu(page);
  await menu
    .getByRole("menuitem", { name: `${name} Testnet`, exact: true })
    .click();
};

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

  await holdNextStoreClear(page);
  await openProject(page, "Empty");
  await page.waitForFunction(() => !!window.releaseStoreClear);
  await openProject(page, "With account");
  // The second one is queued once the menu's action is done.
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
