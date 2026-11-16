# Account page: preview a procedure's transaction before submitting it

Status: **implemented** (2026-11-16), on `feat/invoke-preview`; not merged. Written for an agent that hasn't seen the discussion: everything needed is here or in the files named.

One PR, in the Playground only (`apps/web`, `docs`, `spec`). The API and api-compile don't change.

Read first: `docs/claude/read-only-procedures.md`, `tutorial-copy.md`, `phone-layout.md`, `ui-components.md`, `simulation.md` (for `components/procedures`).

## The problem

On an account's page, the Components tab lists each component's procedures with an **Invoke** button (`components/account/procedures-table-row.tsx`).

- A read-only procedure runs locally and shows its value in the row. Nothing to change there.
- A state-changing procedure is **executed and submitted in one go**: `invokeProcedure` (`hooks/use-scripts.ts`) builds the call script, calls `client.executeTransaction`, then `submitNewTransaction`, and the user gets a "Transaction submitted." toast. There's no chance to see what the call does, what it costs, or to back out.

Every other transaction in the app goes through the Create Transaction dialog (`components/transactions/create-transaction-dialog`), which executes, shows a **preview** (`TransactionEffects`: notes consumed and created, storage and vault changes, fees, nonce) and submits only on **Submit**. Invoke is the one path without it.

The cost of adding it is low: `invokeProcedure` already executes the transaction before submitting it, and `submitNewTransaction` executes it again through the SDK's `execute`. A preview shows the first execution's result, so no run is added.

## What changes for the user

Invoke on a state-changing procedure opens the Invoke Procedure dialog, which now has two steps:

1. **Arguments** (as today), skipped when the procedure takes none. Its button reads **Preview**.
2. **Preview**: the transaction's effects, with **Back** (when there were arguments), **Cancel** and **Submit**.

Submit does what Invoke did: submits, closes the dialog, shows the "Transaction submitted." toast with its "View on MidenScan" action.

A read-only procedure is unchanged: no dialog without arguments, the arguments dialog with them, its button still **Invoke**, its result in the row.

## Decisions (already made, don't reopen)

- **One dialog, two steps**, not a hand-off to the Create Transaction dialog: the title keeps the procedure's name, Back returns to the arguments with their values, and the toast stays the Invoke one. The preview body is shared (see step 3).
- **A procedure without arguments opens the dialog straight on the preview**, executing as it opens. No extra "Preview" click on an empty form.
- **No "skip the preview" setting.** One behaviour, the Create Transaction dialog's.
- **The row's button keeps the label "Invoke"** for every procedure. Tutorials, tooltips and specs name it.
- **The preview shows the first execution; Submit executes again** (`submitNewTransaction` → the SDK's `execute`), as the Create Transaction dialog does. If the account changed in between (a sync, another transaction), the submitted transaction can differ from the preview. Accepted, and the same as elsewhere: don't add a staleness check.
- **Who can invoke doesn't change**: `canInvokeProcedure` allows a state-changing Invoke only on a No Auth account, so no wallet is asked to sign, at the preview or at the submit.
- **The returned value isn't shown** in the preview (a transaction doesn't report it; the Simulate tab runs the procedure a second time as a program to get it). Out of scope.

## Impact on tutorials (plan for this first)

A state-changing Invoke is a step of four tutorials. Each has copy that says "click Invoke" and treats the click as the submission, and an e2e spec that does the same. All of them break or go stale.

| Tutorial                              | Step file                                      | Procedure         | Arguments | E2E spec                                        |
| ------------------------------------- | ---------------------------------------------- | ----------------- | --------- | ----------------------------------------------- |
| 6, interact with the counter contract | `interact-with-the-counter-contract/step5.tsx` | `increment_count` | none      | `tutorial-6-interact-with-the-counter-contract` |
| 7, deploy a counter contract          | `deploy-a-counter-contract/step6.tsx`          | `increment_count` | none      | `tutorial-7-deploy-a-counter-contract`          |
| 10, foreign procedure invocation      | `foreign-procedure-invocation/step5.tsx`       | `copy_count`      | one       | `tutorial-10-foreign-procedure-invocation`      |
| 12, contract verification             | `contract-verification/step7.tsx`              | `increment_count` | none      | `tutorial-12-contract-verification`             |

Not affected, but named here so nobody "fixes" them: tutorials 9 and 11 and the steps after the ones above (`deploy-a-counter-contract/step7.tsx`, `interact-with-the-counter-contract/step6.tsx`, `foreign-procedure-invocation/step6.tsx`, `network-transactions/step5.tsx`, `your-first-smart-contract-and-custom-note/step8.tsx`) only invoke `get_count`, which is read-only.

What to check for each of the four:

