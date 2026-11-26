import { expect, test } from "@playwright/test";
import { componentRow, counterWorkspace } from "./example";
import { logBrowserErrors, selectOption } from "./tutorial";

// Components were an entity of their own until they were removed
// (spec/remove-components.md): a state persisted before then has a
// `components` key, accounts that name those components, and scripts compiled
// before the API returned storage schemas. Loading it migrates it once
// (`migrateLegacyComponents`): the account lists the component's script with
// the slots the component had, and Deploy offers the script with them.
// Deploys a counter from the MASM template (one testnet deploy, through
// apps/api; the Counter Contract example stood in until plan 06 of
// spec/remove-rust), then rewrites its persisted state into that shape and
// reloads. A MASM script: the state isn't reset as a Rust one would be.
const SLOT = "counter_account::count_map";
const LEGACY_ID = "my-counter_00000000-0000-4000-8000-000000000000";

test("a state persisted with components migrates to scripts", async ({
  page,
}) => {
  logBrowserErrors(page);
  await counterWorkspace(page);
  const accountUrl = page.url();

  await test.step("seed the pre-migration state", async () => {
    // Saved once the account is in the state.
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            (localStorage.getItem("state") ?? "").includes("Counter Contract"),
          ),
        { timeout: 60_000 },
      )
      .toBe(true);
    // Once per test: the migrated state the app then saves must stay.
    await page.addInitScript(
      ({ slot, legacyId }) => {
        if (sessionStorage.getItem("legacy-seeded")) {
          return;
        }
        const value = localStorage.getItem("state");
        if (!value) {
          return;
        }
        sessionStorage.setItem("legacy-seeded", "1");
        const state = JSON.parse(value) as {
          accounts: { name: string; components: string[] }[];
          scripts: {
            id: string;
            name: string;
            type: string;
            metadata?: unknown;
          }[];
          components?: unknown[];
        };
        const script = state.scripts.find(
          ({ name, type }) =>
            name === "counter-account" && type === "account-component",
        );
        if (!script) {
          return;
        }
        // Compiled before the API returned schemas.
        delete script.metadata;
        const builtIn = (id: string, type: string) => ({
          id,
          name: id,
          type,
          scriptId: id,
          storageSlots: [],
          updatedAt: 0,
        });
        state.components = [
          builtIn("auth-no-auth", "authentication-component"),
          builtIn("basic-wallet", "account-component"),
          {
            id: legacyId,
            name: "My Counter",
            type: "account-component",
            scriptId: script.id,
            storageSlots: [{ name: slot, type: "map", value: "1:0" }],
            updatedAt: 0,
          },
        ];
        for (const account of state.accounts) {
          account.components = account.components.map((id) =>
            id === script.id ? legacyId : id,
          );
        }
        localStorage.setItem("state", JSON.stringify(state));
      },
      { slot: SLOT, legacyId: LEGACY_ID },
    );
    await page.goto(accountUrl);
  });

  await test.step("the account lists the component and its slot", async () => {
    await page.getByRole("tab", { name: "Components" }).click();
    await expect(componentRow(page, SLOT)).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByRole("cell", { name: "counter-account", exact: true }),
    ).toHaveCount(2);
    await expect(componentRow(page, "get_count")).toBeVisible();
    // The migration ran once: the saved state has no components any more.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("state") ?? "{}").components ===
            undefined,
        ),
      )
      .toBe(true);
  });

  await test.step("Deploy offers the script, with the component's slot", async () => {
    await page.goto("/accounts");
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Deploy account" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    await selectOption(page, "Account Component", "counter-account");
    await expect(dialog.getByText(SLOT)).toBeVisible();
    // The migrated schema lists the slot: no slot to add by hand.
    await expect(dialog.getByText(/recompile it/)).toHaveCount(0);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });

  await test.step("old components links land on the scripts page", async () => {
    await page.goto(`/components/${LEGACY_ID}`);
    await expect(page).toHaveURL(/\/scripts$/);
  });
});
