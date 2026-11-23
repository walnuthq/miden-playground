# Analytics events beyond tutorials

Status: implemented 2026-11-23 on `feat/product-analytics-events`, not merged.
The plan was written 2026-11-19 at `7127b64`. The trial in
`spec/analytics-trial.md` compares each event by name, so these events don't
change its figures.

Where the code differs from the plan below:

- `script_type` accepts every key of `scriptTypes` (`lib/types/script.ts`), not
  three: a script of another type can be compiled, and `/ingest` would refuse
  its event while Simple Analytics counted it.
- `new_sandbox` and `launch_example` carry no `tutorial_id`: both leave the
  tutorial.
- `import_scripts` has `error` when a package came back with
  `status: "error"`, as `launch_example` does.
- A run on a sandbox account is never `failed`: `runOnSandboxAccount` turns a
  throw into a result.

## Why

The app records page views, tutorial progress and project saves, and nothing
else. Launching an example, creating or importing a script, compiling,
simulating and deploying leave no trace, so nobody can say whether the script
page and the Simulate tab (most of the work since 2026-11-03) are used, or how
often a compile or a deploy fails for real users. The report for management
that `spec/analytics-trial.md` plans would only show tutorials.

This plan adds seven events and five fields to the existing pipeline. It adds
no dependency, no route and no dashboard.

## How events work today

- `apps/web/lib/analytics-events.ts` is shared by the app and the Worker. It
  holds the allowlist of event names (`eventNames`), the allowlist of fields
  (`AnalyticsMetadata`, `fieldChecks`) and `toDataPoint`, which maps an event
  to Analytics Engine's positional columns. `/ingest` (`apps/web/worker/index.ts`)
  drops anything `toDataPoint` refuses.
- The columns today: `index1` and `blob1` the name, `blob2…6` `route`,
  `tutorial_id`, `network_id`, `wallet_connected`, `automated`; `double1…2`
  `tutorial_step`, `visit`. **They are positional: never reorder or reuse
  one.** New fields are appended.
- `trackEvent(name, metadata)` in `apps/web/lib/analytics.ts` sends an event
  to Simple Analytics (`window.sa_event`) and to `/ingest`. It only sends in
  the built app. It adds `automated: navigator.webdriver`.
- Call sites today, to copy the style from: `hooks/use-tutorials.ts:195`
  and `hooks/use-saved-projects.ts:53`:

  ```ts
  trackEvent("save_project", { network_id: networkId });
  ```

- `apps/web/scripts/analytics-report.ts` (`pnpm analytics:report [days]`)
  prints daily counts per event, with automated traffic left out of `people`.
- `apps/web/lib/analytics-events.test.ts` pins the column positions.

Analytics Engine stores no IP, user agent or identifier: it counts events, not
people. That stays true. No event may carry a script's name, source, an account
id, an address or an error message.

## New fields

Appended to `AnalyticsMetadata`, `fieldChecks` and `toDataPoint`'s `blobs`, in
this order, after `automated`:

| Column | Field         | Values                                                             |
| ------ | ------------- | ------------------------------------------------------------------ |
| blob7  | `example_id`  | an example's id (`lib/examples/meta.tsx`), or a script template id |
| blob8  | `script_type` | `account-component`, `note`, `transaction-script`                  |
| blob9  | `outcome`     | `ok`, `error`, `failed`                                            |
| blob10 | `target`      | `component`, `simulated`, `sandbox`                                |
| blob11 | `count`       | reserved, see below                                                |

- `outcome`: `ok` is success. `error` is a result the user can act on (a
  compile with diagnostics, a simulation that ran and failed). `failed` is the
  request or the client breaking (network error, API 5xx, crashed mock client).
- `script_type`, `outcome` and `target` are checked against their value lists
  in `fieldChecks`, not with `isText`: `/ingest` is public.
- Leave `blob11` out unless the implementation needs it: the table lists it
  only so the next addition starts at the right position. Four new blobs, then.
- `tutorial_id` (existing) goes on every new event, `""` outside a tutorial,
  to tell tutorial-driven use from free use. The hooks below read `tutorialId`
  from `useGlobalContext()`.

## New events

| Event            | Where                                                                                                            | Fields                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `new_sandbox`    | `components/home/new-sandbox-card.tsx`, `components/lib/project-switcher.tsx` (`newSandbox`), after `resetState` | `network_id`                                                         |
| `launch_example` | `hooks/use-examples.ts`, `launchExample`: each return after the user confirmed                                   | `example_id`, `outcome`                                              |
| `create_script`  | `hooks/use-scripts.ts`, `newScript`                                                                              | `script_type`, `example_id` (the template, `""` for none), `outcome` |
| `import_scripts` | `hooks/use-scripts.ts`, `importScriptsFromPackageSources`                                                        | `outcome`                                                            |
| `compile_script` | `hooks/use-compile-script.ts`, `compile`                                                                         | `script_type`, `outcome`, `tutorial_id`                              |
| `simulate`       | `hooks/use-simulation.ts` (`invoke`), `hooks/use-target-simulation.ts` (`simulate`)                              | `script_type`, `outcome`, `target`, `tutorial_id`                    |
| `deploy_account` | `hooks/use-accounts.ts`, `deployAccount`                                                                         | `network_id`, `outcome`, `tutorial_id`                               |

