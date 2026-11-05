# Read-only procedures

A procedure's `readOnly` flag decides whether its Invoke button runs it locally (`canInvokeProcedure`). api-compile reads it from the MAST (`readOnly` next to the manifest in `POST /compile`, `miden-package-metadata/src/read_only.rs` in miden-source-code-verification): `true`, `false`, or `null` when it can't tell (a dynamic call, a direct syscall, a call into another user library).

- The API stores it in each export's `Procedure` (the `exports` jsonb column, no schema change). Packages compiled before api-compile reported it have none until their next compile, and neither do registry packages (api-registry doesn't store it).
- `isReadOnlyProcedure` (`lib/utils/script.ts`) resolves it to a boolean when a script is built: the flag when there is one, otherwise the `get…` name. A wrong guess only costs a local run whose changes are discarded.
- Built-in scripts set it by hand (`lib/types/default-scripts`), matching what the analyzer says for the same digests in miden-standards: re-check them after an SDK bump. `withDefaultScripts` replaces persisted copies, so a corrected flag reaches existing states.
- Regenerate the examples' `compiled.json` (`pnpm examples:compile`) after api-compile changes the flag's analysis: the snapshots carry it.
