# Simulate: assets as part of the simulated state

Status: **implemented** (2026-11-17) on `feat/simulate-assets`, not merged. The spike's findings are under "Spike results"; they changed the seeding (no block, no submit) and left foreign vaults to a follow-up. A follow-up to `spec/simulate-foreign-calls.md` (#844) and `spec/simulate-throwaway-target.md` (#845, #846), which left "assets already in the simulated account's vault before a run" out of scope.

One PR, in the Playground only. api-compile and the API don't change.

Read `docs/claude/simulation.md`, `script-editor.md`, `phone-layout.md` and `ui-components.md` before starting.

## The requirement

Assets are first-class in simulations, on both accounts the Simulate tab builds:

- the **throwaway account** an account component's procedures run on;
- the **simulated account** a note or transaction script targets.

Today both start with an empty vault, always. The only asset a simulation knows is the one a note carries (one "Simulated asset", #845). So nothing that spends can be tried: a wallet's `move_asset_to_note`, a bank's `withdraw`, a swap, a transaction script that sends, a procedure that reads a balance.

First-class means: the vault is edited next to the storage, starts every run from what is shown, is changed by "Apply", and its assets can be named wherever a simulation takes an asset or a faucet.

## What the SDK allows

- `AccountBuilder` (SDK 0.17.10) has no way to build an account with assets. A vault is filled by consuming a note.
- A note's asset doesn't have to be minted: #845's spike consumed a P2ID carrying 100 of a faucet made with `client.newFaucet`, never committed, with no mint transaction.
- An unauthenticated note is consumed by an account at nonce 0 that the chain never saw.
- `Note.createP2IDNote(sender, target, assets, noteType, attachment)` builds the standard P2ID, which the standard basic wallet consumes. Every simulated account has that wallet.
- `stageForeignAccount` (`lib/simulation/run.ts`) already commits an account's first transaction on the mock chain in about 100 ms the first time and 40 ms after.

So a vault is seeded with **one transaction that consumes one unauthenticated P2ID note carrying the assets**, applied to the mock client's store before the run. The account is then at nonce 1 with the assets, and everything that runs on it sees them: a transaction, and a program too (read-only procedures and return values run through `executeProgram`, which takes no input notes, so the seed can't ride along in the run's own transaction).

## Spike first (stop and report if a case fails)

In the browser on the dev server, as the previous spikes did: a throwaway module under `apps/web/lib/simulation` and a throwaway spec that imports it with `page.evaluate`, both deleted afterwards. Check for a dev server that's already running before starting one, and for another agent's uncommitted work in the tree.

1. **Seed.** A simulated account (basic wallet, No Auth, the counter). A faucet from `newFaucet`, uncommitted. A P2ID of 1 000 from that faucet to the account, as an unauthenticated input of a transaction, then `proveTransaction`, `submitProvenTransaction`, `applyTransaction`. Expected: `client.getAccount` shows 1 000 in the vault, nonce 1.
2. **Is a block needed?** Run the next transaction on the account right after `applyTransaction`, then again after `proveBlock()` and `syncState()`. If it works without the block, skip the block: it's the part that grows the mock chain (`STAGINGS_PER_CLIENT`).
3. **A transaction that spends.** The standard wallet's `move_asset_to_note` path: a transaction script, or the SDK's send request, moving 400 to an output note. Expected: the vault patch ends at 600, one output note with 400.
4. **A program that reads.** `executeProgram` of a procedure reading the balance (`active_account::get_balance`, in MASM through the code builder): 1 000.
5. **Several faucets in one note**: a P2ID with two fungible assets seeds both.
6. **Seed and storage together**: the id of an account depends on its storage, not on its vault. Confirm the account's id is the same before and after the seed.
7. **A note on a seeded target**: the increment note, and a P2ID carrying a second asset, on the seeded simulated account.
8. **A foreign account with a vault**: stage a seeded account as #844 does, and read its balance through a foreign call if a procedure for it is quick to write; otherwise leave it and say so.
9. Time each of 1, 3 and 4.

## Spike results (2026-11-17)

- 1 ✓: the account holds 1 000, nonce 1. 3 ✓ (600 left, one note, 12 ms). 5 ✓. 6 ✓ (same id). 7 ✓ for a P2ID carrying a second asset; the increment note on a seeded target is covered by the e2e (it fails the asset-conservation check, as without a seed).
- 2: neither with nor without a block, as planned. `proveBlock` panics on the seed (`unauthenticated note … was not created in the same block and no inclusion proof to authenticate it was provided`, miden-client 0.17.5 `test_utils/mock.rs:287`), and a seed submitted without a block poisons the next block, a foreign staging's. So the seed is executed and **applied to the store only** (`applyTransaction` at `getSyncHeight()`), never proven nor submitted: the account is at nonce 1 with the assets for every later transaction and program, and later blocks don't see it. About 80 ms the first time, 20 ms after. Minting the note from the faucet in the same block works too (171 ms, one block per seed), but isn't needed.
- 4: a program runs on a seeded account. A transaction script can't call `active_account::get_asset` itself (`push_procedure_index`: the caller must be an account procedure); a component's procedure reads the balance (e2e, `balance` in `script-simulate.spec.ts`).
- 8: not cheap. A staged account must be committed, and a store-only seed can't be: only the mint-in-a-block path would do, and no example reads another account's balance. Left as a follow-up.
- Found on the way: the `Asset` argument encoding added 1 to the faucet's suffix; the asset id adds `0x11` (composition fungible, version 1; the SDK's `FungibleAsset.vaultKey()` agrees). Fixed in `encodeProcedureArguments`, which the account page's Invoke dialog shares.
- Spending more than the vault holds fails with code 644413868907058392, `ERR_VAULT_FUNGIBLE_ASSET_AMOUNT_LESS_THAN_AMOUNT_TO_WITHDRAW`: explained by `targetErrorHint`, now used for procedure runs too.

