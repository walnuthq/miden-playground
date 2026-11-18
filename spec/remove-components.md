# Remove the Components feature

Status: decisions confirmed by the user (2026-11-18). PR A merged (#855, 2026-11-18). PR B implemented on `feat/remove-components` (2026-11-18): unit tests, lint, typecheck and build pass; full local e2e 63 passed, then its 8 failures (one bug: the example auto-deploy looked for the old component id) all pass after the fix; the hand checks below were run 2026-11-18 with Playwright on states built by `main` in persistent profiles, and all pass (see "Hand checks before merging"). Written for the agent that implements it.

PR B's deviations from the plan below: the helpers live in `lib/utils/account-components.ts`, not `script.ts` (the built-in scripts import `script.ts`, so it can't import them back); `componentStorageSlots` there applies the prefix match to any script without a schema; the built-in `auth-no-auth` and `basic-wallet` scripts carry an empty schema (`slots: []`), so "absent" keeps meaning "unknown"; the unit tests' loader (`test/alias.ts`) gives modules an empty `import.meta.env`, so `stateDeserializer` is tested directly.

## Goal

Delete the Components pages (`/components`, `/components/:id`), the `Component` entity and `State.components`. An account component is then just a compiled script of type `account-component` or `authentication-component`, and its storage layout comes from the package's storage schema (`Script.metadata.storage`, `docs/claude/simulation.md`), not from slots the user types.

Read first: `docs/claude/simulation.md`, `saved-projects.md`, `tutorial-copy.md`, `case-helpers.md`, `examples.md`, `script-templates.md`, `phone-layout.md`.

## Verdict

Doable. The schema already drives the Simulate tab (`schemaStorageSlots`, `mergeStorageSlots`, `lib/utils/storage-schema.ts`), and a `Component` holds nothing else a script lacks, except the six gaps below. Nothing changes in `apps/api`.

## What a Component is used for today

| Use                                                                | Where                                                                                                             | Replacement                                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Slots and initial values at deploy                                 | `deploy-account-dialog.tsx`, `clientDeployAccount`, `wasmAccountComponent`                                        | The script's schema, edited in the dialog                                  |
| Which slots an account's Components tab lists per component        | `account-components.tsx`, `account-component-table.tsx`, `storage-slots-table.tsx`                                | The script's schema, else a name-prefix match (gap 3)                      |
| Account → component link (`Account.components: string[]`, ids)     | `use-accounts.ts`, `verifyAccountComponents`, `create-transaction-configure-form.tsx`, tutorial steps             | Script ids                                                                 |
| Simulate tab fallback when a script has no schema                  | `initialStorageSlots` (`lib/simulation/simulated-accounts.ts`), `use-simulation.ts`, `use-dependency-accounts.ts` | Dropped: no schema means slots added by hand, as today without a component |
| Display name ("Counter Contract", "No Auth")                       | Deploy dialog, account page, toasts, tutorial copy                                                                | Gap 5                                                                      |
| Built-in components' slots (single sig, multisig, network, faucet) | `lib/types/default-components`                                                                                    | Gap 1                                                                      |
| Example and tutorial starters                                      | `lib/examples/*/state.ts`, `counterExampleStarter`, `WorkspaceStarter`, tutorial `state.ts` files                 | Scripts only                                                               |

## Gaps to close

