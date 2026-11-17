# Simulate: a throwaway target for note and transaction scripts

Status: **deployed** (2026-11-16, #845, 74fc08f). A follow-up PR made the simulated asset a token without decimals (100 base units showed as 0.0001 SIM), explains the kernel's error when a note doesn't take its asset, and turned the checks listed "by hand" below into e2e steps. A follow-up to `spec/simulate-foreign-calls.md` (#844), and the item "a target built on the fly from an account package" of `spec/editor-console-improvements.md`.

One PR, in the Playground only. api-compile and the API don't change.

Read `docs/claude/simulation.md`, `script-editor.md`, `phone-layout.md` and `ui-components.md` before starting.

## Why

A note or transaction script is simulated against one of the sandbox's accounts, on the app's client. So before the first run, the user has to deploy an account that has the procedures the script calls, through `/accounts`, on a real network. Three consequences:

- A script can't be tried right after it compiles.
- The P2ID template has no target at all: no deployed account carries the Rust basic wallet's `receive-asset` unless it was built with that component (tutorial 8's Test Wallet).
- An account whose key isn't in the Playground can't be a target (`docs/claude/simulation.md`).

The script's `account-component` dependencies are the packages its target must hold: `#[account(counter_account::CounterContract)]` needs `counter-account` at compile time. #844 already resolves those dependencies to packages and edits their storage, to stage foreign accounts. The same pieces build a target.

## Spike result (2026-11-16)

Run in the browser on the dev server, SDK 0.17.10, with the existing `simulateNote` pointed at the mock client, the counter example's `increment-note` and the P2ID template compiled by the local api-compile:

| Case                                                              | Result                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Increment note, target = uncommitted simulated counter at count 5 | Works: `count_map` entry 1 becomes 6 (74 ms)                           |
| Increment note, target committed first                            | Works, same result (29 ms)                                             |
| Increment note on an account without the counter                  | Fails cleanly: "procedure with root digest 0xd5fc… could not be found" |
| P2ID, no asset, note field = the target                           | Works                                                                  |
| P2ID, no asset, note field = another account                      | Fails cleanly, on the note's assertion                                 |
| P2ID, no asset, target without the Rust basic wallet              | Works: `receive_asset` isn't called without an asset                   |
| P2ID, 100 of the mock chain's own fee faucet                      | Works: the vault gains 100                                             |
| P2ID, 100 of a faucet made with `newFaucet`, **not committed**    | Works: the vault gains 100                                             |
| P2ID, 100 of that faucet once committed                           | Works, same result                                                     |
| P2ID, 100 of a faucet the mock chain doesn't know                 | Crashes the mock client; `withSimulationClient` resets it              |

What it settles:

- **The target needs no commit.** An account at nonce 0 that the chain never saw consumes an unauthenticated note. So the target is `createSimulatedAccount` alone, without `stageForeignAccount`'s block.
- **The standard and the Rust basic wallets coexist** in one account: the throwaway (standard basic wallet, No Auth, the Rust `basic-wallet` component) builds and receives the asset.
- **A note's asset makes the client load its faucet as a foreign account.** `fetch_public_account_inputs` (miden-client 0.17.5 `src/transaction/mod.rs`) looks in the client's own store first (`local_account_inputs`), then asks the RPC, which panics on an id the mock chain doesn't hold. So a faucet created in the mock client is enough, uncommitted, and a sandbox faucet can never be used there.
- `client.newFaucet(...)` takes about 240 ms, once per mock client.

Not covered by the spike, checked in the first steps: a transaction script, and a target holding several dependency components.

## Decisions

- **The target dropdown gains a "Simulated account"**, above the sandbox's accounts. The sandbox's accounts stay: they have real state, real assets and real authentication.
- **What the simulated account is**: the standard basic wallet, No Auth, and one component per `account-component` dependency of the script that resolves to a package (`foreignDependencies`, unchanged). With no such dependency it is a bare No Auth wallet, which is what a script that only calls the basic wallet needs.
- **It is always offered**, even when the script's `accountProcedures` name a root none of its components has: P2ID runs without `receive-asset` when it carries no asset. A hint names the missing procedures instead.
- **It is preselected when no sandbox account qualifies** (none in the sandbox, or none with the procedures). Otherwise nothing is preselected, as today.
- **Its storage** is edited under the form, one editor per dependency, with #844's block and state. "Apply to storage" is offered, as for an account component.
- **Runs on the mock client**, like account components. Sandbox-account runs stay on the app's client.
- **Assets**: with the simulated account, the Asset dropdown offers one "Simulated asset", issued by a faucet created in the mock client, and none of the sandbox's faucets (any of them would crash the mock client). With a sandbox account, it lists the sandbox's faucets, as today.
- **Stand-ins**: the simulated account's id changes with every storage edit, and the mock faucet's with every client. The form holds stand-ins (`simulated:target`, `simulated:asset`), resolved at run time, as #844 does for foreign accounts.
- **A dependency is the target's, never a foreign account.** A note or transaction script that itself makes a foreign call isn't served (see Out of scope).

