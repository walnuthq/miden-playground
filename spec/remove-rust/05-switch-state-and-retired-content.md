# Plan 05: The switch, state reset and retired content

> **Executor**: read `spec/remove-rust.md` (decisions 2, 9, 12 and 13) and `spec/remove-rust/README.md` first. Read `docs/claude/saved-projects.md`, `mockchain-sandbox.md`, `tutorial-copy.md`, `examples.md` and `database-migrations.md`. This plan includes deleting production rows: **write and test the deletion, never run it against production; the user runs or orders it**. Drift check: plans 01 to 04 are merged into `feat/masm-switch`.

- **Rollout step**: 4 (closes the switch)
- **Effort**: M
- **Risk**: HIGH (discards users' saved state; destructive database step)
- **Depends on**: 01 to 04
- **Branch**: `masm/05-switch`, off `feat/masm-switch`

## Goal

After this plan `feat/masm-switch` can ship: nothing Rust is reachable, what can't work yet is marked unavailable, old state is discarded cleanly, and the release checklist is written.

## Steps

### Persisted state (decision 13)

1. A persisted state that holds a Rust script is reset whole, without telling the user: no toast. It applies to the active workspace, to each saved project and to each resumable tutorial state, independently. A state with no Rust script is untouched.
2. A script is Rust when its `files` hold `src/lib.rs` or a `Cargo.toml`. Built-ins never are.
3. Do it where states are read (`lib/utils/state.ts`, `stateDeserializer`, and the saved-projects and resume paths `saved-projects.md` describes), before anything renders. "Reset" for the active workspace means the default state of its network; for a saved project or a tutorial state it means the entry is removed. A saved MockChain project also holds a saved chain: remove it with the project.
4. `migrateScript` and `retiredScriptIds` / `retiredComponentIds`: remove the migrations that only served Rust scripts once the reset makes them unreachable; keep the ones `transaction-script-kind` and the retired built-ins still need.
5. Unit tests for each of the three kinds of state, with and without a Rust script. An e2e spec that seeds a Rust-era state in storage and loads the app.

### Shared and project links (decision 2)

6. Not checked: the user assumes no shared, fork or project link to a Rust script is in circulation (2026-11-26). The API answers 404 for a deleted script as it does today.

### Retired and unavailable content (decisions 9 and 12)

7. Miden Bank: hide it, don't remove it (user, 2026-11-26): it comes back in MASM later. Its card is hidden and `lib/examples/miden-bank` stays; `e2e/example-miden-bank.spec.ts` becomes `test.fixme` with a pointer to the MASM rewrite. Nothing in this plan is retired: what can't work yet is hidden or marked unavailable.
8. Counter Contract example: hide its card, as Miden Bank's, until plan 06 (user, 2026-11-26). Add a `hidden` flag to `ExampleMeta` (`lib/types/example.ts`, `lib/examples/meta.tsx`) that the home page and the Projects switcher honour; set it on both examples and leave their code. Plan 06 drops it from the Counter Contract.
9. Tutorials 6 to 12: set `unavailable` (`lib/types/tutorial.ts`, `components/tutorials/meta.ts`) with one reason for all: "Being rewritten for Miden Assembly." They stay listed as unavailable cards, not hidden (user, 2026-11-26). Tutorial 5 is already unavailable for another reason: leave it. `tutorial-unavailable.spec.ts` covers the behaviour; mark the seven tutorial specs and `example-counter-contract.spec.ts` `test.fixme` with a pointer to plan 06 or 07.
10. Embedded packages: delete them (user, 2026-11-26). Delete `lib/tutorials/basic-wallet.json`, `basic-wallet.ts` and its test, and the Test Wallet's use of it, with `templates:sync` and `check-templates.ts --write`. Delete `counter-account.ts` and `count-reader.ts` and their tests too, unless something reachable still imports them; note for plan 07 that tutorials 6 and 10 need them re-embedded from MASM or assembled on demand. Keep the Simulate tab working: drop `basicWalletScript` from `lib/simulation/embedded-packages.ts` and from the `named` list in `components/script/simulate/target-simulation.tsx`. The MASM P2ID template calls the standard wallet's `receive_asset`, which the built-in Basic Wallet already exports, so the simulated account still covers it. This also fixes the three failing unit tests.
11. `lib/utils/tutorial-code.ts` and `apply-code-button.tsx` hold Rust snippets for the unavailable tutorials: leave them unreachable, plan 07 rewrites each.

### The production deletion (decision 2)

12. Kept even though no shared link is assumed (user, 2026-11-26), so the database holds no row that can't be rebuilt. Write a script under `apps/api/scripts/` that deletes the Rust-built `packages` rows and what hangs off them (scripts, forks, project links: read `db/schema.ts` and its relations). A row is Rust-built when its `files` hold `src/lib.rs` or `Cargo.toml`. Dry run by default, listing counts; the real run behind a flag; safe to run twice.
13. Test it in a throwaway database holding both kinds of rows. Report the counts.

### Release checklist

14. Write it in the integration PR's description, for the user:
    - The verifier's plans 01 to 07 are live.
    - Full local e2e passes on `feat/masm-switch`, including `e2e/mobile`.
    - Merge and watch the three deploys.
    - Dry run of the deletion against production, read the counts, then the real run: each on the user's word.
    - Prod smoke: create, compile, deploy on MockChain, share, fork, export, import. Rust-era links aren't checked (step 6).
    - What is knowingly down: tutorials 6 to 12 and the Counter Contract example, until plans 06 and 07.

## Verification

- `pnpm lint`, `pnpm typecheck`, all unit tests.
- Full local e2e on the integration branch. Tutorials 1 to 4 must pass; they share the script page and the state code.
- `grep -rn "lib\.rs\|Cargo\|cargo" apps/web/lib apps/web/components apps/api/lib apps/api/routes` hits only the reset's detection, the 400 for Rust imports, and the unreachable tutorial snippets.

## STOP conditions

- The reset would discard a state that holds no Rust script.
- A tutorial among 1 to 5 depends on something this plan deletes.
- Any step would touch the production database.

## Out of scope

Rewriting the example and the tutorials (plans 06 and 07), dropping the `masm` column and rewriting the guides (plan 08).