- **Copy.** The step must say that Invoke opens a preview, what the preview shows for this call (for the counter: the `count_map` storage change and the new nonce; for `copy_count`: the Count Reader's `count`), and to click **Submit**. Keep it short; follow `tutorial-copy.md` (labelled buttons as `<em>"…"</em>`, no desktop-only placement). Sentences like "Once the Transaction is submitted" stay true.
- **Completion.** Steps complete from app state (tutorial 10's `step5.tsx` looks for the transaction in `useTransactions().transactions`; read how the other three decide), not from the click. Confirm none completes on dialog open or on the preview: the user could cancel there.
- **The dialog and the tutorial panel together.** The dialog is non-modal (`modal={false}`, `data-modal="false"`), so the panel stays readable while it's open. On a phone the panel sits at the bottom: check the preview's Submit button isn't under it at 320 px (see step 8).
- **Tutorial 10** already uses the dialog for its argument: its copy says "Then click the Invoke button" inside the dialog. That button becomes **Preview**, followed by **Submit**.
- **Tutorial 12** asserts the "Transaction submitted." toast in its spec: keep the toast's text.

No test catches stale tutorial copy: after the change, grep `apps/web/components/tutorials` for `Invoke` and read every hit.

## Steps

### 1. Split `invokeProcedure` (`hooks/use-scripts.ts`)

Replace it with a function that only executes: `previewProcedure({ senderAccountId, script, procedureExport, procedureInputs })` returning `{ transactionRequest, transactionResult }`. It builds the request as today (`procedureCallScript`, `withCustomScript`, no foreign account declared: keep that comment) and calls `client.executeTransaction`. It must **not** dispatch `SUBMITTING_TRANSACTION`: nothing is being submitted, and that flag disables every Invoke button on the page.

Submission is `submitNewTransaction` from `hooks/use-transactions.ts`, unchanged, called by the preview step.

Remove `invokeProcedure` once nothing calls it (`procedures-table-row.tsx` and the dialog are its only callers).

### 2. Row (`components/account/procedures-table-row.tsx`)

A state-changing procedure always opens the dialog (`openInvokeProcedureArgumentsDialog`), with or without arguments. The row no longer executes or toasts for it, and no longer shows "ERROR" for a failed state-changing call: the dialog reports it. The read-only branches are untouched.

### 3. A shared preview form

`CreateTransactionPreviewForm` (`components/transactions/create-transaction-dialog/create-transaction-preview-form.tsx`) is the preview: `TransactionEffects` against the account in app state, and a submit handler. Make it usable by both dialogs without copying it:

- a `formId` prop (today `create-transaction-preview-form` is hardcoded and the dialog's Submit button targets it);
- an `onSubmitted(transactionRecord)` prop for the toast, so each dialog keeps its own ("Successfully created transaction." with its description there; "Transaction submitted." with the MidenScan action here).

Move it to `components/transactions/transaction-preview-form.tsx` if that reads better; update its two importers. Don't change what the Create Transaction dialog shows or says.

### 4. Dialog (`components/account/invoke-procedure-arguments-dialog.tsx`)

- Local state: `step` (`"arguments" | "preview"`), the `transactionRequest` and `transactionResult` of the preview, `loading`, and an `error` string. These are wasm objects: keep them in component state, as the Create Transaction dialog does, and drop them on close.
- **Read-only procedure**: exactly today's behaviour and labels.
- **State-changing, with arguments**: the form's submit runs `previewProcedure`, then shows the preview. Button: "Preview" / "Previewing…". On failure: `toast.error("Transaction failed.", …)` as today, and stay on the arguments.
- **State-changing, without arguments**: when the dialog opens, run `previewProcedure` once (an effect keyed on the dialog's open state and the procedure's digest; guard against a double run in React's strict mode). While it runs, show a spinner line ("Executing the transaction…"). On failure, show the error in the dialog with a **Retry** button next to Cancel: there's no form to go back to.
- **Preview step**: the shared form, Back (only when the procedure has arguments; it keeps their values), Cancel, Submit / "Submitting…". After a successful submit: the toast, then close.
- Title and description by step: "Invoke Procedure" / "Invoke a procedure with custom arguments." on the arguments; "Preview `<procedure name>`" / "Preview the outcome of this transaction, then submit it." on the preview. Keep the `callsForeign` sentence on the arguments step.
- The dialog's content needs the Create Transaction dialog's sizing classes (`max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto`): the preview's tables are wide and tall, and its comment there explains why.
- Closing at any step (Cancel, Escape) submits nothing and clears the state.

### 5. A failed execution

Today a state-changing call that fails shows "ERROR" in the row and nothing else (the message goes to the browser console). With the dialog, show the cleaned message (`cleanExecutionError`, `lib/utils/procedure-inputs.ts`) in the toast or the dialog. That's an improvement to keep, not a regression to avoid.

### 6. Unit tests

Nothing pure is added unless step 4 extracts a helper (which step to open on, which labels): if it does, test it under `apps/web/lib` or next to the component (`node --test`, see `apps/web/package.json`).

### 7. E2E

- `e2e/example.ts`: `invoke(page, procedure)` clicks the row's button and is used for both kinds. Add `invokeAndSubmit(page, procedure)`: click Invoke, wait for the preview dialog, assert it shows the effects (a "Storage changes" heading is enough), click Submit, wait for the dialog to close. Keep `invoke` for read-only calls.
- Update the callers that invoke a state-changing procedure: `tutorial-6…spec.ts:107`, `tutorial-7…spec.ts:129`, `example-counter-contract.spec.ts:33`, `tutorial-12…spec.ts:164` (keeps its toast assertion), and `tutorial-10…spec.ts:60–` (argument, **Preview**, then **Submit**).
- New assertions, in `example-counter-contract.spec.ts` (it needs no wallet): Cancel on the preview submits nothing (the count read back is unchanged, and no transaction was added); the preview shows the `count_map` change before Submit.
- One failing call, to cover step 5: in `tutorial-10`'s flow or `script`-free, pick whatever is cheapest. A `copy_count` given an account that isn't a counter fails at execution: the dialog stays on the arguments with an error toast. Skip it if it makes the spec slow or flaky, and say so in the PR.
- `e2e/mobile/mobile-sandbox.spec.ts` invokes `get_count` only: add a state-changing Invoke there and check the preview dialog with `expectWithinWidth` on Submit and `expectNoHorizontalOverflow` (helpers in `e2e/mobile/layout.ts`). It runs at 320 px in the `mobile-small` project.
- Specs that must keep passing untouched: `tutorial-9`, `tutorial-11`, `mainnet-network-counter` (read-only Invoke only; a network account has no state-changing Invoke).

### 8. Phone layout

Below 768 px the app has a phone layout (`phone-layout.md`). Check by hand at 320 px, inside tutorial 6 with the tutorial panel closed and open: the preview dialog scrolls, Submit is reachable, nothing overflows sideways. Run the three `e2e/mobile` projects.

### 9. Docs

- `docs/claude/read-only-procedures.md`: the Invoke button's two behaviours (a read-only call's result in the row; a state-changing call's preview, then Submit), and that a preview's execution dispatches nothing.
- `spec/editor-console-improvements.md`: under the Simulate item's follow-ups, the account page now previews before submitting; point here.
- This file's status line: implemented, then deployed with the PR number and commit once merged.

## How to run things

- Dev servers: `pnpm dev` in `apps/web` (port 3000) and `env -u DATABASE_URL pnpm dev` in `apps/api` (port 3001). The example and tutorial specs hang at "Launch example" without the API. Check whether they're already running before starting them (`lsof -ti tcp:3000`), and never kill a process you didn't start.
- E2E: `pnpm exec playwright test <spec> --project=chromium` in `apps/web`; the mobile projects are `mobile-safari`, `mobile-chrome`, `mobile-small`.
- Don't edit `apps/web` while a local Playwright run is going: the dev server's reload breaks the pages under test.
- The specs submit real testnet transactions through a remote prover, which times out now and then ("failed to prove transaction"). A failure with that message is the network: rerun before debugging.
- Tutorials 3, 4, 5, 8, 9 and 11 need Bread Wallet or Para and aren't touched by this change: don't run them unless a change reaches them.
- `pnpm lint` formats Markdown too: run `pnpm exec biome check --write` on any `.md` you edit.

## Checks before the PR

- `pnpm lint`, `pnpm typecheck`, unit tests in `apps/web` and `apps/api` (`pnpm test` in each).
- `vite build` in `apps/web`: the entry's static graph still imports nothing from `@miden-sdk/*` (the build fails otherwise).
- Local e2e, web on 3000 and API on 3001: tutorials 6, 7, 10 and 12, `example-counter-contract`, `example-miden-bank` (its deposit goes through the Create Transaction dialog, which shares the preview form now), `script-simulate`, and the `e2e/mobile` projects.
- By hand: the four tutorial steps read correctly from start to finish, on desktop and at 320 px.

## Rules for the implementer

- Branch from `main`; no worktree. Commit and push only when asked; open a PR only when asked; never merge (a merge deploys production).
- No "Co-Authored-By" or "Generated with" lines in commits or PRs.
- Never edit `packages/ui/src/components` (stock shadcn): layout goes in `className` at the call site.
- Leave `spec/upstream-sdk-issues.md` untracked.
- If a step turns out not to hold (a tutorial completes on something other than app state, the shared form can't serve both dialogs, the no-argument auto-run double-executes), stop and report instead of working around it.

## Out of scope

- The value a state-changing procedure returns, in the preview.
- A staleness check between preview and submit.
- State-changing Invoke on accounts with authentication (wallet-signed or multisig).
- Parameter names in the arguments form.
- Any change to the Create Transaction dialog's behaviour or wording.