1. **Built-in scripts have no schema.** The slots of `auth-single-sig`, `auth-guarded-multisig`, `auth-network-account` and `fungible-faucet` live only in `lib/types/default-components`. Move them to `metadata.storage` on the matching `lib/types/default-scripts` entries (same names, types and defaults; a value default is a hex word, `wordTextToHex("2")` for the single-sig scheme). `canSimulate` looks at `masp`, so this gives the built-ins no console. `withDefaultScripts` refreshes persisted copies.
2. **The embedded `count-reader` package (tutorial 10) has no `metadata`.** Add its `storage` (one value slot, `count_reader::count_reader::count`), copied from a real compile of `apps/api/templates/count-reader.rs` through the local API, and extend `count-reader.test.ts` to pin it. `basic-wallet.json` needs nothing: it has no storage.
3. **Verified packages from api-registry reach the app without their schema.** `account-components.tsx` has a `// TODO` and hardcodes the counter's slot for tutorial 12. The registry already returns `schemas` (`{ storage?, noteStorage? }`, `{}` when it has none) on each package (`apps/api-registry/src/db/schema.ts` in miden-source-code-verification): add it to the `Package` type and have `packageToScript` copy it to `metadata`. For a package verified before the registry stored schemas, list the account's slots whose name starts with `<package name with [^A-Za-z0-9_] → _>::` (the compiler's prefix, `storageSlotName`). Then delete the tutorial-12 branch (PR B). Checked 2026-11-18: the production registry's `verified-accounts` response for the testnet counter carries `schemas` with its `count_map` slot.
4. **Scripts compiled before schemas existed (before 2026-11-13) have none**, in persisted states, saved projects and resumable tutorial snapshots. Tutorials 11 and 12 create the component silently in step 2's `onNext`, so a resumed run past that step relies on it. The migration below turns each legacy component's slots into its script's schema. `metadata.storage` present with `slots: []` means "no storage"; absent means "unknown", and the Deploy dialog then lets slots be added by hand with a hint to recompile.
5. **Display names go away.** A component had its own name; a script has a package name (`counter-account`, `auth-no-auth`). Decided: a small title map for the built-ins ("No Auth", "Single Sig", "Guarded Multisig", "Network Account", "Basic Wallet", "Fungible Faucet"), the script name for everything else. Tutorial copy and e2e locators that say "Counter Contract", "Count Reader" or "Rust Basic Wallet" change to the script names.
6. **Map defaults disappear.** The counter's component seeds `count_map` with `1:0`, shown in the Deploy dialog and merged into the account page's map table (`StorageSlotMapTable`'s `defaultValue`). A schema has no map entries: the map starts empty and the table shows only real entries. Tutorials 9 and 11 tell the user to keep `1:0`. Verify on testnet that a counter deployed with an empty map reads 0 and increments (expected: a missing key reads as the empty word), then reword.

Smaller ones: several components per script with different defaults can't be expressed any more; old `/components` links need a redirect; a rollback after release drops custom components from states written by the new code.

## Decisions (confirmed by the user, 2026-11-18)

- Gaps: all six are closed as described above.
- Tutorial 7 (`deploy-a-counter-contract`): steps 3 ("Create an account component") and 4 ("Add the counter storage slot") are replaced by one explanatory step on the storage layout, so the tutorial has 6 steps.
- Display names: friendly titles for the built-ins only, the script name for everything else (gap 5).
- Two PRs, A then B.

## PR A: complete the schema sources (no visible change)

Done (2026-11-18). The built-ins' schemas live in `lib/types/default-scripts/storage-schemas.ts`, tested against `default-components` by `storage-schemas.test.ts`; `count-reader.ts` carries its `metadata` (pinned in `count-reader.test.ts`); `Package.schemas` reaches `Script.metadata` through `packageToScript`. `docs/claude/simulation.md` names both sources. The prefix match for packages without `schemas` belongs to PR B, with the account page it serves.

- Gap 1: `metadata.storage` on the four built-in scripts. Add a unit test asserting each equals the slots of its `default-components` entry (deleted with them in PR B).
- Gap 2: `count-reader` metadata and its test.
- Gap 3: `Package.schemas`, `packageToScript` → `metadata`.
- `pnpm test`, `pnpm lint`, typecheck. Nothing to see in the UI.

## PR B: switch to scripts, then delete

### Data model

- `Account.components` keeps its name and now holds script ids. Built-in ids are already equal (`auth-no-auth`, `basic-wallet`…). Say so in a comment on the type.
- Move `StorageSlot`, `StorageSlotType`, `storageSlotTypes` to `lib/types/storage-slot.ts`, and `storageSlotName`, `stringToKeyValues`, `keyValuesToString` (with `component.test.ts`) into `lib/utils/storage-slots.ts`. Relative imports only: plain node runs their tests. Update `case-helpers.md`.
- Delete `lib/types/component.ts`, `lib/types/default-components`, `lib/utils/component.ts`, `hooks/use-components.ts`, `reducer/component.ts` and its test, `components/component`, `components/components`, `pages/component.tsx`, `pages/components.tsx`, and from `State`: `components`, `createComponentDialogOpen`, `upsertStorageSlotDialog*`. Remove `components` from `PERSISTED_KEYS`, `stateSerializer` and `WorkspaceStarter`.
- Add helpers in `lib/utils/script.ts` (no SDK import): `isBuiltInScript`, `componentTitle(script)` (gap 5), `deployableAccountComponents(scripts)` (`account-component`, compiled, with a `masp`, not built-in) and `authComponents(scripts)` (built-in auth scripts plus the user's compiled `authentication-component` scripts).

### Migration (`stateDeserializer`, `lib/utils/state.ts`)

Saved projects and tutorial snapshots load through it too. It runs when the parsed JSON has a `components` key, and only then (the new serializer never writes one):

1. Map each legacy component id to its `scriptId`; rewrite every `accounts[].components` entry through the map, leaving unknown ids alone.
2. For each non-built-in legacy component whose script exists and has no `metadata.storage`, set `metadata.storage` from its slots: `{ name, type: "value", valueType: "word", defaultValue }` (the value through `wordTextToHex`, omitted when zero) or `{ name, type: "map", keyType: "word", valueType: "word" }`. First component per script wins. The next compile replaces it with the real schema.
3. Shift tutorial 7's step indexes for its 6 steps (0-based: an index ≥ 3 becomes index − 1, so both old steps land on the new one): `tutorialStep` and `tutorialMaxStep` when `tutorialId` is `deploy-a-counter-contract`, and `tutorialProgress["deploy-a-counter-contract"]`.

Unit-test it with: a custom component (`<kebab-name>_<uuid>` id), an example state (component id `counter-account`, script id an API UUID), a retired `counter-contract` copy, a state with no `components` key (unchanged), and running it twice.

### Deploy

- `deployAccount` and `clientDeployAccount` take `{ scriptId, storageSlots }[]` plus the scripts; the auth/account split reads `script.type`. Keep the `auth-no-auth` and `auth-network-account` special cases and the `verify` flag. The new account's `components` are `["basic-wallet", ...script ids]`.
- `deploy-account-dialog.tsx`: the selects list `authComponents` and `deployableAccountComponents`. Selecting a script sets the slots to `schemaStorageSlots(schema)`; edit them with `StorageSlotsEditor` (`components/procedures`), with `storageSlotDescriptions`, and `allowSlotEdits` plus a "recompile to list its storage slots" hint when the script has no schema. Same editor for the auth script's slots, except Network Account's two script pickers, which stay. Deploy is disabled while `!storageSlotsValid`. Check the dialog at 320 px.
- `create-account-dropdown-menu.tsx`: "Deploy account" is enabled when `deployableAccountComponents` isn't empty.
- Other callers: `use-examples.ts` (`loadExample` finds the script whose name is the example id; give each example the account name it deploys today, "Counter Contract" and "Bank Account", in `lib/examples`), `timelock-p2id-note/step3.tsx`, `contract-verification/import-button.tsx`. Grep `deployAccount(` for the rest.

### Account page and other readers

- `verifyAccountComponents` returns the ids of the matching scripts, deduplicated by `commitment` (the workspace's counter and an embedded copy share one). An imported account now lists a workspace package without a component having been made for it.
- `account-components.tsx`: resolve `account.components` to scripts; add the verified registry scripts whose commitment isn't there yet. Slots per component: the schema's, else the prefix match of gap 3, else none. `StorageSlotsTable` takes `{ name, type }[]` and loses `defaultValue`. `AccountComponentTable`, `ProceduresTable` and `canInvokeProcedure` take the script alone (`script.type`).
- `create-transaction-configure-form.tsx`: the custom transaction's account script is the first non-built-in id in `executingAccount.components`.
- `initialStorageSlots` loses its `components` argument, and `use-simulation.ts` / `use-dependency-accounts.ts` their `useComponents`.
- Shell: remove the Components section from `app-sidebar-view.tsx` and the breadcrumb entries from `header-view.tsx`; in `routes.tsx` redirect `/components` and `/components/:id` to `/scripts` without importing the SDK (`phone-layout.md`).
- Examples and starters: drop `components` from `lib/examples/*/state.ts`, `counterExampleStarter`, `use-app-state.ts`, `use-tutorials.ts`, every tutorial `state.ts`, and `counterAccountComponent` / `basicWalletComponent`.
- Grep `lib/analytics-events.ts` for component events.

### Tutorials (`apps/web/components/tutorials`)

No test catches stale copy: reread each touched step.

- 7 `deploy-a-counter-contract`: replace steps 3 and 4 with one step, "Meet the contract's storage layout": no action required, like the other explanatory steps. It keeps step 4's explanation of the two parts of a component and of the slot name `<package>::<trait>::<field>` (with the name computed by `storageSlotName` from the user's script, as today), says the compiler derives the layout from `#[component_storage]`, and points to the script's Simulate tab, where the slot is listed. Renumber the later step files and `index.ts`, set `stepCount: 6` in `meta.ts`; `use-counter.ts` finds the account by script id; step 5 no longer says "the one you created in the previous steps" or "keep the value you set".
- 11 `your-first-smart-contract-and-custom-note` and 12 `contract-verification`: remove `newComponent` from step 2's `onNext`; steps 3, 5, 7 find the counter by script id; reword "Counter Contract account component" and `1:0`.
- 9 `network-transactions`: `use-network-counter.ts` and `missing-scripts-alert.tsx` rely on the script only; step 2's `1:0`.
- 10 `foreign-procedure-invocation`: `state.ts` loses its components; steps keep `components.includes("count-reader")` / `"counter-account"` (those are the script ids); names in copy.
- 6 and 8: state and names ("Rust Basic Wallet").
- Tutorial 12 step 7 and the account page's wording for verified components: check against the new slot listing.

### Tests

- Unit: migration, the helpers, `storage-slots` (moved tests), `count-reader.test.ts`, `counter-account.test.ts` (drop the component).
- E2E to update: `tutorial-7-…` (steps 3–4), `tutorial-9/10/11/12-…`, `tutorial-6-…`, `example-counter-contract`, `example-miden-bank`, `example.ts`, `mainnet-network-counter`, `retired-built-ins.spec.ts` (drop the components page step, keep the scripts one), `mobile/mobile-sandbox.spec.ts` (nav list), `script-simulate.spec.ts`, `workspace-switch.spec.ts`, `e2e/README.md`. Add one spec that seeds a pre-migration state in local storage (a custom component, an account deployed with it, a script without `metadata`) and checks the account's Components tab still lists the component with its slot, and Deploy offers it.
- Run the full local suite with the API on 3001 (`env -u DATABASE_URL pnpm dev`), under `caffeinate -dims`, without editing `apps/web` meanwhile, then the `e2e/mobile` projects. `pnpm build` (the shell guard). `pnpm templates:check` isn't affected.

### Docs

`docs/claude/simulation.md` (the "workspace component" fallback), `saved-projects.md` (built-in component copies, `retiredComponentIds`), `tutorial-copy.md` (`starter` appends scripts only), `case-helpers.md` (file paths), `mainnet-sandbox.md` (the starter's component), `examples.md` (`counterAccountComponent`), root `CLAUDE.md` if a path it names moved. Run `biome check --write` on them.

## Hand checks before merging

- A sandbox saved before the change, with a custom component and a deployed account: opens, lists the component and its slots, invokes a procedure, deploys a second account.
- A tutorial 11 run saved at step 5 before the change: resumes and deploys a working counter.
- A tutorial 7 run saved at each old step resumes on the matching new step.
- A fresh counter with an empty `count_map`: `get_count` gives 0, increment gives 1, the map table then shows the entry.
- An account verified through the registry (tutorial 12 steps 6–7) lists its slot, with and without `schemas` in the response.
- Deploy dialog and account Components tab at 320 px.

Results (2026-11-18): all pass. The old sandbox opens live and as a saved project reopened from another sandbox, lists `legacy-counter` with its slot, reads 0 from the old `1:0` entry, increments to 1, and deploys a second account that reads 0. Tutorial 11 left at step 5 resumes at step 5, deploys, reads 0 and increments to 1. Tutorial 7 left at old steps 3, 4, 5 and 6 resumes at new steps 3, 3, 4 and 5; at step 5 the old counter is found by its script. Tutorial 12 step 7 lists the verified slot with `schemas` and, with `schemas` stripped from the registry response, through the prefix. At 320 px neither page overflows; the slots table, as before, scrolls its Type and Value columns within its own container.

## Out of scope

- A Storage table on the script page's Manifest tab, or a Deploy button there.
- Deploying an account with several custom components.
- Typed slot inputs from the schema's `valueType` / `keyType`.
