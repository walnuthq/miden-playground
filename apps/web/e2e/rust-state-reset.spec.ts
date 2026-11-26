import { expect, type Page, test } from "@playwright/test";
import {
  closeMenu,
  networkBadge,
  openProjectsMenu,
  switcher,
} from "./projects-menu";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

// States persisted before the switch to MASM can hold Rust scripts
// (spec/remove-rust.md, decision 13): loading the app resets them whole,
// without a word (lib/utils/rust-state.ts). The active workspace becomes a new
// sandbox on its network, a saved project or a tutorial's saved progress is
// deleted, and a state without a Rust script is left as it was.

const rustScript = (id: string) => ({
  id,
  name: id,
  type: "account-component",
  status: "compiled",
  readOnly: false,
  files: {
    "src/lib.rs": "#![no_std]",
    "Cargo.toml": `[package]\nname = "${id}"`,
  },
  masp: "",
  commitment: "0x1",
  exports: [],
  dependencies: [],
});

const masmScript = (id: string) => ({
  ...rustScript(id),
  files: {
    [`${id.replaceAll("-", "_")}.masm`]: "pub proc get_count\n  push.0\nend",
    "miden-project.toml": `[package]\nname = "${id}"`,
  },
});

type SeededProject = {
  kind: "project" | "tutorial";
  id: string;
  name: string;
  networkId: string;
  state: object;
  mockChain?: number[];
};

// Writes the persisted app state and saved projects as an earlier version of
// the app left them, then reloads. Done from the app's origin, once it has
// loaded: its own first write is overwritten, and the note that the saved
// projects were already swept is dropped.
const seed = async (
  page: Page,
  { state, projects }: { state: object; projects: SeededProject[] },
) => {
  await page.goto("/");
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  await page.evaluate(
    async ({ state, projects }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("PlaygroundProjects", 2);
        request.onupgradeneeded = () => {
          for (const store of ["projects", "meta"]) {
            if (!request.result.objectStoreNames.contains(store)) {
              request.result.createObjectStore(store);
            }
          }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            ["projects", "meta"],
            "readwrite",
          );
          for (const {
            kind,
            id,
            name,
            networkId,
            state,
            mockChain,
          } of projects) {
            const key = `${kind}:${id}`;
            const meta = { kind, id, name, networkId, savedAt: Date.now() };
            transaction.objectStore("meta").put(meta, key);
            transaction.objectStore("projects").put(
              {
                ...meta,
                version: 1,
                state: JSON.stringify(state),
                store: JSON.stringify({ blockHeaders: [] }),
                ...(mockChain ? { mockChain: new Uint8Array(mockChain) } : {}),
              },
              key,
            );
          }
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      });
      localStorage.removeItem("miden-playground:rustProjectsDeleted");
      localStorage.setItem("state", JSON.stringify(state));
    },
    { state, projects },
  );
  await page.reload();
};

const tutorialCard = async (page: Page, title: string) => {
  await page.goto("/");
  const showAll = page.getByRole("button", { name: /Show all \d+ tutorials/ });
  await expect(showAll).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await showAll.click();
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title, { exact: true }) });
};

const progress = (step: number) => ({ step, maxStep: 6, savedAt: 1 });

test("a Rust-era workspace, its saved projects and progress are reset", async ({
  page,
}) => {
  logBrowserErrors(page);
  await seed(page, {
    state: {
      scripts: [rustScript("rust-counter"), masmScript("my-masm")],
      accounts: [],
      transactions: [],
      inputNotes: [],
      projectId: "old",
      projectName: "Rust workspace",
      completedTutorials: ["create-and-fund-wallet"],
      tutorialProgress: {
        "transfer-assets-between-wallets": progress(2),
        "private-transfers": progress(1),
      },
    },
    projects: [
      {
        kind: "project",
        id: "rust-project",
        name: "Rust project",
        networkId: "mmck",
        state: { scripts: [rustScript("bank")] },
        mockChain: [1, 2, 3],
      },
      {
        kind: "project",
        id: "masm-project",
        name: "MASM project",
        networkId: "mtst",
        state: { scripts: [masmScript("my-masm")] },
      },
      {
        kind: "tutorial",
        id: "transfer-assets-between-wallets",
        name: "transfer-assets-between-wallets",
        networkId: "mtst",
        state: {
          scripts: [rustScript("tutorial-rust")],
          tutorialId: "transfer-assets-between-wallets",
        },
      },
      {
        kind: "tutorial",
        id: "private-transfers",
        name: "private-transfers",
        networkId: "mtst",
        state: { scripts: [], tutorialId: "private-transfers" },
      },
    ],
  });

  await test.step("the workspace is a new Testnet sandbox", async () => {
    await page.goto("/accounts");
    await expect(page.getByRole("row", { name: /USDCx Faucet/ })).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(switcher(page)).toContainText("Testnet sandbox");
    // Saved once the new sandbox's store is in.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("state") ?? ""))
      .not.toContain("rust-counter");
    // The scripts page lists the user's scripts only: none now.
    await page.goto("/scripts");
    await expect(
      page.getByRole("button", { name: "Create new script" }),
    ).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
    for (const name of ["rust-counter", "my-masm"]) {
      await expect(page.getByRole("cell", { name, exact: true })).toHaveCount(
        0,
      );
    }
  });

  await test.step("the Rust project is gone, the MASM one listed", async () => {
    const menu = await openProjectsMenu(page);
    await expect(
      menu.getByRole("menuitem", { name: /MASM project/ }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: /Rust project/ }),
    ).toHaveCount(0);
    await closeMenu(page);
  });

  await test.step("tutorials keep what wasn't Rust", async () => {
    await expect(
      (await tutorialCard(page, "Create and fund a wallet")).getByText(
        "Completed",
      ),
    ).toBeVisible();
    // Its saved progress held a Rust script: it starts over.
    const card2 = await tutorialCard(page, "Transfer assets between wallets");
    await expect(
      card2.getByRole("button", { name: "Start tutorial" }),
    ).toBeVisible();
    const card4 = await tutorialCard(page, "Private transfers");
    await expect(
      card4.getByRole("button", { name: "Resume tutorial" }),
    ).toBeVisible();
  });

  // Nothing tells the user.
  await expect(page.getByText(/couldn't be (opened|restored)/)).toHaveCount(0);
});

test("a state without a Rust script is left alone", async ({ page }) => {
  logBrowserErrors(page);
  await seed(page, {
    state: {
      scripts: [masmScript("my-masm")],
      accounts: [],
      projectId: "kept",
      projectName: "Kept workspace",
    },
    projects: [],
  });
  await expect(switcher(page)).toContainText("Kept workspace", {
    timeout: TRANSACTION_TIMEOUT,
  });
  await page.goto("/scripts");
  await expect(
    // Its name and its package's, in two cells.
    page.getByRole("cell", { name: "my-masm", exact: true }).first(),
  ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  await expect(switcher(page)).toContainText("Kept workspace");
});
