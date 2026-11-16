# Generic Invoke dialog, and foreign calls in simulations

Status: **PR A deployed** (#841, efb61a4, 2026-11-16) and **api-compile deployed** (miden-source-code-verification #142, container v113, 2026-11-16). **PR B deployed** (#842, 477e4ad, 2026-11-16). Step 15 found that a foreign call on the mock client hangs rather than fails: the panic never settles the run, and every later simulation queues behind it until a reload. PR B therefore also resets the mock client on a worker crash or a 60 s timeout (`docs/claude/simulation.md`), and fixes the Add Dependency dialog, which offered a component whose name was already a dependency (the Count Reader's built-in `counter-account`), breaking the build. Step 9 verified: a read-only `get_remote_count` returned the testnet counter's count (34) with no foreign account declared. The `set_owner` check passed with a private wallet and with a public wallet not yet on chain. A follow-up to item 11 of `spec/editor-console-improvements.md` (the Simulate tab, #831–#836), which built `components/procedures` for the account page's Invoke flow too.

Two PRs here, and one in walnuthq/miden-source-code-verification:

| PR             | What                                                                                          | Depends on           |
| -------------- | --------------------------------------------------------------------------------------------- | -------------------- |
| A (playground) | The account page's Invoke dialog on the reusable components; tutorial 10; the upstream note   | nothing              |
| api-compile    | `callsForeign` per export: `spec/foreign-calls.md` in miden-source-code-verification          | nothing              |
| B (playground) | Store and show `callsForeign`; the Simulate tab refuses a procedure that makes a foreign call | api-compile deployed |

Read `docs/claude/simulation.md`, `read-only-procedures.md`, `tutorial-copy.md` and `phone-layout.md` before PR A, and `examples.md` before PR B.

## Why

The account page's Invoke dialog (`components/account/invoke-procedure-arguments-dialog.tsx`) hardcodes three procedures (`copy_count`, `get_depositor_balance`, `deposit`) to name their parameters, and has its own fields, encoding and result decoding. `components/procedures` and `lib/utils/procedure-inputs.ts` do the same generically.

The dialog also carries the only foreign procedure invocation (FPI) plumbing: the account picked for an `AccountId` argument is passed to the transaction as a public foreign account (`invokeProcedure`'s `foreignAccounts`, `hooks/use-scripts.ts`). That is a guess. It is right for `copy_count`, and wrong for `deposit`, whose depositor isn't a foreign account.

## What the research found (2026-11-16)

- **A public foreign account needs no declaration on SDK 0.17.10.** The executor asks the client's data store for a foreign account when the code reaches it. On a cache miss the store fetches it from the node at the reference block (`get_foreign_account_inputs` → `fetch_and_cache_foreign_account`, miden-client 0.17.5 `src/store/data_store/mod.rs`). Storage map keys are fetched per key the same way, which is why the empty `AccountStorageRequirements` always worked.
- **Verified by a run.** With `foreignAccounts` forced to `[]`, `e2e/tutorial-10-foreign-procedure-invocation.spec.ts` passed: `copy_count` executed, proved and was accepted on testnet.
- **A read-only procedure that makes a foreign call works too.** `executeProgram` builds the same data store. Verified in PR A (step 9): `get_remote_count` returned the testnet counter's count with no foreign account declared.
- **The mock client can't.** Its RPC serves only accounts committed on the mock chain and unwraps the lookup (`committed_account(account_id).unwrap()`, miden-client `test_utils/mock.rs`): a foreign id it doesn't know panics inside the WASM instead of failing the run. So the Simulate tab's throwaway account can't make a foreign call.
- **A private foreign account, or one not yet committed, fails everywhere.** A private one needs `ForeignAccount.private(account)` with state held locally. Out of scope.
- **api-compile can tell that an export makes a foreign call, not which one.** `tx::execute_foreign_procedure` is a protocol procedure the MAST walk already recognises. The foreign procedure's root isn't in the MAST as a constant: the compiler passes it through locals (`codegen/masm/src/lower/fpi.rs`).

## Decisions

- The account page declares no foreign account. An `AccountId` argument is a plain argument.
- Parameter names are lost (`param_0`…). Bringing them back is a later item, not this one.
- The Invoke flow stays a dialog: seven tutorials name the Invoke button and its place, and only the dialog's content changes.
- The Simulate tab refuses to run an account component's procedure that makes a foreign call, and says why. Staging the foreign account on the mock chain is a later item.

## PR A: the Invoke dialog on the reusable components

### Web (`apps/web`)

1. `components/account/invoke-procedure-arguments-dialog.tsx`:
   - Delete `FeltField`, `WordField`, `AccountIdField`, `AssetField`, the commented `FaucetIdField` and `getParamsWithNames`.
   - Params: `procedureParams(procedureExport)`. State: one `ProcedureArguments`, reset on close. Fields: `ProcedureArgumentsForm` with an `idPrefix` such as `invoke-procedure`.
   - Inputs: `encodeProcedureArguments({ params, args, accountIdParts })`, with `accountIdParts` from `lib/web-client.ts`. The encoding is the one the dialog has today, the asset's `suffix + 1` included.
   - The Invoke button is disabled while `!procedureArgumentsReady(params, args)`. A parameter of a type the form doesn't know shows the form's "aren't supported yet" line and keeps the button disabled, where today it sends an empty push.
   - Stop passing `foreignAccounts`.
   - The result of a read-only call: `decodeProcedureResult(procedureExport.signature, word.toU64s())` instead of the two `results.length` cases, so a result that is neither one felt nor a word shows too.
2. `components/account/procedures-table-row.tsx`: the same `decodeProcedureResult` for the no-argument path, so both paths print a result the same way.
3. `hooks/use-scripts.ts`: remove `invokeProcedure`'s `foreignAccounts` parameter and the `withForeignAccounts` block, with the imports only it used (`ForeignAccount`, `AccountStorageRequirements`, `MidenArrays`).
4. Delete what the dialog was the last user of. Check with grep before deleting: `midenRawTypeToMidenType` (`lib/utils/script.ts`), `formValue` (`lib/utils`).
5. The dialog's `DialogContent` keeps `sm:max-w-160`. The form is one column below `sm`: check it at 320 px (see Checks).

### Tutorial 10 (`components/tutorials/foreign-procedure-invocation`)

6. `step5.tsx`:
   - The argument is no longer labelled `counter_account_id`. Say: select the **Counter Contract** account as the procedure's only argument, `param_0`: the `counter_account_id` of the Rust code.
   - "The Counter Contract is passed to the Transaction as a foreign account" is no longer what happens. Say that `copy_count` reaches the Counter Contract through FPI, and that the Playground's client fetches its public state from testnet while it executes the transaction.
   - `step3.tsx`'s last paragraph ("the Playground can fetch its state from the network and provide it to the Transaction") still holds: leave it.
7. `e2e/tutorial-10-foreign-procedure-invocation.spec.ts`, step 5: the dialog still has one "Select account" button, so the locators should hold. Add an assertion that the dialog shows `param_0`, so the copy and the dialog can't drift apart silently.
8. Grep `apps/web/components/tutorials`, `e2e` and `.claude/skills/tutorials-qa` for `counter_account_id`, `depositor` and `Invoke Procedure` once more after the change. `docs/qa/*` are dated reports: leave them.

### A read-only foreign call, by hand

9. In a testnet sandbox, create an account component next to the `counter-account` script, with one procedure that returns the counter's count without writing it (`fn get_remote_count(&self, counter_account_id: AccountId) -> Felt`, calling `CounterAccount::new(id).get_count()` as the Count Reader does). Compile it, deploy it with No Auth, and Invoke it from the Components tab with the Counter Contract.
   - It must show the count, with nothing submitted. Its Manifest tab should show the Read-only badge (`tx::execute_foreign_procedure` is classified read-only; the `get…` name is the fallback).
   - If it fails for want of the foreign account, **stop and report**: the fallback is to pass the public accounts among the `AccountId` arguments to `executeProgram`, which is a decision to take then.

### Docs and the upstream note

10. `docs/claude/simulation.md`: the bullet ending "which still has its own dialog and hardcoded parameter names" becomes: the account page's Invoke dialog uses the same form and encoding.
11. `docs/claude/read-only-procedures.md`: one bullet. The Invoke flow declares no foreign account: the client fetches a public one from the node when the procedure reaches it, for a transaction and for a local run. A private foreign account, or one not committed yet, fails.
12. The `web-client-usage` skill says "Only the accounts you name are fetched". It can't be fixed here: the skill is a symlink into `node_modules/@miden-sdk/miden-sdk/skills` (`docs/claude/skills.md`). Add finding **S14** to `spec/upstream-sdk-issues.md`, under `@miden-sdk/miden-sdk`:
    - Kind: Improvement (docs). Evidence: Read (miden-client 0.17.5 `data_store/mod.rs`) and reproduced (tutorial 10 with no foreign account declared, 2026-11-16).
    - What happens: the skill's "Foreign accounts (FPI)" section, frontend-pitfalls FP13's "second trap", and the doc comments on `withForeignAccounts` say an undeclared foreign account isn't loaded. A public one is, lazily, at the reference block.
    - Ask: document what declaring is still for (a private account's state through `ForeignAccount.private`, storage requirements fetched up front), and that a public account works without it. Say whether the lazy fetch is a contract or an accident, since we now rely on it.
    - Add a row to the summary table only if it ranks with the ones already there: it doesn't cost code.

### Checks before the PR

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Web on 3000 and the API on 3001 (`env -u DATABASE_URL pnpm dev`), then: tutorials 6, 7, 9, 10, 11 and 12, `example-counter-contract`, `example-miden-bank`, and the `e2e/mobile` projects (`mobile-safari`, `mobile-chrome`, `mobile-small`).
- By hand at 320 px: the dialog for `copy_count` (an account) and for the Miden Bank's `deposit` (an account and an asset) doesn't overflow.
- By hand: a state-changing procedure that takes an `AccountId` it only stores or compares, invoked with a **private** wallet, then with a wallet that has no transaction on chain yet. Today the dialog declares that account as a public foreign one, which the SDK should refuse for a private id and fail to fetch for an uncommitted one (read from the docs and the code, not reproduced). The new dialog must run both. The Miden Bank's `deposit` isn't a good subject: called from a transaction script it has no asset to deposit, so it fails for its own reasons. Use a small component with a procedure such as `set_owner(&mut self, owner: AccountId)`, deployed with No Auth.

## PR B: `callsForeign`, and the Simulate tab

The api-compile half is deployed and production `POST /compile` returns `callsForeign`: this PR can start.

### Cross-check before PR B (2026-11-16)

- **Production returns the flag as specified.** A direct `POST /compile` of the `count-reader` template with its `counter-account` dependency answered `callsForeign: { copy-count: true, init: false }` next to `readOnly: { copy-count: false, init: true }`, in 4.3 s.
- **The contract is the planned one**: a map by export path next to `readOnly`, `true` / `false` / `null`, for every package kind, absent on a failed build. `POST /verify` returns it too; the registry doesn't store it.
- **No lockfile drift**: `lockfile:check` against production passes (439 crates), so `templates/project-template/Cargo.lock` needs no sync for this PR.
- **The web app needs no mapping change**: `compiledPackageToScript` and the import path spread each export (`lib/utils/script.ts`), so a stored `callsForeign` reaches `procedureExports` once the API stores it and the type has it.
- **PR A left nothing for PR B to redo.** `invokeProcedure` has no `foreignAccounts`, and the dialog still has the `DialogDescription` step 12 extends. The component PR A used for its manual checks (`get_remote_count`, `set_owner`) lived in a throwaway spec and isn't in the repo.
- **S14** is in `spec/upstream-sdk-issues.md`, which is still untracked by choice.

### The field

api-compile returns `callsForeign` next to `readOnly`: a map from export path to `true`, `false` or `null` (it couldn't tell). The API stores it on each procedure export, as it does `readOnly`. **Only `true` acts.** `false`, `null` and absent (a built-in, a registry package, a package compiled before the field) behave as today.

### API (`apps/api`)

1. `lib/utils.ts`: type `callsForeign: Record<string, boolean | null>` on the build result next to `readOnly` (line 108), and copy `callsForeign[procedureExport.path]` onto each export where `readOnly` is copied (line 228). An older api-compile returns no map: read it with `?.`.
2. `lib/types.ts`: `callsForeign?: boolean | null` on the procedure export, with a comment, next to `readOnly`.
3. A unit test next to the existing one for `readOnly`, if there is one (`grep -rn readOnly apps/api/lib/*.test.ts`).
4. The exports live in a `jsonb` column: **no migration**. Stored packages get the flag at their next compile.

### Examples and embedded packages

5. `pnpm examples:compile` in `apps/api`, against a local api-compile that has the change and matches production's image (`docs/claude/examples.md`). Every procedure export in `compiled.json` gains `callsForeign`.
6. `apps/web/lib/tutorials/counter-account.ts`: `counter-account.test.ts` compares the embedded exports with `compiled.json` field by field (`path`, `digest`, `readOnly`, `attributes`), so it won't notice the new flag. Add `callsForeign` to that comparison and `callsForeign: false` to the two embedded exports.
7. `apps/web/lib/tutorials/count-reader.ts`: set `callsForeign: true` on `copy-count` by hand. Its script is read-only, so it has no Simulate tab today, but the flag should be true wherever the package is.

### Web (`apps/web`)

8. `lib/types/script.ts`: `callsForeign?: boolean | null` on `ProcedureExport`, with a doc comment covering the three values and absence.
9. `components/procedures/procedures-list.tsx`: an optional prop `blockedReason?: (procedureExport: ProcedureExport) => string | undefined`. When it returns a reason, the row's Invoke button is disabled and the reason shows under the procedure's name, in muted text that wraps (it must be readable on a phone, where the Signature column is hidden). The list still knows nothing about what runs a procedure.
10. `components/script/simulate/simulate-panel.tsx`: pass `blockedReason`, returning for `procedureExport.callsForeign === true`: "Calls a procedure of another account, which a simulation can't reach. Deploy the component and invoke it from the account's Components tab."
11. `lib/simulation/run.ts` `simulateProcedure`: return `{ ok: false, error }` with the same sentence when `callsForeign === true`, before touching the mock client. The button is the user's guard; this one keeps a future caller from panicking the WASM.
12. The account page's dialog: when `callsForeign === true`, add a sentence to the `DialogDescription`: the procedure calls another account's procedures, which works when that account is public and on chain.
13. Note and transaction scripts are simulated on the app's client, which reaches the network: don't block them.

### Tests

14. A unit test for the reason helper if it's extracted (plain node, no SDK import), and for `simulateProcedure`'s guard if it can run without the WASM; otherwise the helper alone.
15. Before writing the guard, bypass it once by hand and run a procedure that makes a foreign call on the mock client: record in `docs/claude/simulation.md` what happens (an error, or a panic that leaves the mock client unusable until a reload). A `callsForeign: null` procedure isn't blocked, so this is what a user sees when api-compile couldn't tell. If the client is left unusable, recreate it after a failed run, or say so in the PR.
16. E2E: a Simulate-tab case needs an editable component with a dependency on `counter-account`. If `e2e/script-simulate.spec.ts` can create one cheaply (a component like PR A's step 9 one, which isn't in the repo), add a case: the row shows the reason and its Invoke button is disabled. If it can't, check it by hand and say so in the PR.

### Docs

17. `docs/claude/simulation.md`: a bullet on `callsForeign`, why the mock client can't make a foreign call (the panic), and where the guard is.
18. `docs/claude/read-only-procedures.md`: `callsForeign` travels with `readOnly` (same source, same storage, same staleness), and `pnpm examples:compile` after api-compile changes either.

### Checks before the PR

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, in the API and the web app.
- `e2e/script-simulate.spec.ts`, tutorial 10, `example-counter-contract`, and the `e2e/mobile` projects (the reason text at 320 px).

## Out of scope

- Parameter names in the forms.
- ~~Simulating a foreign call~~: planned and spiked in `spec/simulate-foreign-calls.md`.
- A "Foreign accounts" picker for private foreign accounts (`ForeignAccount.private`).
- Filtering the `AccountId` dropdown to the accounts that have the dependency's procedures.
- A Simulate tab on read-only scripts.
