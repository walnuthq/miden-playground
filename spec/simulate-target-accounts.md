# Simulate: hide target accounts that can't run the script

Status: **planned** (2026-11-13). Not started. A follow-up to item 11 of `spec/editor-console-improvements.md` (the Simulate tab, shipped in #831–#836).

This is the Playground half. It depends on the api-compile half, `spec/account-procedures.md` in walnuthq/miden-source-code-verification. **Don't start until that one is deployed** and production `POST /compile` returns `accountProcedures` for the counter example's note.

Read `docs/claude/simulation.md` (the Simulate tab) and `docs/claude/examples.md` (`compiled.json`) before starting.

## Why

For a note script or a transaction script, the Simulate tab (`components/script/simulate/target-simulation.tsx`) runs the script against a **target account** picked in a `SelectAccountDropdownMenu`. Today that dropdown lists every account in the sandbox. An account without the procedures the script calls (a counter note against a plain wallet) fails with a VM error in the log.

Decision (2026-11-13): **hide** those accounts from the target dropdown rather than flag them.

## How

- api-compile reads the compiled package's MAST and lists the account procedures (MAST roots) that the script `call`s. The API stores the list with the package's `metadata`, as `accountProcedures`.
- The web app checks each account's code with the SDK's `AccountCode.hasProcedure` (the same check `verifyAccountComponents` in `lib/web-client.ts` uses) and lists only the accounts that have every procedure.
- Alternatives we rejected:
  - Filtering on the script's account-component `dependencies` against `Account.components`. A dependency isn't a call, for example P2ID depends on the basic wallet but only calls it when the note carries assets. It also misses accounts whose components the workspace has no `Component` entry for.
  - Parsing the MASM text. Embedded packages carry none (`masp` only), and the text isn't what runs.

## The field

`Script.metadata.accountProcedures`:

- `string[]`: hex MAST roots (`Word.toHex()` format, `0x…`), sorted and deduplicated. `[]` means the script calls no account procedure, so every account can run it.
- `null`: api-compile couldn't tell (a dynamic call is reachable).
- absent: not a note or transaction script, a draft, a built-in, a package compiled before api-compile reported it, or `metadata` itself null.

**Only a `string[]` filters.** `null` and absent behave exactly as today.

## Steps

### API (`apps/api`)

1. `lib/types.ts` `PackageMetadata`: add `accountProcedures?: string[] | null`, with a comment.
2. `lib/utils.ts`, around line 205: destructure `accountProcedures` from the build and pass it to `packageMetadata`.
3. `lib/package-metadata.ts`: keep `accountProcedures` when it's an array (including `[]`). Drop `null`, so it reads as absent. Return a non-null object when any of the three keys is kept. Update the comment.
4. `lib/package-metadata.test.ts`: `[]` is kept, `null` is dropped, an array alone gives a non-null metadata, and all three keys together are kept.
5. The api-compile response type the API reads: find where `noteStorage` is typed on the build result (`grep -rn noteStorage apps/api/lib`) and add the field next to it.
6. `metadata` is a `jsonb` column (`db/schema.ts`), so there is **no migration**. Stored packages keep their old metadata until they're recompiled.

### Examples snapshot

7. Regenerate `apps/api/examples/*/compiled.json` with `pnpm examples:compile` in `apps/api`, with the local API and a local api-compile that includes the change. The local image must match production's (see `docs/claude/examples.md`). Check that the counter example's `increment-note` and transaction script now have `metadata.accountProcedures`.
8. `apps/web/lib/tutorials/counter-account.ts` embeds the `counter-account` package's metadata. That is an account component, so it gets no new key, but run `pnpm test` in `apps/web` anyway: its unit test compares the embedded fields with `compiled.json`.

### Web (`apps/web`)

9. `lib/types/script.ts` `PackageMetadata`: add `accountProcedures?: string[] | null`, with a doc comment covering the three cases above.
10. `lib/utils/account-procedures.ts`, pure with no SDK import, so its unit tests run on plain node like `note-storage.test.ts`:
    - `missingProcedures(roots: string[], hasProcedure: (root: string) => boolean): string[]`.
    - `procedureName(root: string, scripts: Script[]): string`: the export path's last segment (for example `increment`) from the first script whose `procedureExports` has that digest. Compare case-insensitively and normalise `0x`. Pass the workspace's scripts plus `defaultScripts`, so the basic wallet's `receive_asset` is named. Fall back to a shortened root (`0x1234…abcd`).
    - Unit tests in `account-procedures.test.ts`.
11. `hooks/use-script-target-accounts.ts` (name it to taste):
    - Input: the script. Output: `{ status: "all" | "checking" | "filtered", accountIds: Set<string>, missing: string[] }`.
    - `status: "all"` when `script.metadata?.accountProcedures` isn't an array, or is `[]`.
    - Otherwise, for each account in `useAccounts().accounts`, load its code with the app's client and check every root:
      - Load it with `client.getAccount(WasmAccountId.fromHex(id))`, as `lib/web-client.ts` does around line 171. This only reads the store; don't call anything that writes it (see `docs/claude/simulation.md`).
      - Check with `account.code().hasProcedure(WasmWord.fromHex(root))`. `WasmWord` is already imported in `lib/web-client.ts`.
      - Put the SDK calls in `lib/web-client.ts` or `lib/simulation/run.ts`, not in the component.
    - **Cache by `Account.code`** (the code commitment), keyed by `${code}:${roots.join()}`, in a module-level `Map`. The same code always has the same procedures, so syncs, storage changes and re-renders don't reload anything.
    - An account whose code can't be loaded (no client, `getAccount` returns nothing or throws) is **kept**: it's unknown, not incompatible.
    - Run the checks through `enqueueSimulation` (`lib/simulation/simulation-client.ts`) or at least sequentially, so they don't interleave with a running simulation on the same WASM client.
    - `missing`: the names (via `procedureName`) of the roots that no account has. The empty state below uses it.
12. `components/transactions/select-account-dropdown-menu.tsx`: add an optional `accountIds?: Set<string>` prop. When given, `shownAccounts`, `shownWallets` and `shownFaucets` keep only those ids. Leave all other uses alone.
13. `components/script/simulate/target-simulation.tsx`:
    - Pass `accountIds` **only to the "Target account" dropdown**. The note storage form's account fields (for example P2ID's `target-account-id`, rendered by `ProcedureArgumentsForm`) and the Asset dropdown must keep listing every account.
    - While `status === "checking"`, disable the target dropdown (it says "No accounts found." when disabled; pass or render "Checking accounts…" instead).
    - When the filtered set is empty and the sandbox has accounts, the hint line (the `<p>` at the top) says: `No account has the procedures this script calls: increment. Deploy or import an account with them.` (names from `missing`, joined with `, `).
    - When the selected `targetAccountId` is no longer in the set (a recompile changed the roots, or an account changed code), reset it to `""` in an effect.
