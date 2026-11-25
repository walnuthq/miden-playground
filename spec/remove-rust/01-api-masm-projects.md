# Plan 01: The API works on MASM projects

> **Executor**: read `spec/remove-rust.md` and `spec/remove-rust/README.md` first; their rules apply. Read `docs/claude/script-templates.md`, `case-helpers.md`, `database-migrations.md` and `environment-variables.md`. Drift check: `git diff --stat 966084c..HEAD -- apps/api`. Confirm with the user that the verifier's plans 01 to 07 are deployed, and that your local compose stack builds MASM (compile one of the verifier's `examples/masm` projects against `localhost:8080`).

- **Rollout step**: 4 (part of the switch)
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: verifier plans 01 to 07
- **Branch**: `masm/01-api`, off `feat/masm-switch` (create the integration branch off `main` if it doesn't exist)

## Goal

`apps/api` creates, compiles, imports, exports and verifies MASM projects. A package is two files. Templates are placeholders here: plan 02 writes the real ones. The web app is not touched and is broken on this branch until plan 03.

## Current state

- `lib/utils.ts`: `createPackage` writes seven files per package (`src/lib.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`, `rust-toolchain.toml`, `miden-project.toml`); `compilePackage` sends `warmLockfile: true, masm: true`, stores the returned lockfile and MASM, and writes `metadata` from the answer's `storage` and `noteStorage`.
- `lib/toml.ts`: `generateCargoToml`; `generateMidenProjectToml` writes a WIT namespace from the Rust trait name (`extractTraitName`) and no `path`.
- `lib/templates.ts` and `templates/`: ten `.rs` templates and `project-template/` (seven files, a 3,000-line `Cargo.lock`), bundled by the wrangler Text rule for `**/*.rs` and `**/*.lock`.
- `lib/package-sources.ts` and `POST /scripts/import`: the body is `{ midenProjectToml, rust }` per package and requires `src/lib.rs`.
- `GET /scripts/:id/export` (`exportFiles`) zips the cargo project. `routes/verified.ts` (`packageSourceFiles`) rebuilds the cargo project around the source and sends it to the registry. `lib/default-dependencies.ts` builds dependency packages' files.
- `lib/types.ts`: `PackageSource.rust`, `scriptFilePaths = ["src/lib.rs", "Cargo.toml", "miden-project.toml"]`.
- `db/schema.ts`: `files` jsonb, `masm` text, `masp` text, `exports`, `metadata`.
- `scripts/check-lockfile.ts`, `check-templates.ts`, `compile-examples.ts`; `examples/` holds two Rust projects with `compiled.json` snapshots.

## Steps

1. **File layout.** A package's files are `miden-project.toml` and one source file. Name the source after the package: `<package_name_with_underscores>.masm` at the package root (the spike used `counter_account.masm`). Put the name in one helper and export it for the web app. Update `scriptFilePaths`.
2. **`lib/toml.ts`.** Delete `generateCargoToml` and `extractTraitName`. `generateMidenProjectToml` writes `[package] name/version`, `[lib] kind`, `namespace` (a MASM path: the package name with `-` turned into `_`) and `path`, and `[dependencies]` with `miden-core = "*"`, `miden-protocol = "*"`, `miden-standards = "*"` where the template uses it, and the same path dependencies as today. Check `docs/claude/case-helpers.md` for the namespace helper in `case.ts` and remove its Rust use.
3. **`createPackage`, `default-dependencies.ts`**: two files.
4. **`compilePackage`**: send the project with no flags. Store `masp`, `exports`, the manifest-derived fields and `parameters`. Stop writing the `masm` column (decision 7): leave it null for new compiles; no migration. Stop taking `metadata.storage` and `metadata.noteStorage` from the answer: they are absent. Leave a single function where `metadata` is decided, returning what the package already has; plan 02 puts the schema rules there.
5. **Diagnostics**: pass api-compile's `diagnostics`, `stdout` and `stderr` through to the client unchanged. Check `lib/upstream.ts` and `lib/errors.ts` for anything that reads cargo's text.
6. **Templates**: replace `templates/*.rs` and `project-template/` with ten `.masm` files of the same names. In this plan each is the smallest script of its kind that assembles (plan 02 writes the real content). Wrangler's Text rule becomes `**/*.masm`.
7. **Import**: the body is `{ midenProjectToml, masm }` per package. Path dependency resolution is unchanged. A body with `rust` gets a 400 that says Rust projects are no longer supported.
8. **Export**: the zip holds the MASM project.
9. **Verification routes**: send the MASM project to the registry.
10. **Examples**: remove `examples/miden-bank` and its snapshot (decision 9). Leave the Counter Contract example's Rust files and snapshot in place but unreachable: plan 05 marks it unavailable and plan 06 rewrites it. If the bundle can't carry them cleanly, delete them and note it for plan 06.
11. **Scripts**: delete `scripts/check-lockfile.ts` and the `lockfile:check` / `lockfile:sync` scripts; `templates:check` runs `check-templates.ts` alone, which compiles every template and fails on one that doesn't build. Remove its `--write` half and `templates:sync` only if nothing else uses them (the embedded basic wallet goes in plan 05).
12. **Tests** (`node --test 'lib/**/*.test.ts'`): update `toml.test.ts`, `package-files.test.ts`, `package-sources.test.ts`, `package-metadata.test.ts`, `package-exports.test.ts`, `package-type.test.ts`.

## Verification

- `pnpm --filter miden-playground-api test`, `typecheck` and `pnpm lint` pass.
- `pnpm --filter miden-playground-api templates:check` passes against the local api-compile.
- With the API on 3001, by `curl` against localhost only: create a script from each template, compile it, export it and unzip it, import the zip's content back, fork it, and read a shared link. Report one compile's wall time.
- `wrangler deploy --dry-run` (the `build` script) succeeds and the bundle no longer holds `Cargo.lock`.

## STOP conditions

- api-compile's answer differs from the MASM wire format in the verifier repo's README.
- A change needs a schema migration other than none.

## Out of scope

Real template content and schemas (plan 02), the web app (plans 03 and 04), deleting Rust rows (plan 05), the Counter Contract example (plan 06), dropping the `masm` column (plan 08).
