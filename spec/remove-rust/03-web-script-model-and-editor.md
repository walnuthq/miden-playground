# Plan 03: Web app, script model and editor

> **Executor**: read `spec/remove-rust.md` and `spec/remove-rust/README.md` first. Read `docs/claude/script-editor.md`, `masm-highlighting.md`, `phone-layout.md` and `ui-components.md`. Drift check: plan 01 is merged into `feat/masm-switch`; `git diff --stat 966084c..HEAD -- apps/web/lib/types/script.ts apps/web/lib/utils/script-files.ts apps/web/components/lib/editor.tsx apps/web/components/script`.

- **Rollout step**: 4 (part of the switch)
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: 01
- **Branch**: `masm/03-web-editor`, off `feat/masm-switch`

## Goal

The script page edits a MASM file. Creating, importing, exporting, sharing and forking a script work end to end against plan 01's API. Diagnostics and argument forms may still be rough: plan 04 owns them.

## Current state

- `lib/types/script.ts`, `lib/utils/script-files.ts`, `lib/utils/script.ts`: `SCRIPT_FILE = "src/lib.rs"`, `scriptFilePaths`, `PackageSource.rust`. `Script.masm` and `assembledFromMasm` (`lib/web-client.ts`) tell a compiled Rust script (package plus compiler MASM) from a built-in (MASM only).
- `components/lib/editor.tsx` and `components/script/*`: the source file's language is Rust; the MASM tab is a read-only view of `script.masm`; the file explorer shows three files.
- `lib/masm/language.ts` is a Monarch language for MASM, fed by `vocabulary.json` (`pnpm masm:sync`, which reads the `miden-assembly-syntax` tag from `apps/api/templates/project-template/Cargo.lock`, deleted by plan 01).
- `lib/types/default-scripts/*.ts`: each built-in carries a `rust` source shown in the editor, next to its `masm`.
- `create-script-dialog.tsx`, `import-project-dialog.tsx`, `lib/api.ts`, `scripts/share-project.mjs`, `docs/share-project.md`: the import dialog reads `src/lib.rs` and `miden-project.toml` from a folder; `share-project` posts `rust`.
- e2e: `script-masm.spec.ts` pins token types on the MASM tab; `e2e/editor.ts` helpers type Rust; `script-explorer`, `script-header`, `script-layout`, `script-shortcuts`, `script-editor-settings`, `share-and-fork`, `delete-script`, `project-link` and three mobile specs touch the script page.

## Steps

1. **Model.** The source file is the one plan 01's helper names; `scriptFilePaths` follows the API. `PackageSource.rust` becomes `masm`. For a user script the editor's content is `files[<source>]`; `Script.masm` stays for built-ins only (decisions 7 and 8). Keep `assembledFromMasm` meaning what it means today: a built-in, assembled in the browser.
2. **Editor.** The source file opens with the MASM language. Remove the MASM tab and everything that fed it. The file explorer shows two files. Check tab order, shortcuts and the phone layout after the tab goes.
3. **Built-ins.** Delete the `rust` strings; the editor shows their MASM, read-only as today. `withDefaultScripts` already replaces persisted copies.
4. **Vocabulary.** `pnpm masm:sync` needs a new source for the assembler version: a pinned constant next to the script, bumped with the SDK (`docs/claude/upgrading-miden.md` gets a line). Run it once and commit the vocabulary if it changed.
5. **Create, import, share, fork, export.** The import dialog reads `miden-project.toml` and its `[lib] path` file from a folder, and says so; a folder with a `Cargo.toml` and no MASM gets a clear refusal. `lib/api.ts` follows plan 01's bodies. `scripts/share-project.mjs` posts `masm`.
6. **Copy.** Every string on the script page, the dialogs and the home page that says Rust, `lib.rs`, Cargo, "compile" where "assemble" is meant. Keep "Compile" on the button unless the user says otherwise: tutorials and e2e name it.
7. **Analytics.** Read `lib/analytics-events.ts`: if an event field names a language or a file, leave the column and append a new one only if needed.
8. **e2e.** `script-masm.spec.ts` moves its token checks to the editor. `e2e/editor.ts` types MASM. Update the script-page specs listed above. The tutorial and example specs for 6 to 12 are expected to fail until plan 05 marks them unavailable: don't fix them here.

## Verification

- `pnpm lint`, `pnpm typecheck` and the web unit tests pass.
- `vite build` succeeds (the shell's static graph still imports nothing from the SDK).
- Local e2e, web on 3000 and API on 3001: the script-page specs, `share-and-fork`, `project-link`, `delete-script`, and the `e2e/mobile` projects for the script page down to 320 px.
- By hand: create each template, edit, compile, deploy the counter on MockChain, export, import the export.

## STOP conditions

- Removing the MASM tab breaks a tutorial step for tutorials 1 to 5 (grep `apps/web/components/tutorials` for "MASM").

## Out of scope

The diagnostics parser and the argument forms (plan 04), persisted Rust state, embedded packages and tutorials 6 to 12 (plan 05).
