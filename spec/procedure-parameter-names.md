# Procedure parameter names

Status: historical for the Rust parts. Since the switch to MASM (2026-11-26, `spec/remove-rust.md`) api-compile reads the names from the MASM source and spells them as the source does (snake case), `pnpm examples:compile`, the `compiled.json` snapshots and the embedded packages are gone, and the basic wallet is the built-in one, assembled from MASM. **Implemented** (2026-11-17), on `feat/procedure-parameter-names`, not merged. The verification-service half, `spec/procedure-parameters.md` in walnuthq/miden-source-code-verification, is deployed (PR #143, api-compile container v115): production's `POST /compile` returns `parameters` (checked on the counter and bank examples), and every package the registry stores has them (backfill: 545 named, 0 without names). Each entry is `{ name, type }`, both kebab case as the WIT spells them; an export is listed only when it pairs with the manifest's signature by index, and a transaction script has none (`{}`), as it carries no WIT.

One PR, in the Playground only.

Read `docs/claude/read-only-procedures.md`, `simulation.md`, `examples.md`, `script-templates.md`, `tutorial-copy.md`, `saved-projects.md` and `phone-layout.md` before starting.

## Why

The Simulate tab and the account page's Invoke dialog label a procedure's arguments `param_0`, `param_1`, and signature lines show types only: `fn deposit(AccountId, Asset)`. The package manifest's signature has the parameters' types, not their names (`procedureParams`, `apps/web/lib/utils/procedure-inputs.ts`).

The names are in the WIT every compiled package embeds, and api-compile will report them. With them the same procedure reads `fn deposit(depositor: AccountId, deposit_asset: Asset)`, and its fields are labelled `depositor` and `deposit_asset`.

## What api-compile returns

A key next to `readOnly` and `callsForeign` in `POST /compile`, and on a registry package:

```json
"parameters": {
  "::\"miden:bank-account/bank@0.1.0\"::deposit": [
    { "name": "depositor", "type": "account-id" },
    { "name": "deposit-asset", "type": "asset" }
  ],
  "::\"miden:bank-account/bank@0.1.0\"::initialize": []
}
```

- `name` and `type` are the WIT's, in kebab case.
- An export is in the map only when its names were found and there are as many as the signature has parameters.
- No names is one case: an export missing from the map, or the key missing (an older api-compile, a package without the WIT). Never an error.

## Decisions

- **Names show in the argument forms and in the signature lines**, through one helper.
- **Snake case**, as in the Rust source and as procedure names already show (`formatProcedureExportPath`).
- **The fallback is today's `param_N`**, for a whole procedure: never a mix of real and generic names.
- **Types still come from the manifest's signature.** The WIT type is stored but not used: the forms' types (`midenTypes`) and their encoding don't change.
- **No migration.** A script compiled, persisted or saved in a project before the change keeps `param_N` until its next compile, like `readOnly` and `callsForeign` before it.

## Steps

### API (`apps/api`)

1. `lib/utils.ts`: `parameters?` on `CompileResponse`, and each export's list stored with the export, where `readOnly` and `callsForeign` are set. `lib/types.ts`: `parameters?: { name: string; type: string }[]` on `ProcedureExport`, with a comment saying when it's missing. The `exports` column is jsonb: no schema change, no migration.
2. API tests that cover `callsForeign` on a compiled package cover `parameters` too.

### Web types and helpers (`apps/web`)

3. `lib/types/script.ts`: the same field on `ProcedureExport`.
4. `lib/utils/procedure-inputs.ts`, `procedureParams`: take `parameters` with the signature. Name each parameter from it, kebab to snake case. Fall back to `param_${index}` for all of them when the list is missing, its length differs from the signature's, or a name is empty or repeated. `ProcedureArguments` is keyed by name, so names must be unique within a procedure.
5. `lib/utils/script.ts`, `procedureSignature`: `name: Type` for each parameter when the procedure has names, the type alone otherwise. Use the helper of step 4, don't read `parameters` a second way. It feeds `components/procedures/procedures-list.tsx` and `components/script/exports-table.tsx`.
6. `packageToScript` (`lib/utils/script.ts`), for a verified package imported from the registry: copy the package's `parameters` onto each export. The registry package type (`Package`) gains the key; a package from before the registry's backfill has none.
7. Unit tests (`procedure-inputs.test.ts`, and `script`'s): names, the three fallbacks, a signature line with and without names.

### Argument state

8. A recompile that brings names changes the keys of `ProcedureArguments`, so values typed under `param_0` are dropped once. Accepted. Check that nothing persisted holds these keys: `lib/simulation/simulation-state.ts` (in memory) and the Invoke dialog's state. If something saved does, stop and report.

### Snapshots and embedded packages

9. `pnpm examples:compile` (`examples.md`) once production returns the key: both examples' `compiled.json` gain it.
10. The packages the web app embeds, in `apps/web/lib/tutorials`: `counter-account.ts`, `count-reader.ts` and the Rust basic wallet (`basic-wallet.json`, `script-templates.md`). Copy each export's `parameters` in, from a compile of the same sources. Their tests compare the exports with the package (`counter-account.test.ts`, `count-reader.test.ts`): extend them if they can reach the names, otherwise say in `script-templates.md` that the names are copied by hand.
11. Built-ins assembled from MASM (`lib/types/default-scripts`) have no WIT and keep `param_N`.

### Tutorials

Tutorial steps name what the user sees, and no test catches stale copy.

12. `components/tutorials/foreign-procedure-invocation/step5.tsx` names `param_0`: it becomes `counter_account_id` (the parameter of `copy_count` in `apps/api/templates/count-reader.rs`).
13. A tutorial run saved before the change and resumed afterwards still has a script without names, so it still shows `param_0` until the script is recompiled. Read the step in both cases. If it can't read right in both, say which case was chosen and why in the PR.
14. Grep `apps/web/components/tutorials` for `param_`, and for signature lines quoted in copy (`interact-with-the-counter-contract/step3.tsx` shows one; `contract-verification/step2.tsx` reads signatures). A procedure without parameters doesn't change.

### E2E

15. `e2e/tutorial-10-foreign-procedure-invocation.spec.ts` asserts `param_0` twice: both become `counter_account_id`.
16. `e2e/script-simulate.spec.ts`: a named field on the counter or the bank; and a compile response stripped of `parameters` (`page.route`, as `compileWithoutCallsForeign` does for `callsForeign`) falls back to `param_0`.
17. Grep `apps/web/e2e` for labels and signature lines that change (`getByLabel`, `fn `).
18. `e2e/mobile`: a field with a long name (`counter_account_id`) and a signature line with names fit at 320 px.

### Docs

19. `docs/claude/read-only-procedures.md`: `parameters` travels with `readOnly` and `callsForeign` (same storage on each export, same staleness, `pnpm examples:compile` and the embedded packages after api-compile changes it).
20. `docs/claude/simulation.md`: where the forms' names come from, and the keys' one-time change.
21. `spec/editor-console-improvements.md`: a line under the Simulate item. Mark this spec's status.

## Checks before the PR

- `pnpm lint`, `pnpm typecheck`, unit tests in `apps/web` and `apps/api`.
- `vite build` in `apps/web`: nothing from `@miden-sdk/*` reaches the entry's static graph.
- Web on 3000 and the API on 3001 (`env -u DATABASE_URL pnpm dev` in `apps/api`): `script-simulate`, `example-counter-contract`, `example-miden-bank`, tutorials 6, 7, 10 and 12, and the `e2e/mobile` projects.
- By hand: an account imported with its verified source shows names in its Invoke dialog; a script saved in a project before the change shows `param_N`, then names after a recompile.
- Testnet's prover times out now and then ("failed to prove transaction"): rerun before debugging.

## Rules for the implementer

- Check for a dev server already running and for another agent's uncommitted work before starting; start from `main`.
- Never edit `packages/ui/src/components`. Use built-ins, not `lodash`.
- Don't edit `apps/web` while a local Playwright run is going.
- Commit, push and merge only when asked. No Claude attribution in commits or PRs.

## Out of scope

- Note storage fields: already named by their schema.
- Result names and descriptions: not in the WIT.
- Showing or using the WIT type.
- Renaming a parameter in the UI.
