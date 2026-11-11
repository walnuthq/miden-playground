import { expect, type Page, test } from "@playwright/test";
import { launchExample, startExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

// The sidebar's project switcher: its button names the workspace (the saved
// project's name, the example's title, or "<Network> sandbox").
const switcher = (page: Page) =>
  page
    .locator('[data-sidebar="sidebar"]')
    .getByRole("button", { name: /Miden Playground/ });

const tutorial2 = "Transfer assets between wallets";

const networkBadge = (page: Page) => page.locator('header [data-slot="badge"]');

// Waits for the app to be live on `network` after a switch to it: the switch
// replaces the page with the app shell, whose badge names the new network
// without a block height, until the client has re-initialized and synced. The
// page then stays (projects.spec opens a menu right away: it used to be
// remounted a few more times by the signer providers settling).
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
  // Both open: tutorials have no Save item to wait for.
  await expect(page.getByRole("menu")).toHaveCount(2);
  const menu = page.getByRole("menu").last();
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

  await test.step("a tutorial lists the projects, without saving", async () => {
    await switcher(page).click();
    await page.getByRole("menuitem", { name: "Tutorials" }).click();
    await page.getByRole("menuitem", { name: /^2\. / }).click();
    await expect(switcher(page)).toContainText(tutorial2, { timeout: 60_000 });
    await expect(page.getByRole("row", { name: /Wallet A/ })).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page.getByRole("row", { name: /Counter Contract/ }),
    ).toBeHidden();
    const menu = await openProjectsMenu(page);
    for (const name of ["Save", "Save as…", "Delete project"]) {
      await expect(
        menu.getByRole("menuitem", { name, exact: true }),
      ).toHaveCount(0);
    }
    await expect(
      menu.getByRole("menuitem", { name: "My counter copy Testnet" }),
    ).toBeVisible();
    await closeMenu(page);
  });

  await test.step("open a project from the tutorial, which can be resumed", async () => {
    await openProject(page, "My counter copy Testnet");
    await expect(switcher(page)).toContainText("My counter copy", {
      timeout: 60_000,
    });
    await expect(
      page.getByRole("row", { name: /Counter Contract/ }),
    ).toBeVisible({ timeout: 60_000 });
    await switcher(page).click();
    await page.getByRole("menuitem", { name: "Tutorials" }).click();
    await expect(
      page.getByRole("menuitem", { name: /^2\. / }).getByTitle("In progress"),
    ).toBeVisible();
    await closeMenu(page);
  });
});

// The node's submit method, as named in the SDK's WASM (NodeService/SubmitProvenTx).
// The `$` keeps it from matching SubmitProvenTxBatch.
const SUBMIT_ROUTE =
  /rpc\.testnet\.miden\.io\/miden\.node\.v1\.NodeService\/SubmitProvenTx$/;