Details that aren't obvious from the table:

- `launch_example`: a cancelled workspace switch (`{ cancelled: true }`) sends
  nothing. `outcome` is `failed` when `importExample` threw or returned no
  scripts, `error` when a script came back with `status: "error"`, `ok` at the
  end. The example's account is deployed later by `loadExample`, through
  `deployAccount`: that deploy is counted as a `deploy_account`.
- `compile_script`: in `compile`, `failed` where it toasts "Script compilation
  failed.", `error` where `compiledScript.error` is set, `ok` at the end.
  Nothing when the script changed while it compiled (the early return in
  between). Track it in `use-compile-script.ts`, not in `use-scripts.ts`'s
  `compileScript`, so it counts what the user asked for.
- `simulate`: `target` is `component` in `use-simulation.ts` (an account
  component's procedure), and in `use-target-simulation.ts` `simulated` when
  `inputs.targetAccountId === SIMULATED_TARGET`, `sandbox` otherwise. `ok`
  and `error` follow `result.ok`; `failed` is a thrown run (the mock client
  crashed or hung). The previews that reuse the simulation queue
  (`hooks/use-note-preview.ts`, the Invoke preview) are not simulations the
  user asked for from the tab: don't count them.
- `deploy_account`: `failed` in the `catch` that dispatches
  `TRANSACTION_SUBMITTED` and rethrows, `ok` before `return account`.
- Never `await` a `trackEvent`, and never let it change a function's return
  value or error path.

## Report

In `scripts/analytics-report.ts`, after the daily table, print a second one
for the period: `event`, `example_id`, `script_type`, `outcome`, `target`,
`in_tutorial` (`blob3 != ''`), `people` (automated left out), for the seven new
events only. One more SQL query with `GROUP BY` on those blobs; the daily table
and its query stay as they are, since the trial's reads depend on them.

Rows written before this change have no `blob7…10`. Check on the first run
that Analytics Engine returns them as empty strings (it should: unset blobs
read as `''`), and say so in the script's header comment.

## Tests

Extend `apps/web/lib/analytics-events.test.ts`, following its existing cases:

- "keeps the columns in their positions": the expected `blobs` grows by the
  four new values, in the order of the table above. The first six stay where
  they are.
- "fills the fields an event doesn't have": four more `""`.
- New: each new event name is accepted; `outcome: "maybe"`, `target: "x"` and
  `script_type: "tx-script"` are refused (`toDataPoint` returns `null`); an
  unknown field is still refused.

No e2e: `trackEvent` doesn't send under `vite`, and the specs run with
`navigator.webdriver` set.

## Checks

From the repo root:

- `pnpm lint`, `pnpm typecheck`: clean.
- `pnpm --filter miden-playground-web test`: passes, with the new cases.
- `grep -rn "trackEvent(" apps/web/hooks apps/web/components | wc -l`: the 9
  existing calls plus one per call site above.
- By hand, on the built app (`spec/analytics-trial.md`, "Testing locally"):
  launch the Counter Contract example, compile its script, run a procedure in
  the Simulate tab, and see three `204`s on `/ingest` whose bodies carry the
  fields above and nothing else.
- After the deploy, `pnpm analytics:report 1` in `apps/web` lists the new
  events.

## Out of scope

- **Transactions and Invoke.** A transaction is submitted through at least
  three paths (`components/transactions/transaction-preview-form.tsx`,
  `hooks/use-para-transaction.tsx`, the wallet adapter's `requestTransaction`
  in `hooks/use-notes.ts`), and none of them knows the transaction's type at
  the point it succeeds. A `submit_transaction` event with a
  `transaction_type` needs that mapped first: a follow-up, with `blob11`.
- Verification, exports, note creation, wallet connection.
- Durations, error texts, any per-user or per-session identifier, funnels
  (they need an identifier).
- Simple Analytics: the new events reach it through `trackEvent` like the
  others, and go away with it. Nothing is added for it.
- A dashboard or the scheduled export for management: decided with the trial.

## Decisions for the maintainer

1. Merge after 2026-11-20 (recommended), or now: new event names don't change
   the counts of the existing ones, but the trial compares totals.
2. Count example deploys as `deploy_account` (recommended, simplest), or tell
   them apart with `example_id` on the event.
3. `docs/claude` has no analytics page. If these rules (positional columns,
   no identifiers, where to track) should bind future work, add
   `docs/claude/analytics.md` and its line in `CLAUDE.md` with this change.
