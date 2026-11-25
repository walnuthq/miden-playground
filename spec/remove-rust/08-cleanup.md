# Plan 08: Cleanup

> **Executor**: read `spec/remove-rust.md` and `spec/remove-rust/README.md` first. Read `docs/claude/database-migrations.md`: a dropped column ships with its migration, in a release after the one that stopped reading it. Drift check: plan 07's seven tutorials are merged and deployed, and the verifier's plans 08 to 10 are deployed (ask the user).

- **Rollout step**: 7
- **Effort**: M
- **Risk**: LOW, except the column drop (MEDIUM)
- **Depends on**: 07; verifier plans 08 to 10
- **Branch**: `chore/remove-rust-cleanup`, off `main`

## Goal

Nothing in the repo describes or supports the Rust pipeline, and the API follows the verifier's final wire format.

## Steps

1. **Wire format.** The verifier's plan 08 removed `cargoMidenVersion`, `debug`, `masm`, `storage` and `noteStorage` from api-compile's answers and made `builtWith` and `diagnostics` required. Remove what the API and the web app still read of the old fields, including anything about debug packages and the `.debug.masp` route.
2. **The `masm` column** (decision 7): drop it from `apps/api/db/schema.ts` with its migration, after checking no deployed code reads it. `Script.masm` in the web app stays, for built-ins.
3. **Dead code**: the midenc type names if plan 04 kept both tables; `retiredScriptIds` entries and migrations that can no longer match anything; `e2e/legacy-components.spec.ts` and `retired-built-ins.spec.ts` if what they cover is gone; the root `target/` directory and its `.gitignore` entry.
4. **`CLAUDE.md`**: the area index entries for templates, the project-template lockfile (delete), examples, MASM highlighting and the upgrade guide; the rules that name Rust.
5. **`docs/claude/`**: delete `project-template-lockfile.md`; rewrite `script-templates.md`, `examples.md`, `masm-highlighting.md`, `upgrading-miden.md`; fix `read-only-procedures.md`, `simulation.md`, `script-editor.md`, `saved-projects.md`, `case-helpers.md`, `tutorial-copy.md`.
6. **Other docs**: `README.md`, `docs/qa/README.md`, `docs/share-project.md`, the `tutorials-qa` skill.
7. **`.github/workflows/drift.yml`**: remove the lockfile check; the MASM vocabulary check reads its version from the new source (plan 03).
8. **Specs**: mark `spec/tutorials-rust-pipeline.md`, `spec/project-export.md` and `spec/procedure-parameter-names.md` historical or update them; re-read `spec/account-files.md` and `spec/account-upgrades.md` against the MASM model and note what changes, without rewriting them.
9. Set the status at the top of `spec/remove-rust.md` and of this folder's README to done, with what shipped and what didn't.
10. `grep -rni "rust\|cargo\|midenc\|lib\.rs\|\bwit\b" --include=*.ts --include=*.tsx --include=*.md --include=*.json --include=*.yml .` outside `node_modules`: fix or justify every hit.

## Verification

- `pnpm lint`, `pnpm typecheck`, all unit tests, `templates:check`.
- The migration applies on a throwaway database and `drizzle-kit` reports no drift.
- Full local e2e.

## STOP conditions

- Deployed code still reads the `masm` column.

## Out of scope

The verifier and the `miden-verify` CLI.