## Decisions

- **Simulated assets, plural.** The tab holds a list of them, per script: a symbol each (`SIM` by default, then whatever the user types: `USDC`, `LP`). Each is issued by its own faucet of the mock client, made with `newFaucet` on first use and cached per client and symbol (`mockFaucet` today, generalized). No decimals: amounts are base units, shown as typed (#846).
- **A vault editor under the storage**, on the throwaway account and on the simulated account: rows of an asset and an amount. Empty by default, so a script that needs no asset behaves as today, without a seed transaction.
- **Every run starts from the vault shown**, as it does from the storage shown. The seeded account is built on the first run after an edit and cached per client by components, slots and vault.
- **A seeded account starts at nonce 1**, an unseeded one at nonce 0 as today. The result dialog shows changes against the seeded state, so the seed never shows as a change. The tab's intro says "at nonce 0" today: reword it.
- **"Apply to storage" becomes "Apply to state"**: it also sets the vault rows to the run's resulting balances.
- **Simulated assets can be named everywhere a simulation takes one**:
  - an `Asset` argument of a procedure (the form's asset dropdown gets a "Simulated" group, as `AccountId` arguments have since #844);
  - an `AccountId` argument or note storage field, for a faucet id;
  - the asset a note carries (today's single "Simulated asset" becomes the list).
    The form holds stand-ins (`simulated:asset:<symbol>`), resolved at run time: a faucet's id is known only once its client made it.
- **A note carries a list of assets**, not one: the same rows as the vault editor. `clientCreateNoteFromScript` takes one faucet and one amount today.
- **Sandbox targets are untouched**: their assets are the real ones, on the app's client. The sandbox's faucets stay hidden on the simulated account (they crash the mock client, #845).
- **Staged foreign accounts get a vault too** only if spike case 8 passes cheaply (confirmed by the owner, 2026-11-16). Otherwise it's a follow-up: no example reads another account's balance today.

## Steps

### Seeding (`lib/simulation/run.ts`)

1. `mockFaucet(client, symbol)`: one faucet per client and symbol (a `WeakMap` of `Map`s). `MOCK_FAUCET_LABEL` becomes a function of the symbol.
2. `seedVault({ client, accountId, assets })`: the P2ID note and the transaction of spike case 1, with the block only if case 2 says so. Call `recordStaging` if it adds a block. It writes to the mock client's store: never call it on the app's client.
3. `createSimulatedAccount` gains `assets`. With none it returns as today. With some it seeds, then returns the account's state **after** the seed (`client.getAccount`, through `wasmAccountToAccount`): that is the baseline a run's changes are shown against.
4. `stageForeignAccount`: if foreign vaults are in, seed before its empty transaction (the seed already bumps the nonce, so the empty transaction may not be needed: check).

### State

5. `lib/simulation/simulation-state.ts`: the vault rows and the list of simulated assets, per script id, in memory like the slots (not in `State`, not saved with projects). Keys: the script's own vault, and `${scriptId}:foreign:${dependencyName}` for the simulated account's, as for slots.
6. Pure helpers in `lib/simulation/simulated-assets.ts` (no SDK import, unit-tested): the stand-in's value and its round trip, validation of a row (a known symbol, an amount that is a whole number within a fungible asset's range), distinct symbols, and `applyVaultChanges(rows, deltas)` for "Apply to state".

### Hooks

7. `hooks/use-simulation.ts` and `hooks/use-target-simulation.ts`: pass the vault to the account's cache key and to `createSimulatedAccount`; resolve asset stand-ins among the arguments, the note storage and the note's assets before encoding; return `faucetLabels` for every simulated asset the run used, so the result dialog names them.
8. The simulated account of a note or transaction script has one vault, not one per dependency: it's one account. Its editor sits once, above the dependencies' storage.

### UI

9. `components/procedures/vault-editor.tsx`: rows of an asset dropdown and an amount, with add and remove, and a small "New asset" control that adds a symbol to the script's list. It knows nothing about what runs a procedure, like the storage slots editor.
10. `components/script/simulate/simulate-panel.tsx`: the editor under "Storage" for the script's own account. Invoke is disabled while a row is invalid.
11. `components/script/simulate/target-simulation.tsx`: the editor in the "Simulated account" block; the note's single asset control becomes the same rows. Switching between the simulated account and a sandbox one clears the note's assets, as today.
12. `components/procedures/procedure-arguments-form.tsx` and the asset dropdown: `simulatedAssets` passed through to `Asset` fields, and to `AccountId` fields as a faucet group. The account page's Invoke dialog passes nothing.
13. `components/script/simulate/simulation-result-dialog.tsx`: the button's label, and `onApply` receiving the vault changes. `TransactionEffects` already shows vault deltas against a baseline and names unknown faucets through `faucetLabels`.
14. The intro sentences of both panels: what the account starts from.
15. Phone layout: the vault editor stacks like the slots editor. Check 320 px.

### E2E (`e2e/script-simulate.spec.ts`)

16. An account component that spends. None of the examples' components moves an asset from a transaction script, so write a small one in the spec, as other steps edit the counter: a procedure that sends an amount of an asset to a note, or use the Miden Bank example's `withdraw` if the spike shows it runs from a procedure call. Seed 1 000, run, the dialog shows −400 and one created note; "Apply to state" leaves 600 in the editor; the next run starts from 600.
17. A read-only procedure sees the seeded balance, if step 16's component has one.
18. A note on the simulated account with a seeded vault and two assets in the note: both land in the vault.
19. An empty vault runs as today: the existing steps pass unchanged, and the first account-component test still reports no extra store.
20. A run that spends more than the vault holds fails with the kernel's message in the log. If it comes as a bare error code, add its explanation to `targetErrorHint` as #846 did for the asset-conservation check (`docs/claude/simulation.md` says how a code maps to its message).
21. `e2e/mobile`: the Simulate tab with a vault row at 320 px.

### Docs

22. `docs/claude/simulation.md`: the vault (how it's seeded and why not through the builder or the run's own transaction, nonce 1, the cache key), simulated assets and their stand-ins, the block question's answer, "Apply to state".
23. `spec/simulate-throwaway-target.md`: strike "Assets already in the simulated account's vault before a run" from its out-of-scope list, with a pointer here.
24. `spec/editor-console-improvements.md`: note it under the Simulate item.
25. Tutorial copy: grep `apps/web/components/tutorials` for "Simulated asset" and "Apply to storage". No step is expected to name them.

## Checks before the PR

- `pnpm lint`, `pnpm typecheck`, unit tests in `apps/web` and `apps/api`.
- `vite build`: nothing from `@miden-sdk/*` reaches the entry's static graph.
- Web on 3000 and the API on 3001: `script-simulate`, `example-counter-contract`, `example-miden-bank`, tutorials 8, 9 and 10, and the `e2e/mobile` projects.
- By hand: after a mock-client crash, a seeded run works again (the faucets and the seed are remade); 50 vault edits in a row don't slow the runs (only if seeding adds a block).

## Out of scope

- Non-fungible assets.
- Decimals on simulated assets.
- A sandbox faucet's asset on a simulated account: the mock chain can't hold an account from the network.
- Seeding a sandbox account: its assets are real.
- Assets in the account page's Invoke dialog beyond what it has today.