// Leaving an example while its account is being deployed abandons the deploy,
// which must not report to, or add its account to, the next workspace. The
// proof is held back so the deploy is mid-transaction during the switch.
test("a deploy still running doesn't reach the next workspace", async ({
  page,
}) => {
  logBrowserErrors(page);
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let proving = () => {};
  const provingStarted = new Promise<void>((resolve) => {
    proving = resolve;
  });
  let answered = () => {};
  const proverAnswered = new Promise<void>((resolve) => {
    answered = resolve;
  });
  await page.route(/prover/, async (route) => {
    proving();
    await held;
    try {
      // Fetched here, not continued, so the test knows when it was answered.
      await route.fulfill({ response: await route.fetch() });
    } catch {
      // The page abandoned the request meanwhile.
    } finally {
      answered();
    }
  });
  let submitted = false;
  let submitDone = () => {};
  const submitAnswered = new Promise<void>((resolve) => {
    submitDone = resolve;
  });
  await page.route(SUBMIT_ROUTE, async (route) => {
    submitted = true;
    try {
      await route.fulfill({ response: await route.fetch() });
    } catch {
      // The page abandoned the request meanwhile.
    } finally {
      submitDone();
    }
  });
  await startExample(page);
  await provingStarted;

  await switcher(page).click();
  await page.getByRole("menuitem", { name: "Tutorials" }).click();
  await page.getByRole("menuitem", { name: /^2\. / }).click();
  await expect(switcher(page)).toContainText(tutorial2, { timeout: 60_000 });
  await expect(page.getByRole("row", { name: /Wallet A/ })).toBeVisible({
    timeout: 60_000,
  });
  // The proof is held for the whole switch, which outlasts the SDK's request
  // deadline: the deploy fails ("Request timed out") and no
  // SubmitProvenTx request follows (observed). If the timing changes
  // and a submit does happen, the test waits for the node's answer before
  // asserting, so the assertions never run before a late write could land.
  // The settles let the page render whatever the abandoned deploy wrote.
  release();
  await proverAnswered;
  await page.waitForTimeout(5_000);
  if (submitted) {
    await submitAnswered;
    await page.waitForTimeout(5_000);
  }
  await expect(page.getByRole("row", { name: /Counter Contract/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/Counter Contract (deployed|couldn't)/),
  ).toHaveCount(0);
});

// The tutorial snapshot saved when leaving it: its app state and its store,
// read from the saved projects' database (tutorials have no `meta` entry).
const savedTutorial = (page: Page, id: string) =>
  page.evaluate(
    (id) =>
      new Promise<{ state: string; store: string }>((resolve, reject) => {
        const open = indexedDB.open("PlaygroundProjects");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const get = database
            .transaction("projects")
            .objectStore("projects")
            .get(`tutorial:${id}`);
          get.onsuccess = () => {
            database.close();
            if (!get.result) {
              reject(new Error(`No saved tutorial "${id}".`));
              return;
            }
            resolve({ state: get.result.state, store: get.result.store });
          };
        };
      }),
    id,
  );

// How long the client waits for the prover and for the node's submit before
// giving up (local, testnet, 2026-11-11: about 10.0 s and 10.2 s).
const PROVER_DEADLINE_MS = 10_000;
const SUBMIT_DEADLINE_MS = 10_200;

// A deploy that succeeds after the user left the example must not write into
// the next workspace either: the Miden client is the same instance across a
// switch, so a transaction submitted after the next store was imported could
// land in that store. The switch takes about 10.4 s, as long as either
// request's deadline, so neither can be held through it alone. Hold C: the
// switch starts when the prover is called, the prover is held for its
// deadline minus 3 s, then the submit is held until the tutorial's `Wallet A`
// row is visible (its store is imported), or for the submit deadline minus
// 3 s, then let through. The test asserts the submit was answered after the
// import, then that nothing of the deploy shows up in the tutorial or in its
// saved store.
test("a deploy that succeeds after leaving its example doesn't reach the next workspace", async ({
  page,
}) => {
  logBrowserErrors(page);
  // The deploy ends by logging "deploy abandoned" (its error, after the
  // switch): waiting on that message, bounded by the 60 s commit wait plus a
  // margin, makes the assertions follow the end of the deploy, not a guess.
  const deployEnded = page
    .waitForEvent("console", {
      predicate: (message) => message.text().includes("deploy abandoned"),
      timeout: 75_000,
    })
    .then(
      () => true,
      () => false,
    );
  let proverFired = () => {};
  const proverStarted = new Promise<void>((resolve) => {
    proverFired = resolve;
  });
  let imported = false;
  let importedBeforeSubmit = false;
  let submitted = false;
  // The prover and the node are called through the page (continue, not fetch:
  // a request replayed from Node is refused by their load balancer).
  await page.route(/prover/, async (route) => {
    proverFired();
    await new Promise((resolve) =>
      setTimeout(resolve, PROVER_DEADLINE_MS - 3_000),
    );
    await route.continue();
  });
  await page.route(SUBMIT_ROUTE, async (route) => {
    submitted = true;
    const until = Date.now() + SUBMIT_DEADLINE_MS - 3_000;
    while (!imported && Date.now() < until) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    importedBeforeSubmit = imported;
    await route.continue();
  });
  const submitAnswer = page
    .waitForResponse((response) => SUBMIT_ROUTE.test(response.url()), {
      timeout: 120_000,
    })
    .then(
      (response) => response.status(),
      () => null,
    );
  await startExample(page);
  await proverStarted;

  await switcher(page).click();
  await page.getByRole("menuitem", { name: "Tutorials" }).click();
  await page.getByRole("menuitem", { name: /^2\. / }).click();
  await expect(switcher(page)).toContainText(tutorial2, { timeout: 60_000 });
  await expect(page.getByRole("row", { name: /Wallet A/ })).toBeVisible({
    timeout: 60_000,
  });
  imported = true;
  expect(await submitAnswer, "the node never answered the submit").toBe(200);
  expect(
    submitted,
    "the deploy never submitted: the timings changed, see the comment above",
  ).toBe(true);
  expect(
    importedBeforeSubmit,
    "the switch outlasted both holds: re-measure, see the comment above",
  ).toBe(true);
  // Observed: applying the answered transaction fails in the new store (its
  // account isn't there), which logs the warning. Whether it appears or the
  // bound passes, the assertions below hold the deploy to what it left.
  await deployEnded;
  // The settle lets the page render whatever the deploy wrote.
  await page.waitForTimeout(5_000);
  await expect(page.getByRole("row", { name: /Counter Contract/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/Counter Contract (deployed|couldn't)/),
  ).toHaveCount(0);

  // Leaving the tutorial saves its snapshot, whose store lists accounts by
  // id (hex, as the app state's accounts do): none may be missing from the
  // state, which the deploy's account would be.
  await switcher(page).click();
  await page.getByRole("menuitem", { name: "New Testnet sandbox" }).click();
  await expect(switcher(page)).toContainText("Testnet sandbox", {
    timeout: TRANSACTION_TIMEOUT,
  });
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  const { state, store } = await savedTutorial(
    page,
    "transfer-assets-between-wallets",
  );
  const normalize = (id: string) => id.toLowerCase().replace(/^0x/, "");
  const stateIds = new Set(
    (JSON.parse(state) as { accounts: { id: string }[] }).accounts.map(
      (account) => normalize(account.id),
    ),
  );
  const storeIds = (
    JSON.parse(store) as { latestAccountHeaders: { id: string }[] }
  ).latestAccountHeaders.map((account) => normalize(account.id));
  expect(storeIds.length).toBeGreaterThan(0);
  expect(storeIds.filter((id) => !stateIds.has(id))).toEqual([]);
});