## Steps

### Checks to run first (stop and report if one fails)

1. A transaction script on a simulated target: the counter example's script (`apps/api/templates/counter-script.rs`) through `simulateTransactionScript` on the mock client, target = a simulated counter. Expected: the count goes up by one.
2. A target with two dependency components at once (the counter and the Rust basic wallet): it builds, and both an increment note and a P2ID with an asset run against it. If `AccountBuilder` refuses two components that export the same procedure root, report which, before choosing how to handle it.

### Shared pieces, out of `hooks/use-simulation.ts`

3. Move to `lib/simulation` what both hooks need, without changing behavior: the per-client account cache (`simulatedAccount`), `initialStorageSlots`, `shownStorageSlots`, and the embedded packages loader with its hook.
4. Extract a hook, `useDependencyAccounts(script)`, from `useSimulation`'s resolution block: `{ accounts, unresolved, ready }`, with each account's package, slots, setter and schema. `useSimulation` uses it for its foreign accounts; the target simulation for its components. The slots keep their key (`${scriptId}:foreign:${dependencyName}`): a script is either an account component or a note or transaction script, so one script never uses it for both.
5. Extract `simulate-panel.tsx`'s "Foreign accounts" block into its own component, with its title, the sections' `aria-label` prefix and the two unresolved sentences as props.

### Building the target (`lib/simulation/run.ts`)

6. `createSimulatedAccount` takes a list of components (`{ script, storageSlots }[]`, possibly empty) instead of one, and a name. Its callers pass one. It doesn't record a staging: nothing is added to the chain.
7. `mockFaucet(client)`: `client.newFaucet(AccountStorageMode.public(), false, "Simulated", "SIM", 6, <max supply>, <Falcon>)`, cached per client in a `WeakMap`, so a reset client makes a new one. The auth scheme is the wasm numeric enum, which the package doesn't export (S5 in `spec/upstream-sdk-issues.md`): reach it as `lib/para-client.ts` does. No commit.
8. `simulateNote` and `simulateTransactionScript` already take a client: they run unchanged on the mock client. Their auth hint ("pick a No Auth account") stays right for sandbox targets.

### Pure helpers (`lib/simulation/simulated-target.ts`, no SDK import)

9. `SIMULATED_TARGET` and `SIMULATED_ASSET` stand-in values, on `SIMULATED_PREFIX`.
10. `simulatedTargetMissing(script, components, builtIns)`: the roots of `metadata.accountProcedures` that neither a resolved dependency's `procedureExports` nor the standard basic wallet has, named with `procedureName` (`lib/utils/account-procedures.ts`). Empty when the field isn't a list.
11. Unit tests: the P2ID case (missing `receive_asset` without the Rust wallet, none with it), the counter note, a script with no dependency, `accountProcedures` null.

### Hook (`hooks/use-target-simulation.ts`)

12. `TargetSimulationInputs.noteStorage` becomes a function of `accountIdParts`, so the hook can resolve a stand-in inside a typed account field: `(accountIdParts) => string[]`. The component passes `noteStorageFelts` partially applied, or the raw felts.
13. When `targetAccountId` is the stand-in, the run goes through `withSimulationClient`:
    - build the target through the cache, keyed by each component's commitment and slots;
    - when the asset is the stand-in, `mockFaucet(client)`;
    - resolve the note storage with an `accountIdParts` that maps the target's stand-in to its id;
    - call `simulateNote` or `simulateTransactionScript` with the mock client;
    - return the target as the baseline `account`.
      A `SimulationClientReset` is reported as it is for account components.
14. The console line names "the simulated account" instead of an account's name.
15. A sandbox target is untouched: the app's client, as today.

### UI (`components/script/simulate/target-simulation.tsx`)

