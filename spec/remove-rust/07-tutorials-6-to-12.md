# Plan 07: Tutorials 6 to 12 in MASM

> **Executor**: read `spec/remove-rust.md` and `spec/remove-rust/README.md` first. Read `docs/claude/tutorial-copy.md`, `script-templates.md`, `saved-projects.md` (resumable tutorials), `simulation.md` and `docs/qa/README.md`; use the `tutorials-qa` skill for the QA pass. **One session and one PR per tutorial.** Your prompt names the tutorial; do that one only. Drift check: plan 06 is merged, and the tutorials before yours in the order below are merged.

- **Rollout step**: 5
- **Effort**: M per tutorial, L for 8, 10 and 11
- **Risk**: MEDIUM (teaching content; no test catches wrong copy)
- **Depends on**: 06
- **Branch**: `feat/masm-tutorial-<n>`, off `main`

## Goal

Each of tutorials 6 to 12 teaches the same thing it taught, in MASM, and is available again. The reader of these tutorials knew Rust contracts; MASM is lower-level, so a step explains what a line does to the stack rather than translating a Rust line.

## Order

6, 7, 8, 9, 10, 11, 12. Each builds on the templates (plan 02) and, for 9, on the example (plan 06).

## For every tutorial

1. Read the tutorial's current steps under `apps/web/components/tutorials/<slug>/` and its e2e spec, to know what it teaches and what state each step expects.
2. Rewrite the steps. Line references point at the MASM template as shipped: quote the line, don't number it from memory. Name buttons, tabs and files as they are after the switch: there is no MASM tab, and the file is the `.masm` source.
3. Rewrite its snippets in `lib/utils/tutorial-code.ts` and their anchors for `apply-code-button.tsx`: an anchor is a line of the template, so a template edit breaks it. `templates:check` compiles every tutorial edit: keep it passing.
4. Remove `unavailable` for this tutorial in `components/tutorials/meta.ts`, and `test.fixme` from its spec. Update the spec and `e2e/editor.ts` helpers it needs.
5. Resume: a tutorial state saved mid-way must still resume (`resume-tutorial.spec.ts`).
6. Run its spec locally on desktop and the mobile projects, then a QA pass by hand with the `tutorials-qa` skill, reading every step as a newcomer. Update its row in `docs/qa/README.md`.
7. Grep the tutorial's folder for `Rust`, `lib.rs`, `Cargo`, `crate`, `struct`, `felt!`, `MASM tab`, `trait`.

## Per tutorial

- **6, interact with the counter** (`interact-with-the-counter-contract`). Steps cite `counter-account.rs` lines; step 3 names the disabled MASM tab and the Read-only badge. It uses a counter deployed on Testnet (`0xe564fd…` was the Rust one): a MASM counter must be deployed for it and its package re-embedded (`lib/tutorials/counter-account.ts`) with its hand-written schema, or assembled on demand. **The Testnet deploy needs the user's go-ahead.**
- **7, deploy a counter** (`deploy-a-counter-contract`). The edit was `felt!(1)` to another value. The MASM edit changes the pushed constant in `increment_count` or the initial count: pick the one that leaves the slot names alone, so the typed deploy form survives the edit (decision 3's stale rule).
- **8, timelock P2ID** (`timelock-p2id-note`). The edit adds a timelock height to the P2ID note. In MASM that is one more note input read from memory and a comparison with the block height. Two consequences of decision 3: after the edit the note has no `noteStorage`, so the Create Note form is raw and **the step must say which raw values to enter and in what order**; and the Test Wallet is a standard wallet now, so say that Bread or Para can consume the note too. Check the "consumed height-0 note" path the old e2e covered.
- **9, network transactions** (`network-transactions`). Starts from the counter example's packages through `starter`; step 3 cited `increment-note/src/lib.rs` lines. Follow plan 06's packages. `tutorial-9-missing-scripts.spec.ts` covers the restart alert: keep it.
- **10, foreign procedure invocation** (`foreign-procedure-invocation`). `count-reader` calls the counter with `tx::execute_foreign_procedure` by hand: this is the hardest one to explain, give it the most prose. Re-embed `lib/tutorials/count-reader.ts` from MASM or assemble on demand. Check `callsForeign` drives the Invoke form as before.
- **11, first smart contract and custom note** (`your-first-smart-contract-and-custom-note`). Taught adding `counter-account` as a Cargo-style dependency; six of nine files mention Rust. The dependency flow stays: a path dependency in `miden-project.toml`, added with the Add Dependency dialog.
- **12, contract verification** (`contract-verification`). Verifies a project through the registry; the edit was `reset_count`. Needs the production registry to accept MASM (verifier plans 05 to 07). Its e2e deploys and verifies on Testnet, as it does today; a fresh run sends one verification. Step 7's address line overflowed the phone panel before: check it.

## Verification, per PR

- `pnpm lint`, `pnpm typecheck`, unit tests, `templates:check`.
- The tutorial's spec, `resume-tutorial.spec.ts` and `tutorial-unavailable.spec.ts` locally; the mobile projects for the tutorial.
- The hand QA pass, with what you saw at each step.

## STOP conditions

- A tutorial can't teach its point in MASM without a feature the app lacks (for example a typed note form after an edit). Report the gap and the smallest change that closes it; don't redesign the tutorial around it alone.
- A template has to change for a tutorial: that touches the other tutorials' anchors. Say which.

## Out of scope

Tutorials 1 to 5 beyond re-reading their copy for "compiled" wording (do that in the PR for tutorial 6).
