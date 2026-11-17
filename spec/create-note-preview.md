# Create Note dialog: preview the note's consumption, and typed note storage

Status: **implemented** (2026-11-17), not merged. Written for an agent that hasn't seen the discussion: everything needed is here or in the files named.

Checks (2026-11-17, SDK 0.17.10, local dev against testnet):

1. Passed: the connected Bread wallet as sender, the counter example's No Auth counter as recipient: `count_map` 0 → 1.
2. Passed: a network counter runs it locally, as a regular note and as a network note. No hint needed.
3. Not reachable from the dialog: the recipient combobox leaves the connected wallet out (unless it signs a multisig). An imported account would fail on `miden::protocol::auth::request`, with the existing hint.
4. As expected: before its height, `assertion failed with error code: 10154102372021603817` (the note's own `assert!`, no message, so no hint and no tutorial 8 sentence). At height 0 it succeeds, and the Test Wallet's vault gains 1 USDCX.
5. Passed: the wallet's USDCX in the note, the faucet loaded from the node.
6. Passed for the account and note tables. With an asset, executing caches the faucet's code (`accountCode`, `foreignAccountCode`), as any transaction with that asset does: no account or note is recorded.
7. Passed: the typed note's storage was the Test Wallet's prefix, suffix, then the height, tutorial 8's step 4 completed, and the Test Wallet consumed the note (height 0).

One PR, in the Playground only (`apps/web`, `docs`, `spec`). The API and api-compile don't change.

Read first: `docs/claude/simulation.md`, `tutorial-copy.md`, `phone-layout.md`, `ui-components.md`, `mainnet-sandbox.md`, `script-templates.md`.

## The problem

The Create Note dialog (`apps/web/components/notes/create-note-dialog.tsx`, opened from the notes page's "Add note" → "Create note") builds a custom note from a note script and sends the creating transaction to the connected wallet (Bread or Para) for signature. The user picks a recipient, a script, a note type, whether it's a network note, an optional asset, and the note's storage as a list of raw numbers.

The user sees nothing of what the note will do. A note's script only runs later, when the recipient consumes it. A wrong storage value, a missing asset or a recipient that lacks a procedure the script calls is discovered after the note is committed on the network, and paid for.

Two things already exist that close most of this gap:

- **The Simulate tab** of a note script (`components/script/simulate/target-simulation.tsx`, `hooks/use-target-simulation.ts`) runs the same scenario locally: `simulateNote` (`lib/simulation/run.ts`) builds a note from the script, feeds it as an unauthenticated input to a transaction on the target account, executes it without proving or submitting, and `SimulationResultDialog` shows the effects (`TransactionEffects`: notes consumed, storage and vault changes, fees, nonce). On a sandbox account it runs on the app's client and writes nothing to its store.
- **A note that already exists** gets a preview when it's consumed: Consume opens the Create Transaction dialog on its preview step.

So the only missing preview is before the note is created, in the dialog where the user is about to commit it.

The Simulate tab also types a note's storage from the package's note storage schema (an account picker for an account id, a bounded number for a `u32`…), while the Create Note dialog still takes raw felts. The same values would be entered two different ways in two places.

## What the user gets

```
+-- Create Note ------------------------------+
| Recipient account  [ Counter Contract    v] |
| Script [increment-note v]  Type [Public v]  |
| Note assets        [ Add note assets ]      |
| Note storage       typed fields, or felts   |
|  (a failed preview's reason shows here)     |
| [Cancel]      [Preview consumption] [Create]|
+---------------------------------------------+
        | click "Preview consumption"
        v
+-- Consumption preview of increment-note ----+
| Nothing was submitted: the note ran locally |
| as if Counter Contract consumed it now.     |
| 1 note will be consumed                     |
| Storage changes: count_map  0 -> 1          |
| New nonce: 4.                               |
|                                     [Close] |
+---------------------------------------------+
```

## Decisions (made with the owner, don't reopen)

- **An optional "Preview consumption" button** next to Create. Not a mandatory second step, and not an automatic inline panel. Create works exactly as today.
- **A preview that can't run explains itself in the dialog** and never blocks Create. Some previews fail for reasons that aren't the note's fault: a recipient whose key is in a wallet, a timelocked note previewed before its height.
- **Typed note storage comes to the dialog in this PR**, under the rules of the next section.
- **The preview runs on the app's client**, never the mock client: the recipient is a real sandbox account, and a sandbox account crashes the mock chain.
- **The preview is of the consumption only.** The creating transaction is signed by the wallet and isn't executed here.

## Typed note storage: do this part carefully

This is the risky half of the PR. The preview adds a button; the typed storage **changes what a user types to create a real note on a real network**, and what three tutorials tell them to do. A mistake here doesn't fail a simulation: it commits a note with the wrong storage, which may then be unconsumable, with its assets stuck in it.

### What must hold

1. **Same felts as before, in the same order.** For every script, the storage the dialog sends to `newNote` must be the felts the user would have typed by hand. The flattening is `noteStorageFelts` (`lib/utils/note-storage.ts`): an account id is its prefix then its suffix, a word its four elements, a `u64` its low then high 32 bits, other integers and a bool one felt. It was verified against the P2ID template for the Simulate tab. Verify it again here against a note that is actually created and consumed (check 7 below), not only simulated.
2. **Raw felts stay available, always.** Typed fields show only when the selected script has `metadata.noteStorage` and `noteStorageParams` can type every field. In every other case the dialog shows today's raw fields, unchanged:
   - a script compiled before api-compile returned schemas, including one in a **saved project** or a **tutorial run resumed** from before;
   - a schema with a field the form can't type (a record the note defines, an option, a variant);
   - a draft or a script whose last compile failed.
3. **An escape hatch from typed to raw.** A typed account field is a dropdown of the sandbox's accounts: the user can no longer enter an account id that isn't in the sandbox, which raw felts allowed. Add a "Enter as raw felts" toggle on the storage block, which switches to the raw fields (prefilled with the typed values' felts when they're valid). Without it, typing is a regression for that case.
4. **Nothing is typed silently wrong.** If a typed field is empty or invalid, Create and Preview are disabled (`noteStorageReady`), with the field's error shown. Today a missing raw item is caught by `required`.
5. **Changing the script resets the storage**, typed and raw. Stale values from another script's schema must not be sent.
6. **`newNote` keeps its signature** (`hooks/use-notes.ts`, `noteStorage: string[]`): the dialog flattens before calling it. Don't move the flattening into the hook or the client.
7. **One implementation.** Extract the Simulate tab's note storage block (typed or raw, with its hint listing the schema's fields) into `components/procedures/note-storage-fields.tsx` and use it in both places, so the dialog and the tab can't drift apart. It takes values and handlers, and knows nothing about what runs. The Simulate tab's own behaviour must not change: `e2e/script-simulate.spec.ts` covers it.

### The tutorials it reaches

No test catches stale tutorial copy. After the change, grep `apps/web/components/tutorials` for `note storage`, `Add note storage` and `Create Note`, and read every hit in full, on desktop and on a phone.

| Tutorial                           | Step file                                             | What it says today                                                                                                   | What changes                                                                                        |
| ---------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 8, timelock P2ID note              | `timelock-p2id-note/step4.tsx`                        | Click "Add note storage" three times; type the Test Wallet's Account ID prefix, then its suffix, then a block height | See below: this is the step that needs real work                                                    |
| 9, network transactions            | `network-transactions/step4.tsx`                      | "Don't add any note assets or note storage"                                                                          | With a schema the dialog shows "This note has no storage." and no "Add note storage" button: reword |
| 11, first contract and custom note | `your-first-smart-contract-and-custom-note/step6.tsx` | same sentence                                                                                                        | same                                                                                                |

**Tutorial 8, step 4**, in detail:

- The user's script is the P2ID template with a `timelock_height: Felt` field added in step 3 (`lib/utils/tutorial-code.ts`, `timelockEdits`). Compiled now, its schema has two fields: `target_account_id` (an account id) and `timelock_height` (a felt). The dialog then shows two typed fields instead of three raw ones.
- The copy must be rewritten for the typed fields: pick the Test Wallet in `target_account_id`, type the height in `timelock_height`. Keep the teaching point that is there today: the script checks the consuming account against this field, not against the recipient picked at the top, which only tags the note for the Test Wallet.
- The step currently prints the Test Wallet's prefix and suffix as numbers for the user to copy (`accountIdPrefix`, `accountIdSuffix`). With a typed field they aren't typed any more. Decide whether to keep them as an explanation of what an account id is made of, or drop them; don't leave an instruction to type them.
- **The step must also work with raw fields.** `useNoteScript` returns the user's script: a run resumed from before schemas existed, or a script whose schema can't be typed, shows raw felts. Branch the copy on what the dialog will show (the same condition the shared component uses, exported as a helper), with today's wording in the raw case. Don't assume the typed case.
- **The completion check must still pass.** `useCompleted` in `step4.tsx` reads the committed note's `storage[0]` and `storage[1]` as prefix and suffix and compares them to the Test Wallet's id. That only holds if the typed field flattens prefix then suffix. This is the real-network proof of rule 1: if the tutorial completes and the Test Wallet can consume the note in step 5 once the height passes, the order is right.
- The Test Wallet carries the Rust basic wallet so it can consume a Rust P2ID (`docs/claude/script-templates.md`). Nothing changes there, but it's why this tutorial is the right end-to-end check.

Other tutorial surfaces to confirm untouched: `lib/utils/tutorial-code.ts` and `e2e/mobile/mobile-tutorial-code.spec.ts` add code with buttons and stop before step 4's dialog; tutorials 6, 7, 10 and 12 never open this dialog.

### The specs it reaches

- `e2e/tutorial-8-timelock-p2id-note.spec.ts` (step "4. create the timelocked note"): it reads prefix, suffix and height from three `<strong>` numbers in the panel and fills `Note storage #0..2`. Both the panel's numbers and the fields change. Rewrite it to pick the Test Wallet in the typed field and type the height, and keep the rest of the tutorial (the note committed, then consumed after the height) as the proof.
- `e2e/tutorial-9-…spec.ts`, `e2e/tutorial-11-…spec.ts`, `e2e/mainnet-network-counter.spec.ts`, `e2e/example-miden-bank.spec.ts`: they create notes without storage or with an asset only. Run them; change only what the typed block changed.
- A raw-fallback case must be covered: a script without a schema still creates a note from raw felts. If no existing spec does it, strip `noteStorage` from a compile response with `page.route` in one step.

## Checks to run first (stop and report if one fails)

In the browser on the dev server, with a throwaway spec deleted afterwards (the previous simulation spikes did this: a spec that drives the UI, or `page.evaluate` importing a throwaway module).

1. **Sender differs from the consumer.** `simulateNote` builds the note with the target as its own sender. With the connected wallet as sender and a No Auth counter as recipient, the increment note still previews (count + 1).
2. **A network account as recipient** (tutorial 9's network counter, with the network-note switch on): does `executeTransaction` run locally on it? If not, record the error text: it needs its own explanation.
3. **A wallet whose key is in Bread or Para as recipient**: the run fails on `miden::protocol::auth::request`, and the existing hint in `targetErrorHint` applies.
4. **Tutorial 8's timelocked note** to the Test Wallet with a future height: the preview fails on the note's own assertion, because it runs at the current block. Record the error text. With a past height it succeeds and the vault gains the asset.
5. **A sandbox faucet's asset** (USDCx from the connected wallet) in the previewed note: the app's client loads the faucet from the node. Importing Testnet's public faucet makes later account checks stall for over a minute (`docs/claude/simulation.md`): use the wallet's own asset, don't import a faucet.
6. **Nothing is written**: the app store's account and note tables hold the same records before and after a preview (`networkStoreAccounts` in `e2e/script-simulate.spec.ts` shows how to count).
7. **Typed storage creates the same note.** Tutorial 8 end to end with the typed fields: the committed note's storage is prefix, suffix, height, and the Test Wallet consumes it. Do this before touching the copy.

## Implementation

### 1. Run (`lib/simulation/run.ts`)

- `simulateNote` gains optional `senderAccountId` (default: the target, as today), `noteType` (default `"public"`) and `isNetworkNote` (default `false`), passed to `clientCreateNoteFromScript`. The Simulate tab's call is unchanged.
- Extend `targetErrorHint` with what checks 2 and 4 found, if they need one. `docs/claude/simulation.md` explains how a bare kernel error code maps to its message.

### 2. Hook (`hooks/use-note-preview.ts`, new)

`previewConsumption(inputs)`: finds the script and the recipient in app state, calls `simulateNote` on the app's client through `enqueueSimulation` (`lib/simulation/simulation-client.ts`: simulations and the Simulate tab's target check share that queue), and returns `{ result, account }` like `runSandbox` in `hooks/use-target-simulation.ts`. Extract and reuse that function if it comes out cleanly; don't copy it.

### 3. Note storage block

As specified under "Typed note storage" above: the shared `note-storage-fields.tsx`, the raw fallback, the toggle, the reset on script change, the flattening in the dialog.

### 4. Dialog (`components/notes/create-note-dialog.tsx`)

- A secondary "Preview consumption" button between Cancel and Create, enabled under Create's conditions plus valid storage and amount. "Previewing…" with a spinner while it runs.
- Read the amount from state, not from `FormData` at submit, so both buttons use the same value.
- Success: open `SimulationResultDialog` (`components/script/simulate/simulation-result-dialog.tsx`). Give it optional `title` and `description` props, defaulting to today's text, instead of forking it. No "Apply" button here.
- Failure: the cleaned error (`cleanExecutionError`, `lib/utils/procedure-inputs.ts`) and its hint under the form, in an alert that a new preview or a field change clears, followed by: "This doesn't stop you from creating the note."
- One muted line near the button: the preview runs against the recipient's state now, at the current block, and the outcome can differ when the note is consumed.
- The dialog gets taller: give it the Create Transaction dialog's scrolling classes (`max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto`; the comment there explains them).
- Create's behaviour, labels and wallet flow don't change. The dialog stays non-modal (`modal={false}`), so a tutorial's panel stays readable beside it.

### 5. Tutorials

- The three steps of the table above.
- Add one sentence to tutorial 11's step 6 (a No Auth counter, where the preview works) inviting the user to click "Preview consumption" before Create. Not a gated step: the tutorial completes without it.
- Don't add it to tutorial 8 unless check 4 gives a message worth teaching (the timelock makes the preview fail by design). If it does, say so in the PR and propose the sentence; don't add it unasked.
- Follow `docs/claude/tutorial-copy.md`: one wording for desktop and phone, labelled buttons as `<em>"…"</em>`, no placement that only holds on desktop.

### 6. E2E

- The spec changes listed under "The specs it reaches".
- `e2e/tutorial-11-…spec.ts`: before Create, click "Preview consumption", assert the dialog shows the `count_map` change and has no Submit, close it, then create as today. Assert the store's record counts are unchanged by the preview.
- A failed preview (a wallet-held recipient, or a recipient without the procedure): the reason shows in the dialog and Create is still enabled.
- `e2e/mobile`: the dialog at 320 px with typed fields and with the preview open (`expectWithinWidth`, `expectNoHorizontalOverflow` in `e2e/mobile/layout.ts`).

### 7. Unit tests

Whatever is extracted as pure (which storage mode a script gets, the typed-to-raw conversion for the toggle, the reset) under `apps/web/lib`, with `node --test`. `lib/utils/note-storage.ts` already has tests: extend them, don't duplicate.

### 8. Docs

- `docs/claude/simulation.md`: the Create Note preview (app's client, sender, what it can't tell) and the shared note storage fields with their fallback rules.
- `spec/editor-console-improvements.md`: a line under the Simulate item.
- This file's status line: the checks' results, then implemented, then deployed with the PR number.

## What a preview can't tell (say it in the docs, don't build it)

- Whether the sender can fund and pay for the note.
- The state at consumption time.
- A recipient the sandbox doesn't track, or whose key isn't in the Playground.

## How to run things

- Check `git status` first. On 2026-11-16 the tree was on `feat/simulate-foreign-sandbox-disabled` with uncommitted changes that aren't this work, in `procedure-arguments-form.tsx` and `select-account-dropdown-menu.tsx`, which this plan also uses. Start from `main` once that has landed; if the tree isn't clean, stop and ask.
- `spec/simulate-assets.md` (approved, not started) turns a note's single asset into a list. Whichever lands second adapts the dialog's asset rows.
- Dev servers: `pnpm dev` in `apps/web` (port 3000) and `env -u DATABASE_URL pnpm dev` in `apps/api` (port 3001). Check whether they're already running (`lsof -ti tcp:3000`); never kill a process you didn't start.
- E2E: `pnpm exec playwright test <spec> --project=chromium` in `apps/web`. Tutorials 8, 9 and 11 need Bread Wallet: `e2e/README.md` and `pnpm bread-wallet`. The mobile projects are `mobile-safari`, `mobile-chrome`, `mobile-small`.
- Don't edit `apps/web` while a local Playwright run is going: the dev server's reload breaks the pages under test.
- The specs submit real testnet transactions through a remote prover, which times out now and then ("failed to prove transaction"): rerun before debugging.
- `pnpm lint` formats Markdown too: run `pnpm exec biome check --write` on any `.md` you edit.

## Checks before the PR

- `pnpm lint`, `pnpm typecheck`, `pnpm test` in `apps/web` and `apps/api`.
- `vite build` in `apps/web`: the entry's static graph still imports nothing from `@miden-sdk/*` (the build fails otherwise).
- Local e2e, web on 3000 and API on 3001: tutorials 8, 9 and 11 in full, `example-miden-bank`, `script-simulate`, and the `e2e/mobile` projects. `mainnet-network-counter` spends real funds: run it only if asked.
- By hand, on desktop and at 320 px: tutorial 8's step 4 read from start to finish against the dialog, in the typed case and in the raw case; tutorials 9 and 11's steps; a preview with a Bread wallet as recipient; Create after a failed preview.

## Rules for the implementer

- Branch from `main`; no worktree. Commit and push only when asked; open a PR only when asked; never merge (a merge deploys production).
- No "Co-Authored-By" or "Generated with" lines in commits or PRs.
- Never edit `packages/ui/src/components` (stock shadcn): layout goes in `className` at the call site.
- Leave `spec/upstream-sdk-issues.md` untracked.
- If a rule under "What must hold" can't be met, or tutorial 8 doesn't complete with the typed fields, stop and report. Don't ship the preview with a half-working typed storage: the two can be split, preview first, if the typing turns out harder than planned. Say so instead of deciding alone.

## Out of scope

- Previewing the creating transaction on the sender.
- A mandatory preview step, or an inline automatic one.
- Several assets per note (`spec/simulate-assets.md`).
- A note argument in the Create Note dialog.
- Previewing on a simulated account from this dialog: that's the Simulate tab.
- Typed fields for schema types the form can't type today.