14. Mobile: the dropdown and hint don't get longer than today except for the empty-state message. Still run the `e2e/mobile` projects (`mobile-safari`, `mobile-chrome`, `mobile-small`) and check the Simulate tab at 320 px.

### E2E (`apps/web/e2e/script-simulate.spec.ts`)

The spec needs apps/api on 3001 and an api-compile that returns the field. To point the local API at another api-compile, use `wrangler dev --port 3001 --var API_COMPILE_URL:<url>` in apps/api (see `docs/claude/simulation.md`).

15. In "script: simulate a note and a transaction script":
    - After the "import a second account" step (the tutorials' counter at `OTHER_ACCOUNT_ADDRESS`, named "Other Counter"), the counter note's target dropdown lists "Counter Contract".
    - Check whether "Other Counter" has the same `increment` root (it's an older build of the tutorials' counter, so it may not). Assert whichever the data says, with a comment explaining why.
    - Add a plain wallet (create one in the sandbox, or import a known Testnet wallet) and assert it is **not** listed for the counter note or the counter script.
16. The P2ID steps ("a note's storage is typed by its storage schema", "the P2ID note is consumed by its target only") pick "Counter Contract" as the **target account**.
    - If the P2ID note's `accountProcedures` holds the basic wallet's `receive_asset` and "Counter Contract" has no basic wallet, it disappears from the target dropdown and those steps break. Check what the example's account is made of (`apps/web/lib/examples/counter-contract/state.ts`, the deploy in `apps/api/examples`).
    - If the steps break, target a wallet created in the test instead, and keep "Counter Contract" / "Other Counter" as the values of the `target-account-id` **storage field**: that dropdown isn't filtered.
    - The "consumed by its target only" assertion still holds: the note's assertion fails when the storage field names another account.
17. Add an assertion for the empty state: a counter note in a sandbox where no account has `increment` shows the "No account has the procedures this script calls: increment." hint. This can reuse the "a draft can't be simulated" setup in the other test if that's simpler.

### Docs

18. `docs/claude/simulation.md`: add a bullet saying:
    - The target dropdown keeps the accounts whose code has every root in `metadata.accountProcedures`.
    - The roots come from api-compile's MAST walk.
    - The checks are cached by code commitment, and unknown accounts are kept.
    - Only the target dropdown is filtered.
    - An absent field or `null` means no filter.
19. `spec/editor-console-improvements.md`: under item 11's follow-ups, point to this spec and mark it done when it ships.
20. Run `pnpm lint`. Biome formats Markdown (tables padded).

## Out of scope

- Built-in note scripts (`lib/types/default-scripts`, for example P2ID) have no `metadata`, so no filter applies. Simulate only runs editable scripts anyway.
- Packages compiled before the change: no filter until they're recompiled. No backfill.
- The account page's Invoke flow.

## Checks before the PR

- `pnpm test`, `pnpm typecheck` and `pnpm lint` in the repo root.
- `e2e/script-simulate.spec.ts` locally (web on 3000, api on 3001, `env -u DATABASE_URL pnpm dev`), plus the three mobile projects.
- Tutorials 6–9 use the counter example's packages and the script page. Rerun tutorials 6–8 after script page changes.
- After merging, deploying and refreshing `compiled.json`: launch the counter example on production, open its `increment-note`, Simulate tab, target dropdown → only the counter account is listed.
