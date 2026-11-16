# Simulate: foreign calls on the mock chain

Status: **implemented** (2026-11-16), on `feat/simulate-foreign-calls`. A follow-up to `spec/generic-invoke-and-foreign-calls.md` (PR B, #842), which made the Simulate tab refuse an account component's procedure that makes a foreign procedure invocation (FPI). This lifts the refusal: the foreign account is staged on the mock chain from the script's dependency, with storage the user edits.

One PR, in the Playground only. api-compile and the API don't change.

Read `docs/claude/simulation.md`, `read-only-procedures.md`, `script-editor.md` and `phone-layout.md` before starting.

## Why

Today `copy_count` on a Count Reader can't be simulated: the mock client's RPC only serves accounts committed on its chain, and panics on any other (`docs/claude/simulation.md`). The user has to deploy both contracts on testnet to see a foreign call run, and can't choose what the foreign account holds.

An account component reaches another account through a dependency: `#[account(counter_account::CounterContract)]` needs the `counter-account` package at compile time. That package is all it takes to build the foreign account locally.

## Spike result (2026-11-16)

Run in the browser on the dev server, with the embedded `counter-account` and `count-reader` packages and the app's own `createSimulatedAccount` and `procedureCallScript`, SDK 0.17.10:

- **It works.** A counter built with `count_map` = `1:7`, committed on the mock chain, then `copy_count` on a simulated Count Reader with the counter's id: the transaction's storage patch sets `count_reader::count_reader::count` to 7.
- **Committing takes five calls and about 100 ms the first time, 40 ms after**: `executeTransaction(id, new TransactionRequestBuilder().build())` (an empty transaction: No Auth bumps a new account's nonce), `proveTransaction` (the mock client proves with a dummy proof, 3–6 ms), `submitProvenTransaction`, `applyTransaction`, then `proveBlock()` and `syncState()`.
- **No declaration needed**, as on a real network: the lazy fetch finds the account through the mock RPC. Declaring it with `ForeignAccount.public` gives the same result.
- **`executeProgram` works too** (the path of a read-only procedure, and of a state-changing one's return value).
- **Several foreign accounts coexist.** A second counter staged with 42 reads 42, and the first still reads 7 afterwards: an edit of the foreign storage is a new account in a later block, and older ones stay usable.
- **The caller can be built before the foreign account is staged**: the Count Reader was created first and ran after two syncs. The other order wasn't run (step 13).

## Decisions

- **Which accounts are staged**: one per dependency of the script whose type is `account-component` and whose compiled package the workspace can find (see "Resolving a dependency"). Not only when `callsForeign` is `true`: a procedure api-compile couldn't classify (`null`) benefits too.
- **What a staged account is**: what a simulated account already is (basic wallet, No Auth, the component), from `createSimulatedAccount`, plus the commit.
- **Its storage** is edited in the Simulate tab, under the script's own, with the same editor and the same rules (the package's schema when there is one).
- **The argument**: the staged account is offered in the `AccountId` argument's dropdown, in a "Simulated" group. The user picks it; nothing is prefilled. Its real id changes with every storage edit, so the form holds a stand-in resolved at run time.
- **A sandbox account is still out of reach** of the mock chain. Picking one for a foreign call crashes the mock client, which PR B's reset already catches and explains.
- **Only one level.** A staged account whose own procedure makes a foreign call isn't given its dependencies.

## Resolving a dependency

A script's `dependencies` hold `{ id, name, type, commitment }`. `commitment` is the dependency's package as the script was compiled against it: the foreign procedure roots baked into the caller are that package's.

A dependency resolves to a package when, in this order:

1. a workspace script has the same `id`, a `masp`, and the same `commitment`;
2. a workspace script has the same `commitment` and a `masp` (the example's `counter-account` dependency carries the API's built-in id, not the workspace script's: see the Add Dependency fix in #842);
3. a package the web app embeds has the same `commitment`: `lib/tutorials/counter-account.ts` (the API's built-in `counter-account` dependency has that commitment) and `lib/tutorials/basic-wallet.ts`. Load them with a dynamic `import()`: their `masp` is large and the script page must not carry it.

A workspace script with the same `id` but another `commitment` was recompiled since: staging it would give the foreign account other procedure roots than the caller calls. It doesn't resolve, and the tab says to recompile this script.

## Steps

### Pure helpers (`apps/web/lib/simulation/foreign-accounts.ts`, no SDK import)

1. `foreignDependencies(script, scripts, embedded)`: for each `account-component` dependency, `{ dependency, script }` when it resolves, or `{ dependency, reason: "stale" | "missing" }`. `embedded` is the list of embedded packages, passed in so the tests run on plain node.
2. `SIMULATED_PREFIX` and `simulatedAccountValue(name)` / `simulatedAccountName(value)`: the stand-in an `AccountId` argument holds for a staged account (`simulated:counter-account`).
3. `lib/simulation/blocked.ts`: `simulationBlockedReason(procedureExport, { staged })`. `callsForeign === true` blocks only when no dependency resolved, with a reason that says which case it is: no account component among the dependencies, or one that must be recompiled. Update `blocked.test.ts`.
4. Unit tests for 1 and 2: each resolution rule, the stale case, a `library` dependency ignored, the stand-in's round trip.

### Staging (`lib/simulation/run.ts`)

5. `stageForeignAccount({ client, script, storageSlots })`: `createSimulatedAccount`, then the five calls of the spike, in that order. Returns the `Account`. It writes to the mock client's store, which is the point of the mock client; never call it on the app's client.
6. `simulateProcedure`: replace the `callsForeign` guard's condition with a `foreignAccountsStaged` parameter. It still refuses a `callsForeign: true` procedure when nothing is staged: the guard keeps a future caller from crashing the client.

### State and hook

7. `lib/simulation/simulation-state.ts`: the slots are keyed by script id. Key a staged account's by `${scriptId}:foreign:${dependencyName}`, with the same hook.
8. `hooks/use-simulation.ts`:
   - Extract what computes a script's starting slots (schema defaults, else a workspace component's, then `mergeStorageSlots`) so the caller's and each dependency's use the same code.
   - Return `foreignAccounts`: for each resolved dependency, its name, slots, setter and schema; and the unresolved ones with their reason.
   - In `invoke`, inside `withSimulationClient` and before the caller's account: stage each resolved dependency through the existing `simulatedAccount` cache, keyed by `foreign:${commitment}:${JSON.stringify(slots)}`. The cache is per client, so a client reset re-stages on the next run.
   - Replace each stand-in among the arguments with the staged account's id before `encodeProcedureArguments`.
   - Staging happens at Invoke, never on a slot edit: each staging adds an account and a block to the mock chain.

### UI

9. `components/transactions/select-account-dropdown-menu.tsx`: an optional `simulatedAccounts?: { value: string; name: string }[]`, shown as a "Simulated" group above the sandbox's accounts, and as the trigger's label when selected.
10. `components/procedures/procedure-arguments-form.tsx` and `procedures-list.tsx`: pass `simulatedAccounts` through to the `AccountId` fields. Both stay unaware of what runs a procedure. The account page's dialog passes nothing.
11. `components/script/simulate/simulate-panel.tsx`:
    - Under "Storage", a "Foreign accounts" block, shown when the script has an `account-component` dependency: per resolved dependency its name and a `StorageSlotsEditor` (`allowSlotEdits` without a schema, the schema's descriptions with one); per unresolved one, a line with the reason.
    - The intro sentence gains: procedures that call another account run against the simulated accounts below.
    - Invoke is disabled while any staged account's slots are invalid (`storageSlotsValid`), as for the script's own.
    - Pass the new `blockedReason` and `simulatedAccounts`.
    - "Apply to storage" is unchanged: a foreign call can't change the foreign account.
12. Phone layout: the block is in the left column, which stacks below `xl`. Check 320 px (see Checks).

### Checks to make while implementing

13. Stage the foreign account first, then create the caller and run: the spike ran the other order only.
14. Stage 50 accounts in a row (a slot edit and an Invoke, scripted) and watch the run time: `MockRpcApi` keeps a snapshot of the chain per block (`historical_chains`). If runs slow down, discard the mock client after N stagings (`discardClient` is there) and say so in `simulation.md`.
15. After a crash (a sandbox account picked for the foreign call), the next run with the simulated account works: the client was reset, and staging runs again.

### E2E (`e2e/script-simulate.spec.ts`)

16. Replace the step "a procedure that makes a foreign call is refused" with one that runs it: create the Count Reader example, compile, open Simulate. The "Foreign accounts" block shows `counter-account` with its `count_map` slot. Set the entry of key 1 to 7, pick the simulated `counter-account` as `copy_count`'s argument, Invoke: the result dialog shows `count_reader::count_reader::count` at 7. Change the entry to 42 and Invoke again: 42.
17. Keep the Add Dependency assertions of that step: they cover #842's fix.
18. The crash step no longer needs to strip `callsForeign` from the compile response: pick the imported "Other Counter" for the argument and Invoke. Then pick the simulated account and Invoke: it works (step 15).
19. A stale dependency is hard to reach in e2e with a built-in dependency: cover it in the unit tests, and by hand with two workspace scripts.

### Docs

20. `docs/claude/simulation.md`: rewrite the FPI bullet. A foreign call runs against an account staged from the dependency's package; how a dependency resolves; the commit sequence and why it's needed; staging at Invoke only; a sandbox account still crashes the client, and the reset stays.
21. `docs/claude/read-only-procedures.md`: `callsForeign: true` now blocks the Simulate tab only when no dependency resolves.
22. `spec/editor-console-improvements.md`: the open item "Foreign accounts and advice map inputs in simulations" is half done; say which half.
23. `spec/generic-invoke-and-foreign-calls.md`: its status line still says PR B is "implemented, not yet opened". Set it to deployed (#842, 477e4ad), and strike "Simulating a foreign call" from its out-of-scope list with a pointer here.
24. No tutorial copy changes: no step mentions the refusal, and tutorial 10's `count-reader` script is read-only, so it has no Simulate tab. Grep `apps/web/components/tutorials` for "simulat" to confirm.

## Checks before the PR

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `vite build`: the embedded packages must stay out of the entry and the script page's static graph (dynamic import).
- Web on 3000 and the API on 3001: `e2e/script-simulate.spec.ts`, tutorial 10, `example-counter-contract`, and the `e2e/mobile` projects.
- By hand at 320 px: the Simulate tab of a Count Reader, with the "Foreign accounts" block and the argument's dropdown open.
- By hand: recompile a workspace dependency after its dependent was compiled; the tab asks to recompile the dependent, and does once it is.

## Out of scope

- A sandbox account as the foreign account of a simulation: the mock chain can't take an account from the network.
- Foreign calls two levels deep.
- A private foreign account.
- Note and transaction scripts: they are simulated on the app's client, which reaches the network.
- Prefilling the argument, and parameter names.
- A Simulate tab on read-only scripts.