16. Target dropdown: pass `simulatedAccounts={[{ value: SIMULATED_TARGET, name: "Simulated account" }]}`. The effect that clears a target the filter rules out must leave the stand-in alone. Preselect it once the filter has settled and no sandbox account qualifies.
17. The intro sentence no longer asks to create or deploy an account. With the simulated account picked: the script runs on a throwaway account holding its dependencies' components, starting from the storage below. With `simulatedTargetMissing` non-empty, add which procedures the simulated account lacks.
18. Under the form, when the simulated account is picked: the extracted block, titled "Simulated account", one editor per dependency, and the unresolved dependencies with their reason (reworded: "…to run this script against it"). The Simulate button is disabled while a slot is invalid or the dependencies aren't resolved yet.
19. Note storage, typed: pass `simulatedAccounts` with the target's stand-in to `ProcedureArgumentsForm` when the simulated account is picked, so an account field can name it. Sandbox accounts stay listed: an id in a note's storage is data, nothing fetches it.
20. Note storage, raw felts: the simulated account's id isn't known before the run. Say so under the list when the simulated account is picked ("a note that names its target needs a package with a storage schema").
21. Asset dropdown: with the simulated account, `simulatedAccounts={[{ value: SIMULATED_ASSET, name: "Simulated asset" }]}` and `accountIds={new Set()}` to hide the sandbox's faucets. Switching between the simulated account and a sandbox one clears the asset and any account field holding a stand-in.
22. Result: `throwaway: true`, and `onApply` on the dialog: `applyStorageChanges` on each dependency's slots. It only touches the slots it is given, so the same changes can be applied to each component's list.
23. `components/lib/transaction-effects.tsx`: check how an asset of a faucet the app doesn't know is shown (the mock faucet isn't in app state). If it shows a bare id, pass the dialog a label for it ("Simulated asset").
24. Phone layout: the storage block stacks under the form. Check 320 px (see Checks).

### E2E (`e2e/script-simulate.spec.ts`, "simulate a note and a transaction script")

25. The increment note on the simulated account: pick it, set `count_map`'s entry 1 to 5, Simulate: the dialog shows 6. Apply to storage: the entry shows 6, and the next run gives 7.
26. The transaction script on the simulated account: the count goes up by one.
27. The step "no account can be the P2ID note's target" changes: the simulated account is preselected. Name it in the note's target field, pick the simulated asset with 100, Simulate: the dialog shows the vault gaining 100. Name another account in the field: the run fails and the log has the assertion.
28. With the simulated account picked, the Asset dropdown lists no sandbox faucet.
29. The existing sandbox-target steps stay, the target filter's included: add an assertion that the simulated account is offered next to the filtered accounts.
30. "nothing was submitted" and "simulated accounts stay out of the network's store" keep passing: extend the second to the note runs.

### Docs

31. `docs/claude/simulation.md`: the bullet on note and transaction scripts gains the simulated account (what it's made of, no commit and why, the mock client, the stand-ins, Apply to storage); a bullet on the mock faucet (why a sandbox faucet crashes the client, created per client, uncommitted); the target-filter bullet says the simulated account is always offered.
32. `spec/editor-console-improvements.md`: "a target built on the fly from an account package" is done, with a pointer here.
33. `spec/simulate-foreign-calls.md`: its status says "implemented, on `feat/simulate-foreign-calls`". Set it to deployed (#844, 959ce8b).
34. Tutorial copy: grep `apps/web/components/tutorials` for the Simulate tab's wording ("Target account", "Deploy or import an account"). No step is expected to mention it.

## Checks before the PR

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `vite build`: the embedded packages stay behind their dynamic import.
- Web on 3000 and the API on 3001: `e2e/script-simulate.spec.ts`, `example-counter-contract`, tutorials 8 and 9 (notes), and the `e2e/mobile` projects.
- By hand at 320 px: a note's Simulate tab with the simulated account picked, its storage block, and both dropdowns open.
- By hand: a sandbox account as target still runs on the app's client with a sandbox faucet's asset, and the mock client isn't created for it (no `mock_client_db` before the first simulated run).
- By hand: after a crash of the mock client (an account component's foreign call to a sandbox account), a note run on the simulated account with the simulated asset works: the target and the faucet are made again.

## Out of scope

- ~~Assets already in the simulated account's vault before a run.~~ Done: `spec/simulate-assets.md` (the seed is applied to the store only, no commit needed).
- Non-fungible assets.
- A note or transaction script that makes a foreign call, on the simulated account: its dependencies all go to the target, and nothing says which one is foreign.
- Naming the simulated account in raw-felt note storage.
- Authentication other than No Auth on the simulated account.
- The same simulated account for the account page or for account components' procedures that take assets.
