import { expect, type Page, test } from "@playwright/test";
import { launchExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

// The sidebar's project switcher: its button names the workspace (the saved
// project's name, the example's title, or "<Network> sandbox").
const switcher = (page: Page) =>
  page
    .locator('[data-sidebar="sidebar"]')
    .getByRole("button", { name: /Miden Playground/ });

const networkBadge = (page: Page) => page.locator('header [data-slot="badge"]');

// Waits for the app to be live on `network` after a switch to it. The badge
// names the new network at once, still with the old client's block height;
// then the client re-initializes, unmounting the app for the app shell, whose
// badge has no height; then the new client syncs and the height is back.
// Opening the menu before the re-initialization would lose it.
const expectNetworkSwitch = async (
  page: Page,
  network: "Testnet" | "Mainnet",
) => {
  await expect(networkBadge(page)).toContainText(network, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await expect(networkBadge(page)).not.toContainText("#", {
    timeout: TRANSACTION_TIMEOUT,
  });
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  // The app remounts a few more times in the seconds after the client
  // initialized (the signer providers settling), which would close a menu
  // opened meanwhile: wait for the page to stay mounted a while.
  await expect(async () => {
    const main = await page.locator("main").elementHandle();
    await page.waitForTimeout(3000);
    expect(await main?.evaluate((element) => element.isConnected)).toBe(true);
  }).toPass({ timeout: TRANSACTION_TIMEOUT });
};

// Opens the Projects submenu and returns it (the submenu is the last menu
// opened, portaled after the root one).
const openProjectsMenu = async (page: Page) => {
  // The app shell's switcher, shown while the client initializes, has no
  // menu: wait for the live badge (a block height) first.
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await switcher(page).click();
  await page.getByRole("menuitem", { name: "Projects" }).click();
  const menu = page.getByRole("menu").last();
  await expect(
    menu.getByRole("menuitem", { name: "Save", exact: true }),
  ).toBeVisible();
  return menu;
};

const closeMenu = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
};

// Saves the workspace under `name` through `item` ("Save" with no active
// project, or "Save as…"), checking the name the dialog proposes first.
const saveProjectAs = async (
  page: Page,
  { item, proposed, name }: { item: string; proposed: string; name: string },
) => {
  const menu = await openProjectsMenu(page);
  await menu.getByRole("menuitem", { name: item, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /^Save Project/ });
  const input = dialog.getByLabel("Name");
  await expect(input).toHaveValue(proposed);
  await input.fill(name);
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Project saved.").last()).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(switcher(page)).toContainText(name);
};

// Opens a saved project from the submenu, whose items read "<name> <network>".
const openProject = async (page: Page, item: string) => {
  const menu = await openProjectsMenu(page);
  await menu.getByRole("menuitem", { name: item, exact: true }).click();
};

// Stamps a saved project's store with a newer client version, which the
// running client then refuses to import (as after a rollback).
const stampProjectWithNewerClient = (page: Page, name: string) =>
  page.evaluate(
    (name) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("PlaygroundProjects");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const transaction = database.transaction(
            ["meta", "projects"],
            "readwrite",
          );
          const metas = transaction.objectStore("meta");
          const projects = transaction.objectStore("projects");
          const getMetas = metas.getAll();
          getMetas.onsuccess = () => {
            const meta = (
              getMetas.result as { kind: string; id: string; name: string }[]
            ).find((meta) => meta.kind === "project" && meta.name === name);
            if (!meta) {
              transaction.abort();
              reject(new Error(`No saved project named "${name}".`));
              return;
            }
            const key = `${meta.kind}:${meta.id}`;
            const get = projects.get(key);
            get.onsuccess = () => {
              const project = get.result;
              const store = JSON.parse(project.store);
              for (const setting of store.settings) {
                if (setting.key === "clientVersion") {
                  setting.value.data = btoa("99.0.0");
                }
              }
              projects.put({ ...project, store: JSON.stringify(store) }, key);
            };
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

// Saving an example or a sandbox makes it a project, listed in the sidebar's
// Projects submenu, which opens it again (switching networks when needed).
// The example's packages come from apps/api: run it along with the dev
// server. Creating the Mainnet sandbox needs no wallet.
test("save, open and delete projects", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("save the counter example as a project", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await expect(switcher(page)).toContainText("Counter Contract");
    await saveProjectAs(page, {
      item: "Save",
      proposed: "Counter Contract",
      name: "My counter",
    });
  });

  await test.step("save it as a copy, which becomes the active project", async () => {
    await saveProjectAs(page, {
      item: "Save as…",
      proposed: "My counter copy",
      name: "My counter copy",
    });
    // Save, with an active project, saves without asking.
    const menu = await openProjectsMenu(page);
    await menu.getByRole("menuitem", { name: "Save", exact: true }).click();
    await expect(page.getByText("Project saved.").last()).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("The project couldn't be saved.")).toHaveCount(
      0,
    );
  });

  await test.step("save a new Mainnet sandbox", async () => {
    await switcher(page).click();
    await page.getByRole("menuitem", { name: "New Mainnet sandbox" }).click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expectNetworkSwitch(page, "Mainnet");
    await expect(switcher(page)).toContainText("Mainnet sandbox");
    await expect(page.getByRole("row", { name: /USDCx Faucet/ })).toBeVisible();
    await saveProjectAs(page, {
      item: "Save",
      proposed: "Mainnet sandbox",
      name: "Mainnet scratch",
    });
  });

  await test.step("the submenu lists them, most recently saved first", async () => {
    const menu = await openProjectsMenu(page);
    const items = menu.getByRole("menuitem");
    const names = (await items.allTextContents()).map((text) =>
      text.replace(/\s+/g, " ").trim(),
    );
    expect(names.slice(-3)).toEqual([
      "Mainnet scratch Mainnet",
      "My counter copy Testnet",
      "My counter Testnet",
    ]);
    // The active project is checked.
    await expect(
      items
        .filter({ hasText: "Mainnet scratch" })
        .locator("svg.text-green-500"),
    ).toHaveCount(1);
    await expect(
      items
        .filter({ hasText: "My counter copy" })
        .locator("svg.text-green-500"),
    ).toHaveCount(0);
    await closeMenu(page);
  });

  await test.step("open a Testnet project from the Mainnet sandbox", async () => {
    await openProject(page, "My counter Testnet");
    await expect(page).toHaveURL(/\/accounts$/);
    await expectNetworkSwitch(page, "Testnet");
    await expect(switcher(page)).toContainText("My counter");
    await expect(
      page.getByRole("row", { name: /Counter Contract/ }),
    ).toBeVisible({ timeout: 60_000 });
  });

  await test.step("open the Mainnet project back", async () => {
    await openProject(page, "Mainnet scratch Mainnet");
    await expect(page).toHaveURL(/\/accounts$/);
    await expectNetworkSwitch(page, "Mainnet");
    await expect(switcher(page)).toContainText("Mainnet scratch");
    await expect(page.getByRole("row", { name: /USDCx Faucet/ })).toBeVisible();
    await expect(
      page.getByRole("row", { name: /Counter Contract/ }),
    ).toBeHidden();
  });

  await test.step("delete the active project", async () => {
    const menu = await openProjectsMenu(page);
    await menu.getByRole("menuitem", { name: "Delete project" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete project" })
      .click();
    await expect(page.getByText("Project deleted.")).toBeVisible();
    // The workspace stays, as an unsaved sandbox.
    await expect(switcher(page)).toContainText("Mainnet sandbox");
    await expect(page.getByRole("row", { name: /USDCx Faucet/ })).toBeVisible();
    const reopened = await openProjectsMenu(page);
    await expect(
      reopened.getByRole("menuitem", { name: "Mainnet scratch Mainnet" }),
    ).toHaveCount(0);
    await expect(
      reopened.getByRole("menuitem", { name: "Delete project" }),
    ).toHaveAttribute("aria-disabled", "true");
    await closeMenu(page);
  });

  await test.step("a project the client refuses starts a new sandbox", async () => {
    await stampProjectWithNewerClient(page, "My counter");
    await openProject(page, "My counter Testnet");
    // The toast shows once the new client imported the fallback, while the
    // switch is still being watched: wait for both at once.
    await Promise.all([
      expect(page.getByText("The project couldn't be restored.")).toBeVisible({
        timeout: TRANSACTION_TIMEOUT,
      }),
      expectNetworkSwitch(page, "Testnet"),
    ]);
    await expect(switcher(page)).toContainText("Testnet sandbox");
    await expect(page.getByRole("row", { name: /USDCx Faucet/ })).toBeVisible();
    await expect(
      page.getByRole("row", { name: /Counter Contract/ }),
    ).toBeHidden();
    // The other Testnet project still opens.
    await openProject(page, "My counter copy Testnet");
    await expect(switcher(page)).toContainText("My counter copy");
    await expect(
      page.getByRole("row", { name: /Counter Contract/ }),
    ).toBeVisible({ timeout: 60_000 });
  });
});
