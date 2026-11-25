# Remove Rust: sub plans for this repo

Written 2026-11-25 at `966084c`. Nothing here is implemented.

The analysis, the decisions and the spike results are in [`../remove-rust.md`](../remove-rust.md): read its Summary, [Decisions](../remove-rust.md#decisions) and [Spike results](../remove-rust.md#spike-results) before any plan. Each plan below is written for one agent in one session. Start a session with: "Read `spec/remove-rust.md` and `spec/remove-rust/README.md`, then carry out `spec/remove-rust/NN-….md`."

## The plans

| Plan                                                                                     | Rollout step | Depends on                    | Needs a go-ahead from the user        |
| ---------------------------------------------------------------------------------------- | ------------ | ----------------------------- | ------------------------------------- |
| [01 API on MASM projects](01-api-masm-projects.md)                                       | 4            | verifier plans 01 to 07, live | no                                    |
| [02 MASM templates and their schemas](02-masm-templates-and-schemas.md)                  | 4            | 01                            | no                                    |
| [03 Web: script model and editor](03-web-script-model-and-editor.md)                     | 4            | 01                            | no                                    |
| [04 Web: diagnostics and argument forms](04-web-diagnostics-and-forms.md)                | 4            | 02, 03                        | no                                    |
| [05 The switch: state reset and retired content](05-switch-state-and-retired-content.md) | 4            | 01 to 04                      | yes: deletes production rows          |
| [06 Counter Contract example](06-counter-example.md)                                     | 5            | 05, released                  | no                                    |
| [07 Tutorials 6 to 12](07-tutorials-6-to-12.md)                                          | 5            | 06                            | Testnet deploys in tutorials 6 and 12 |
| [08 Cleanup](08-cleanup.md)                                                              | 7            | 07; verifier plans 08 to 10   | no                                    |

The verifier's plans are in `walnuthq/miden-source-code-verification`, `spec/remove-rust/` (on this machine `../miden-source-code-verification/spec/remove-rust/`). Its README defines the **MASM wire format** that api-compile answers: plans 01 and 04 read it. The `miden-verify` CLI's plan is `spec/remove-rust.md` in its own repo and runs last.

## How step 4 ships

Plans 01 to 05 are one release, "the switch": between them the app is half Rust and half MASM, so none of them merges to `main` alone.

- The integration branch is `feat/masm-switch`, off `main`. Each plan works on its own branch off the integration branch (`masm/01-api`, `masm/02-templates`, …) and merges into it, not into `main`.
- Plans run one after the other in the main checkout. Running 02 and 03 at the same time needs worktrees, which only the user can ask for.
- `feat/masm-switch` merges to `main` once, on the user's word: a merge deploys to production. Plan 05 holds the release checklist.
- Rebase the integration branch on `main` before each plan starts.

Plans 06 and 07 merge to `main` one PR at a time: one for the example, one per tutorial.

## Rules for every plan

- Read `CLAUDE.md` and the `docs/claude/` guides it lists for the areas you touch. Many of them describe the Rust pipeline: where a guide and a plan disagree, the plan wins, and plan 08 rewrites the guides.
- No worktree unless the user asks. Commit on your branch. Push, open a PR or merge only when the user's prompt says so. No Claude attribution in commits or PRs.
- Run the plan's drift check first. On a mismatch you can't explain, stop and report.
- Never connect to the remote production `DATABASE_URL` that is commented out in the API's env file. Test migrations and deletions in a throwaway database (`docs/claude/database-migrations.md`, `environment-variables.md`).
- Local runs need the web app on port 3000 and the API on 3001 (`env -u DATABASE_URL pnpm dev`), and an api-compile and registry that build MASM: the verifier repo's docker compose stack on `localhost:8080` and `8081`, which is what `apps/api/wrangler.jsonc` points at in dev.
- Don't edit `apps/web` or `git stash` while a local Playwright run is going. Keep the Mac awake for long runs (`caffeinate -dims`). Kill processes by PID, never with a `pkill -f` pattern.
- `pnpm lint`, `pnpm typecheck` and the unit tests pass before you report. Run `pnpm exec biome check --write` on Markdown you edit.
- After any layout change run the `e2e/mobile` projects and keep pages from overflowing down to 320 px. After renaming a button, tab or file, grep `apps/web/components/tutorials`.
- Analytics events are an allowlist with positional columns: append a field, never reorder or reuse one, and never send a script name, an id or an error text.
- When a STOP condition occurs, stop and report. End with a report: what changed, what you verified and how, what you didn't verify, what the next plan should know.

## Facts every plan can rely on

- A script is one MASM file plus a generated `miden-project.toml` (decision 10). The file is named after the script kind's module; plan 01 fixes the name and the others use it.
- The Playground assembles on the server through api-compile (decision 11). The answer has no storage schema, no note storage schema, no compiler MASM and no debug build; it has `diagnostics` and `parameters` with names.
- Built-in scripts stay browser-assembled, with their hand-written signatures and schemas (decision 8).
- Hand-written schemas feed the schema-driven UI for built-ins, templates and tutorial scripts; everything else is raw (decision 3).
- MASM facts from the spike: types are `felt`, `word`, `u64`, `u16`, `i1`, and the structs `AccountId` and `Asset`; attributes are `@account_procedure`, `@note_script`, `@transaction_script`; a storage slot is named with `word("namespace::slot")`; a manifest's dependencies `miden-core = "*"` and `miden-protocol = "*"` resolve.
