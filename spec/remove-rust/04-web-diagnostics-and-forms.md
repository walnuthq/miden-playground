# Plan 04: Web app, diagnostics and argument forms

> **Executor**: read `spec/remove-rust.md` and `spec/remove-rust/README.md` first, and the "MASM wire format" section of the verifier repo's `spec/remove-rust/README.md`. Read `docs/claude/script-editor.md`, `simulation.md` and `read-only-procedures.md`. Drift check: plans 02 and 03 are merged into `feat/masm-switch`.

- **Rollout step**: 4 (part of the switch)
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: 02, 03
- **Branch**: `masm/04-diagnostics-forms`, off `feat/masm-switch`

## Goal

A build error shows in the console and as a marker on the right line of the MASM file. The Invoke, Simulate, deploy and Create Note forms work on MASM packages: typed where the manifest and a schema allow, raw where they don't.

## Current state

- `lib/utils/diagnostics.ts` and `compiler-output.ts` parse rustc's rendering (`error[E0425]`, `--> src/lib.rs:44:32`, caret lines). Six fixtures under `fixtures/compile-errors`; `e2e/script-diagnostics.spec.ts`.
- `lib/utils/procedure-inputs.ts` (523 lines), `midenTypes`, `MidenTypeLayout`: keyed on midenc's layout names (`miden:base/core-types@1.0.0/felt`, `Struct` with fields, sizes in bytes) and on WIT parameter names.
- The built-ins' hand-written signatures (`lib/types/default-scripts/*.ts`) copy midenc's layout.
- `PackageMetadata.storage` and `noteStorage` feed the deploy form, `components/script/metadata-table.tsx`, the Simulate tab (`lib/simulation`), `storage-slot-name.tsx` and `storageSlotName` in `case.ts`.

## Steps

1. **Diagnostics.** Replace the rustc parser with a reader of the answer's `diagnostics` list: `severity`, `message`, `file`, `line`, `column`, `length`, `label`, `help`. Markers go on the source file at `line:column` for `length` characters; a diagnostic without a position shows in the console only. The console shows `stderr`, the assembler's own rendering. One error per build is normal: don't write "1 of n". Warnings get warning markers and don't block a deploy.
2. Replace the six fixtures with MASM ones captured from the local api-compile: a bad instruction, an undefined procedure, a syntax error, a missing dependency, a warning, and a failure without a position. Update `script-diagnostics.spec.ts`.
3. **Type names.** The MASM manifest keeps the layout's shape with other names: `Felt`; `AccountId` and `Asset` as `Struct` with a bare name and their fields; `word` as `Array(Felt, 4)`; `u64`, `u16`, `i1` as primitives. Extend the name table in `procedure-inputs.ts` so each gets the input it has today (`AccountId` the account picker, `Asset` the asset input, `word` the word input, `i1` a boolean). Capture the manifests of plan 02's templates as test fixtures; don't write them from memory.
4. **One name table.** Move the built-ins' hand-written signatures to the MASM names and delete the midenc names from the table, since no stored package uses them after plan 05. If that makes the diff risky, keep both for this plan and say so for plan 08.
5. **Parameter names** come from `parameters` in the answer, as today. A procedure without names shows `arg0`, `arg1` or whatever the forms already do for a missing name: check, and keep it.
6. **Schemas.** With `metadata.storage`: the typed deploy form and metadata table, as today. Without: raw slot names and words, the form the app already shows for a package with null metadata. Same for `noteStorage` on the Create Note and Simulate note forms: typed with it, raw felts without. Walk each of the four forms in both states.
7. **Read-only and foreign calls.** `readOnly` and `callsForeign` arrive as before. Check the Invoke button's read-only path on the counter's `get_count` and the foreign-call path on `count-reader`.

## Verification

- `pnpm lint`, `pnpm typecheck`, web unit tests.
- Local e2e: `script-diagnostics`, `script-simulate`, and the `e2e/mobile` projects for the script page.
- By hand on MockChain: deploy the counter with its typed form, invoke `increment_count` and `get_count`, simulate both, create a counter note and a P2ID note; then rename the counter's slot, compile, and walk the raw forms.

## STOP conditions

- A manifest type has no input and no raw fallback.
- `diagnostics` positions are off by one against the editor: fix the reader if the wire format says 1-based, report if api-compile is wrong.

## Out of scope

Tutorial copy that describes the forms (plan 07).
