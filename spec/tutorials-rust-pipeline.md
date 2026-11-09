# Tutorials on the real Rust compilation pipeline

Status: plan, written 2026-11-06. PR A merged as #779, PR B as #781 and PR C
as #782 (2026-11-08), PR D as #784 and PR E as #785 (2026-11-09), F not
started.
One PR per item below, in the order given; the tutorial PRs (B to E) are
independent of each other once A has landed, so different agents can pick
them up.

Four tutorials show Rust code to the user but never compile it. Tutorials 7
("Deploy a counter contract") and 8 ("Timelock P2ID note") create and
"compile" their scripts through `apps/web/lib/mock-api.ts`, which hands back a
hand-written MASM program after a one-second sleep. Tutorials 6 ("Interact
with the counter contract") and 9 ("Network transactions") seed their state
with built-in scripts that are MASM programs with a Rust source attached
(`lib/types/default-scripts/counter-contract.ts`, `counter-note.ts`,
`counter-script.ts`). All four deploy and run MASM assembled in the browser,
and the "Compile" button of 7 and 8 can't fail. The mock dates from when the
Rust compiler wasn't stable. It is now: compiling a template through the local
API and api-compile took 0.5 to 1.7 s on 2026-11-06, and production compiles
in about 2.7 s warm, 6 s after the compile container wakes up (measured
2026-11-03, see `docs/claude/project-template-lockfile.md`).

The goal is that every tutorial creates, compiles, deploys and runs real Rust
packages (MASP), the way tutorials 10, 11 and 12 and the sandbox already do,
and that `mock-api.ts` and the MASM counter built-ins go away. Tutorial 10
("Foreign procedure invocation") made that move in PR #640 and is the model:
its state embeds a compiled `counter-account` package and its component, its
copy points at Rust lines, and its completion checks read storage by slot
name.

## What the migration changes under the hood

Read `docs/claude/script-editor.md`, `script-templates.md`, `examples.md`,
`read-only-procedures.md`, `tutorial-copy.md` and `saved-projects.md` before
starting. The facts below were checked on 2026-11-06 against the local API
(`pnpm dev` in `apps/api`, api-compile and api-registry containers up) and the
installed SDK (`@miden-sdk/miden-sdk` 0.17.8, `miden` crate 0.15).

- **Templates, not built-ins.** `POST /scripts` creates a script from
  `apps/api/templates/<example>.rs`. The Rust the mock showed for the P2ID
  note (`lib/types/default-scripts/p2id.ts`) is not the template
  (`templates/p2id-note.rs`): the template declares the note's inputs as
  struct fields, exports a `#[note_constructor]`, and names its entry point
  `script`. The counter template (`templates/counter-account.rs`) matches the
  mock's Rust apart from comments, so line references shift.
- **Script ids are UUIDs.** The mock's ids were `<example>_<uuid>`, and
  tutorials 7 and 8 find their script with `id.startsWith("counter-account_")`.
  Use `!defaultScriptIds.includes(id) && type === "…"` as tutorials 11 and 12
  do.
- **Storage slot names derive from the script name.** A component's slot is
  `<script name>::<snake(trait)>::<field>` (`storageSlotName` in
  `lib/utils/component.ts`, confirmed in the package metadata: a script named
  `my-counter` has `my_counter::counter_contract::count_map`). The script
  name isn't split into words: only its characters outside `[A-Za-z0-9_]`
  become `_`, so `counter2` gives `counter2::…` and `counter-v2`
  `counter_v2::…` (`derive_storage_slot_name` in miden-base-macros 0.15;
  found in PR C, where `storageSlotName` still applied `snakeCase` to it and
  returned `counter_2::…`). Before PR C, tutorial 7 had the user type
  `counter_contract::counter_contract::count_map` whatever the script was
  called: that slot would never be read.
- **Procedure digests depend on the package name** too (`my-counter`'s
  `get-count` differs from `counter-account`'s), so nothing can hard-code
  them: `COUNTER_CONTRACT_*_PROC_HASH`, `COUNTER_NOTE_RUN_PROC_HASH` and
  `COUNTER_SCRIPT_RUN_PROC_HASH` in `lib/constants.ts` only describe the MASM
  built-ins.
- **The MASM tab shows the compiler's output** for scripts compiled through
  the API (an embedded package carries none, see PR A): 1,878 lines for the counter,
  with `get-count` and `increment-count` wrapping an `init` and WASM-lowered
  procedures. A step-by-step MASM walkthrough (tutorial 6, step 3) and the
  claim that the MASM tab shows the new increment as `add.5` (tutorial 7,
  step 2) are both false for compiled code: the constant is not visible as
  `add.5` or `push.5` anywhere in the output.
- **Read-only procedures come from api-compile** (`readOnly` on each export):
  `get_count` is `true`, `increment_count` `false`, a note's entry point
  `null`. Nothing to set by hand.
- **A note's entry point is the export marked `note_script`.** Exports carry
  `attributes.attrs`, e.g. `[{ "Marker": "note_script" }]` or
  `[{ "Marker": "account_procedure" }]`. The note script root of a compiled
  note equals that export's digest (checked with `NoteScript.fromPackage` on
  the compiled P2ID template and on the example's `increment-note`). Two
  places assume otherwise: `verifyStandardNotes` in `lib/web-client.ts` takes
  `procedureExports[0]`, which for the P2ID template is `build-recipient`,
  and `scriptIdToProcedure` in `components/accounts/deploy-account-dialog.tsx`
  looks for an export named `run`, which the P2ID template calls `script`.
- **The 0.15 SDK has no `tx::get_block_number`.** The mock's P2ID Rust and
  tutorial 8's snippets call it; the API is `tx::get_reference_block_number()
  -> BlockNumber`, with `as_felt()`, `as_u32()` and `PartialOrd`.
  `BlockNumber` doesn't implement `FromFeltRepr`/`ToFeltRepr`, so a note
  input holding a height must be a `Felt`. This variant of the template
  compiles (0.9 s):

  ```rust
  use miden::{account, felt_repr::ToFeltRepr, note, tx, AccountId, Felt, Recipient, Word};

  #[note]
  struct P2idNote {
      target_account_id: AccountId,
      timelock_height: Felt,
  }

  // in build_recipient: a `timelock_height: Felt` parameter, set in the struct literal

  #[note_script]
  pub fn script(self, _arg: Word, account: &mut Wallet) {
      let block_number = tx::get_reference_block_number();
      assert!(block_number.as_felt() >= self.timelock_height);

      let current_account = account.get_id();
      assert_eq!(current_account, self.target_account_id);
      // …
  }
  ```

- **Note inputs follow the struct's felt representation.** `AccountId` derives
  `ToFeltRepr` with fields `prefix` then `suffix` (`miden-base-sys`
  `bindings/types.rs`), the reverse of the MASM P2ID layout (suffix, prefix)
  the current copy teaches. With the struct above, the Create Note dialog's
  storage items are prefix, suffix, timelock height. Confirmed on testnet in
  PR D: a note with those items and height 0 passes both assertions, and one
  with a future height fails the first.
- **A compiled note calls the Rust basic wallet, not the standard one** (found
  in PR D). `#[account(basic_wallet::BasicWallet)]` binds the note script to
  the `basic-wallet` package the API compiles it against
  (`templates/basic-wallet.rs`, `lib/default-dependencies.ts`), and the script
  calls `receive_asset` by that package's MAST root (`0x086e7fa3…`). The
  standard basic wallet, which the SDK's wallets, Bread and Para carry, has
  another one (`0xd7416b79…`), and the 0.15 SDK has no binding to it. So a
  standard wallet can't consume a note built from the P2ID template: the
  transaction fails with "procedure with root digest … could not be found".
  An account deployed with the compiled `basic-wallet` component can (checked
  on testnet: +1 USDCX). The web app's built-in `basic-wallet` script is the
  standard one with that Rust source attached, like the MASM counters were.
- **Deploy, invoke, create note already handle packages.** `lib/web-client.ts`
  branches on `assembledFromMasm`: `AccountComponent.fromPackage` for deploys,
  `TransactionScript.fromPackage` / `NoteScript.fromPackage` for scripts, and
  `readWord` in `hooks/use-transactions.ts` links the package as a library for
  local reads. Tutorials 10 to 12 exercise all of it.
- **Precompiled packages exist for the counter pair.**
  `apps/api/examples/counter-contract/compiled.json` holds `counter-account`
  (commitment `0xb76d0a37…`, the same source as `templates/counter-account.rs`)
  and `increment-note` (the counter note, `run` entry point, 562 KB of base64
  because a note's MASP embeds its dependencies). `POST
  /scripts/examples/counter-account` inserts both without compiling; the
  Mainnet sandbox starts from them (`lib/utils/mainnet-sandbox.ts`). Tutorial
  10's state embeds the same `counter-account` package by hand (20 KB).
- **Importing an account recognizes built-in components only.**
  `verifyStandardAccountComponents` matches the account code's procedures
  against `defaultScripts`; for tutorial 6, `importAccountByAddress` in
  `hooks/use-accounts.ts` hard-codes the counter's components when the
  address matches. The account page separately asks the registry for
  verified components (`getVerifiedAccountComponents`), which needs the
  account to have been verified, and still doesn't let the user invoke them
  without the script in state.
- **Deploying from a tutorial skips registry verification** (`verify &&
  !tutorialId` in `deployAccount`), so a thousand tutorial counters don't
  pile up in the registry. Keep that.
- **The e2e and unit tests encode the mock.** `e2e/tutorial-7-…`,
  `e2e/tutorial-8-…` and `e2e/mobile/mobile-tutorial-code.spec.ts` run without
  the API ("compile through local mocks"), `e2e/README.md` says so, and
  `lib/utils/tutorial-code.test.ts` applies tutorial 8's edits to the mock's
  Rust. After the migration every tutorial spec needs `apps/api` on port 3001
  with the compile service (CLAUDE.md: run it on port 3001 next to the web
  app), and the unit test must read `apps/api/templates/p2id-note.rs`
  like it already reads `counter-account.rs` for tutorial 12.
- **Two counters live on testnet** (before PR B). Tutorial 6 imports the MASM
  value-slot counter at `TESTNET_COUNTER_CONTRACT_ADDRESS`
  (`mtst1aqv9d02w5qvzfyfg87rg6penkg2fgqyc_qr7qqq9wr6w`); tutorial 10 reads the
  MASP map counter `0x7240e428d9f88611442761fe8f572b`
  (`mtst1apeypepgm8ugvy2yyaslar6h9vdvwmz4_qr7qqq9wr6w`, hard-coded in its
  `state.ts`), an instance of the `counter-account` package. Both are gone
  after a testnet reset, like today. PR B replaced both with one
  `counter-account` instance deployed on 2026-11-08
  (`0xe564fdf28c41655101fa9601b7530c`,
  `mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv_qr7qqq9wr6w`, in `lib/constants.ts`).

## Decisions

- **One counter package everywhere: `counter-account`** (map slot, key `1`),
  the template, the example and tutorials 10 to 12 already use. Tutorial 6
  reads it, tutorial 7 customizes it, tutorial 9 deploys it as a network
  account. The value-slot variant (`default-scripts/counter-contract.ts`)
  disappears with the MASM built-ins. Tutorial 7's "unlike the previous
  tutorial's value slot" framing becomes "the same contract, now yours to
  change". The alternative, compiling the value-slot Rust into a second
  package so 6 and 7 keep differing, costs a second embedded package and a
  second deployed account for a distinction the tutorials don't need.
- **A new testnet counter for tutorial 6, shared with tutorial 10.** Deploy a
  fresh `counter-account` instance (procedure in PR B), point
  `TESTNET_COUNTER_CONTRACT_ADDRESS` and a re-enabled
  `TESTNET_COUNTER_CONTRACT_ACCOUNT_ID` at it, and have tutorial 10's state
  use those constants instead of its own. Same package, one place to update
  after a reset. The old MASM counter is abandoned.
- **Seeding compiled packages into a tutorial's state.** Static embed for the
  account package (20 KB, as tutorial 10 does), in one shared module used by
  tutorials 6 and 10, with a unit test that its commitment and digests match
  `compiled.json` so an SDK bump that regenerates the snapshots can't leave it
  stale. The note package (562 KB) is fetched: tutorial 9 gets a `starter`
  that calls `POST /scripts/examples/counter-account`, like the Mainnet
  sandbox. Tutorial 9 then needs the API to start, as 10, 11 and 12 already
  do to progress.
- **Tutorial 7 doesn't force a script name.** The copy shows the slot name
  computed from the user's script name (`storageSlotName`) and explains why,
  which teaches the derivation. Tutorials 11 and 12 keep forcing theirs.
- **Entry points are found by the `note_script` / `transaction_script`
  marker** (`entryPointExport`), with `run` as the fallback for packages
  stored before api-compile reported attributes, then the first export (the
  built-ins).
- **No new precompiled example or API route.** The counter example's packages
  cover tutorial 9; nothing new goes into the Worker bundle (see the size note
  in `examples.md`).
- **Tutorial 8's Test Wallet carries the Rust basic wallet** (decided in PR D,
  once the fact above was found). Otherwise the note the user creates could
  never be consumed, timelock or not. The compiled `basic-wallet` package is
  embedded in the web app (15 KB of masp, `lib/tutorials/basic-wallet.json`),
  in the tutorial's starting state with its component, and step 3 deploys the
  Test Wallet with it (No Auth, not funded). `pnpm templates:check` compiles
  the template again and fails when the snapshot is out of date;
  `pnpm templates:sync` regenerates it. The alternatives were a tutorial
  whose note nobody can consume, or leaving tutorial 8 on the mock until the
  compiler can target the standard wallet.

## PR A: shared plumbing

Everything the four tutorial PRs need from the app, with no tutorial change
yet. Small, reviewable on its own; every tutorial still passes.

1. `verifyStandardNotes` (`lib/web-client.ts`) and `scriptIdToProcedure`
   (`deploy-account-dialog.tsx`): pick the export whose
   `attributes.attrs` has `{ Marker: "note_script" }` (or
   `"transaction_script"`: the dialog resolves both allowlists), else the one
   named `run`, else the first. Put the lookup in `lib/utils/script.ts`
   (`entryPointExport(script)`) and use it in both. Check that a note created
   from the real P2ID template in a sandbox shows its script in the notes
   table.
2. `verifyStandardAccountComponents` (`lib/web-client.ts`): match against the
   workspace's compiled scripts, not `defaultScripts` only, and let
   `wasmAccountToAccount` callers pass the workspace's scripts and components
   (`account.components` holds component ids, found through `scriptId`).
   Importing an account whose code holds a package's procedures then lists
   that component, which lets PR B delete the
   `interact-with-the-counter-contract` special case in
   `importAccountByAddress`.
3. `Tutorial.starter?: () => Promise<Pick<State, "scripts" | "components">>`
   (`lib/types/tutorial.ts`). `enterTutorial` (`hooks/use-tutorials.ts`)
   awaits it when building `freshState` (fresh start and the resume
   fallback, not the resumed state itself, whose scripts are saved) and
   appends its scripts and components to the tutorial's. On failure, a
   warning toast like `sandboxStarter`'s in `hooks/use-app-state.ts`, and the
   tutorial still opens. Factor the import out of `mainnetSandboxStarter`
   (`lib/utils/mainnet-sandbox.ts`) so both use one
   `counterExampleStarter({ componentName })`.
4. `apps/web/lib/tutorials/counter-account.ts`: the compiled `counter-account`
   script (`masp`, `commitment`, `procedureExports` with `readOnly`; not the
   compiler's `masm`, which stays out of the bundle, so the MASM tab of an
   embedded script is empty, as tutorial 10's is today) and its "Counter
   Contract" component (map slot `1:0`), lifted from
   tutorial 10's `state.ts`, which then imports it. Fields come from
   `apps/api/examples/counter-contract/compiled.json`. A `node --test` next to
   it (see `tutorial-code.test.ts` for the pattern) reads that JSON and asserts
   the commitment and each export digest match. Add the regeneration reminder
   to `docs/claude/examples.md`: after `pnpm examples:compile`, update this
   module (the test fails otherwise).
5. `apps/api/scripts/check-templates.ts`: also compile the tutorials' edited
   sources, so an SDK bump that breaks a snippet (as `tx::get_block_number`
   did) fails `pnpm templates:check`: import `increaseIncrementEdits` and
   `resetCountEdits` from `../../web/lib/utils/tutorial-code.ts`, apply them
   to the created script's source, compile. `timelockEdits` joins in PR D,
   once it anchors on the P2ID template. Document it in
   `docs/claude/script-templates.md`.

Verify: typecheck, lint, unit tests, `pnpm templates:check`, tutorials 10, 11
and 12 e2e, the Mainnet sandbox still starts with its two scripts (manual, or
the mainnet spec if funds allow).

## PR B: tutorial 6, "Interact with the counter contract"

Deploy the new counter first, from production so it's verified and funded:

1. On <https://playground.miden.xyz>, launch the "Counter Contract" example.
   It auto-deploys a public No Auth account with the `counter-account`
   component (`exampleId` auto-deploy in `components/lib/network-badge.tsx`),
   verifies it in the registry and funds it.
2. Open the account, copy its ID and address, invoke `increment_count` once
   to check it works. Record both in `lib/constants.ts`
   (`TESTNET_COUNTER_CONTRACT_ACCOUNT_ID`, uncommented, and
   `TESTNET_COUNTER_CONTRACT_ADDRESS`). Note the date next to them: a
   testnet reset means redoing this.

Then the tutorial (`components/tutorials/interact-with-the-counter-contract`):

- `state.ts`: replace `counterContractScript` / `counterContractComponent`
  (`counter-value-contract`) with the shared `counter-account` script and
  component from PR A, ids `counter-account` as tutorial 10 has them. No
  pre-imported account: importing it is what the tutorial teaches.
- Step 1: open the `counter-account` row (`/scripts/counter-account`).
- Step 2: the map-slot explanation from tutorial 7's current step 2
  (`count_map`, fixed key `[1, 0, 0, 0]`), with the template's lines: storage
  13-18, `get_count` 33-38, `increment_count` 40-50. Re-count against
  `templates/counter-account.rs` before shipping.
- Step 3: drop the MASM walkthrough. Either remove the step (then `stepCount`
  in `components/tutorials/meta.ts`, the e2e and the next step's "In the
  previous step" wording) or turn it into "Explore the compiled package"
  around the Manifest tab, which lists the exports with their digests and
  whether they only read state. The embedded script carries no MASM (PR A:
  the compiler's output stays out of the bundle), so its MASM tab is empty
  and the step can't lean on it. Recommended: the second, since the step
  count and the e2e then barely change.
- Step 4: unchanged flow, new address. Delete the special case in
  `importAccountByAddress` (PR A's digest matching lists `auth-no-auth`,
  `basic-wallet` and `counter-account` from the account code).
- Steps 5 and 6: unchanged. `get_count` is read-only from api-compile, so it
  runs locally as before; `increment_count` submits a transaction.
- Tutorial 10: `state.ts` reads the account ID and address from the constants
  (same package, same component), and its copy still holds.
- `e2e/tutorial-6-…spec.ts`: `/scripts/counter-account`, the step 3 change.
  `e2e/tutorial-10-…spec.ts` should pass unchanged.
- Grep `apps/web/components/tutorials` for "value slot", "counter-contract"
  and "add.1": tutorial 7's step 1 and 2 refer to tutorial 6 and change in PR
  C, but tutorial 9's step 1 ("the same code as the counter contract from a
  previous tutorial") and 11's step 2 ("the same one you deployed in Deploy a
  counter contract") must still read true.

Verify: tutorials 6 and 10 e2e against local, then a manual run of 6 on the
production build (`docs/claude/vite-build.md`) once deployed, since the
account is production's.

## PR C: tutorial 7, "Deploy a counter contract"

`components/tutorials/deploy-a-counter-contract`, now creating through the
API:

- `lib/api.ts` `createScript`: add `"deploy-a-counter-contract"` to the
  tutorials that reach the API.
- Every `useScript`/`useCompleted`: find the script with
  `!defaultScriptIds.includes(id) && type === "account-component"`, the
  component by `scriptId === script.id`. Step 2's check becomes
  `script.status === "compiled" && incrementValue(source) > 1` (`masm` can
  be empty when api-compile can't return it, see `script-editor.md`).
- Step 1: "In the previous tutorial you interacted with a counter contract…
  now build your own from the same code". Keep the name free.
- Step 2: the template's lines (13-18, 33-38, 40-50; the increment at line
  46), "the same contract as the previous tutorial", and drop the sentence
  about the MASM tab showing `add.5`. The console shows the compile's result
  instead (`COMPILED` in `e2e/editor.ts`). A failed compile is now possible:
  say that the console shows rustc's errors and that the button fixes the
  code.
- Step 4: show the slot name computed from the script:
  `storageSlotName({ packageName: script.name, traitName: "CounterContract",
  fieldName: "count_map" })`, with the copy button, and explain the
  `<script>::<trait>::<field>` derivation; "you can find it in the MASM tab's
  `COUNTER_SLOT` constant" is false for compiled code and goes. Completion:
  one map slot with that exact name and a `1:` entry.
- Steps 5 to 7: unchanged flow. Step 7's "increased by the increment value
  you set" still holds.
- `lib/utils/tutorial-code.ts`: `increaseIncrementEdits` already anchors on
  `current_value + felt!(1)`, which the template has. Its test reads
  `counter-map-contract.ts`: read `../../../api/templates/counter-account.rs`
  instead (already loaded for tutorial 12).
- `e2e/tutorial-7-…spec.ts`: script URL `/scripts/<uuid>`, `SLOT_NAME`
  derived from the script name (`my_counter::counter_contract::count_map`),
  no MASM `add.5` check, needs the API and compile service (update the header
  comment and `e2e/README.md`). `e2e/mobile/mobile-tutorial-code.spec.ts`:
  the tutorial 7 test compiles for real now; same README line.

Verify: tutorial 7 e2e (chromium) and the mobile spec on `mobile-safari` and
`mobile-chrome`, `pnpm templates:check` (PR A compiles the edited source).

## PR D: tutorial 8, "Timelock P2ID note"

The most copy. `components/tutorials/timelock-p2id-note`, against
`templates/p2id-note.rs` (48 lines). As built, it differs from the list below
in five places:

- The tutorial never ran the user's script: `newNote` in `hooks/use-notes.ts`
  created a standard P2IDE note (`Note.createP2IDENote`) whenever the tutorial
  was active, whatever script the dialog had selected, and
  `components/note/note-information.tsx` showed three of its four storage
  items. Both special cases are gone: the note is built from the compiled
  package, like any custom note.
- The Test Wallet is an account deployed with the Rust basic wallet (see the
  decision above), not a standard wallet: `deployAccount` gained `fund:
  false`, which leaves it off chain as `newWallet`'s did. Step 2 explains
  lines 7-10 and links to the `basic-wallet` script.
- Step 3 has four snippets, not three: the imports have their own, after the
  field that needs them. The steps cite a line number only where no earlier
  snippet moves it (5 and 14), and name the place otherwise.
- Step 5 has the user try "Consume note with Test Wallet", which fails on the
  assertion until the height is reached, and the e2e checks it: that failure
  shows the note runs the user's code.
- A run started before this PR has a mock script (`p2id-note_<uuid>`), no Rust
  basic wallet in its state and maybe a standard Test Wallet. It can't be
  brought up to date: steps 1, 3 and 4 offer to restart the tutorial
  (`outdated-run-alert.tsx`, which tells such a run by the missing
  `rust-basic-wallet` script). PR F removes it.

- `lib/api.ts` `createScript`: add `"timelock-p2id-note"`.
- Step 1: unchanged flow. "Creating a custom note is a two-step process" still
  holds. The note storage paragraph: a note's inputs are the fields of its
  `#[note]` struct, serialized to felts; an `AccountId` takes two.
- Step 2: rewrite for the template. `P2idNote` holds `target_account_id`
  (lines 12-15); `build_recipient` (29-36) is a `#[note_constructor]` other
  scripts call to build the note's recipient, which the Playground's Create
  Note dialog does itself from the storage items; `script` (38-47) is the
  `#[note_script]` entry point: it compares the consuming account's ID with
  the target and receives the assets. Re-count the lines.
- Step 3: the timelock, as three snippets with "Add to my script" buttons,
  from the variant verified above:
  1. the `timelock_height: Felt` field, with `Felt` and `tx` added to the
     `use miden::{…}` line;
  2. the constructor: a `timelock_height: Felt` parameter and the field in
     the struct literal (explain in one sentence: the constructor builds the
     inputs, so it needs the new one);
  3. in `script`, before the account check: `let block_number =
     tx::get_reference_block_number();` and
     `assert!(block_number.as_felt() >= self.timelock_height);`.
     Rewrite `timelockEdits` in `lib/utils/tutorial-code.ts` with anchors on the
     template (`applied` regexes are the completion check, as today) and its
     test on the template file. Completion: `status === "compiled"` and every
     edit applied. Keep the Test Wallet creation on Next.
- Step 4: storage items are prefix, suffix, timelock height, in that order
  (the struct's felt representation). Completion: the note's `scriptId` is the
  user's script (PR A makes the match), `storage[0]`/`storage[1]` form the
  Test Wallet's ID, committed, public. `P2IDE_NOTE_CODE` goes.
- Step 5: unchanged. Optional: add that trying "Consume note with Test
  Wallet" fails while the timelock holds, which is a visible check of the
  assertion.
- Before writing the copy, confirm the storage order: compile the finished
  script in a sandbox, create a note for a wallet with height `0`, consume it
  with that wallet. If it only consumes with suffix first, the derive order
  isn't what `bindings/types.rs` suggests; fix the copy, not the code.
- `e2e/tutorial-8-…spec.ts`: URL regex, the three `replaceInEditor` calls
  against the template, the panel's three `strong` numbers in the new order,
  API and compile service required. Mobile spec: the buttons' labels and the
  `waitForEditorText` strings.

Verify: tutorial 8 e2e with Bread (`pnpm bread-wallet`), the mobile spec,
`pnpm templates:check`.

## PR E: tutorial 9, "Network transactions"

`components/tutorials/network-transactions`. As built, it differs from the
list below in five places:

- The starter's scripts are read-only (`counterExampleStarter({ readOnly:
  true })`), as the MASM built-ins were. The steps only read them, and a
  counter compiled again from other code would no longer have the procedures
  the note calls: the network transaction would fail, with nothing to show
  for it in the Playground.
- The steps find the scripts by name (`use-network-counter.ts`), their ids
  being the API's UUIDs, and the component by its script.
- A run without the scripts gets a "Restart tutorial" alert on steps 1 to 4
  (`missing-scripts-alert.tsx`). That's a run started while the API was down:
  the toast goes away, a resumed run keeps the scripts it was saved with, and
  the Deploy dialog then has no component to select. It's also a run started
  before this PR, which holds the MASM built-ins (`counter-value-contract`)
  and can't follow the new copy. PR F removes that second case.
  `e2e/tutorial-9-missing-scripts.spec.ts` covers the first.
- Step 1 says again that the counter uses the same code as a previous
  tutorial's (PR B had loosened it). Step 3 also cites lines 13-15, which bind
  the note to the `counter-account` package, and links to that script.
- Step 5 has both: `get_count`'s Invoke, then the map entry. The e2e ends on
  `get_count` returning 1.

- `index.ts`: `starter: () => counterExampleStarter({ componentName: "Counter
  Contract" })` (PR A). `state.ts` drops the three built-ins and the
  `counter-value-contract` component; the starter brings `counter-account`,
  `increment-note` and the component. `counter-script` has no step and goes.
- Step 2: "the `counter_account::counter_contract::count_map` storage slot
  with its default value `1:0`", "select `increment-note` as the allowed note
  script". Completion: the allowlist entry's key equals the `increment-note`
  script's note-script digest from state (`entryPointExport`), value
  `0x01…`; `COUNTER_NOTE_RUN_PROC_HASH` goes.
- Step 3: `increment-note` script, `run` at lines 22-29 of
  `apps/api/examples/counter-contract/increment-note/src/lib.rs` (re-count),
  same three bullets.
- Step 4: "select the `increment-note` script".
- Step 5: read the count with `get_count`'s Invoke (read-only procedures run
  locally on network accounts too, `read-only-procedures.md`), or the map
  entry under key `1`. The slot name changes.
- The Mainnet spec (`e2e/mainnet-network-counter.spec.ts`) already drives this
  exact pair as a network counter, so the path is proven.
- `e2e/tutorial-9-…spec.ts`: `increment-note` in the allowlist and the Create
  Note dialog; the spec now needs the API (precompiled, no compile service).
  `e2e/README.md`.

Verify: tutorial 9 e2e with Bread; start the tutorial with the API down and
check the warning toast.

## PR F: cleanup

Once B to E are merged:

- Delete `lib/mock-api.ts`. `createScript` always calls the API (drop the
  `tutorialId` parameter down through `hooks/use-scripts.ts`), `compileScript`
  drops the UUID check. A script saved mid-tutorial before the migration has
  a `counter-account_<uuid>` id: `compileScript` returns a clear error for a
  non-UUID id ("created before … restart the tutorial") rather than the
  API's 500. Restart is on the tutorial card. Tutorial 7's `use-counter.ts`
  keeps the mock's fixed slot name (`MOCK_SLOT_NAME`) for such a script, so a
  run saved before PR C still deploys a counter that reads its slot: remove
  it here. Tutorial 8 offers such a run a restart instead
  (`timelock-p2id-note/outdated-run-alert.tsx`): remove it too. So does
  tutorial 9, in the `outdated` case of
  `network-transactions/missing-scripts-alert.tsx` (a state holding
  `counter-value-contract`): remove that case, keep the alert for a run
  started without the API.
- Delete the MASM counter built-ins: `default-scripts/counter-contract.ts`,
  `counter-map-contract.ts`, `counter-note.ts`, `counter-script.ts`,
  `timelock-p2id.ts`, `default-components/counter-contract.ts`, and their
  entries in `default-scripts/index.ts` and `default-components/index.ts`.
  `count-reader.ts` moves next to `lib/tutorials/counter-account.ts` (it's a
  compiled package tutorial 10 embeds, not a built-in). Persisted states keep
  their copies (`withDefaultScripts` only replaces known ids), so old
  sandboxes still open; the "Counter Account" rename in
  `mainnetSandboxStarter` can go back to "Counter Contract".
- `lib/constants.ts`: `COUNTER_CONTRACT_GET_COUNT_PROC_HASH`,
  `COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH`, `COUNTER_NOTE_RUN_PROC_HASH`,
  `COUNTER_SCRIPT_RUN_PROC_HASH`, `P2IDE_NOTE_CODE` if unused.
- Comments and docs that describe the mock: `components/lib/header-view.tsx`,
  `components/script/script.tsx` (`masmOnly`), `lib/utils/script-files.ts`,
  `lib/utils/script.ts` (`assembledFromMasm` stays: the standard built-ins
  are still MASM), `lib/types/script.ts` (`ScriptFiles`),
  `lib/utils/tutorial-code.test.ts`, `docs/claude/script-editor.md` (the
  "Tutorials outside the list" bullet), `e2e/README.md` prerequisite 3.
- `pnpm masm:sync` isn't affected; `pnpm lint` reformats the Markdown.

Verify: typecheck, lint, build, the full e2e suite against local (API and
compile service up, Bread installed), the three mobile projects.

## Open questions

- Can a Rust note script target the standard basic wallet? Until it can, a
  note built from the P2ID template is only consumable by an account deployed
  with the compiled `basic-wallet` package (tutorial 8 deploys one), never by
  Bread or an SDK wallet: worth raising with the compiler team, and worth a
  line where the "P2ID Note" example is offered outside the tutorial.

- Keep a MASM step somewhere? Tutorial 6's step 3 was the only place the
  tutorials explained Miden Assembly. If that matters, it needs a new home
  (a built-in note's MASM tab, e.g. `p2id`, reads well), not compiled output.
- Should tutorial 6 also mention the registry? Its imported counter is
  verified, so the account page's components would show even in a sandbox.
  Tutorial 12 covers verification; probably one sentence at most.
