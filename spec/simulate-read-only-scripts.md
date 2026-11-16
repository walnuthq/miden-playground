# Simulate: read-only scripts

Status: **implemented** (2026-11-16), on `feat/simulate-read-only-scripts`. The open item "A Simulate tab on read-only scripts, which have no console" of `spec/editor-console-improvements.md`, after `spec/simulate-foreign-calls.md` (#844) and `spec/simulate-throwaway-target.md` (#845, #846).

One PR, in the Playground only. api-compile and the API don't change.

Read `docs/claude/simulation.md`, `script-editor.md`, `phone-layout.md`, `tutorial-copy.md` and `script-templates.md` before starting.

## Why

A read-only script's page shows its tabs (Explorer, MASM, Manifest) and nothing else: `components/script/script.tsx` renders the editor/console split only when `!script.readOnly`. The Simulate tab lives in the console, so these scripts can't be simulated, though most of them hold everything a simulation needs.

Read-only scripts are:

| Kind                                                                                          | Package (`masp`) | Where                                   |
| --------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------- |
| Packages the web app embeds: `count-reader`, `counter-account`, the Rust `basic-wallet`       | yes              | tutorials 6, 8 and 10 (`lib/tutorials`) |
| The counter example's packages, started read-only (`counterExampleStarter({ readOnly })`)     | yes              | tutorial 9                              |
| Verified packages imported from a deployed account (`packageToScript`, `lib/utils/script.ts`) | yes              | any sandbox                             |
| Built-ins assembled from MASM (`lib/types/default-scripts`): notes, wallet, faucet, auth      | no               | every workspace                         |

The first three are the interesting ones: they are the scripts a tutorial asks the user to read, or the code of an account the user imported, and the user can't try them without deploying. Tutorial 10 is the clearest case: it explains a foreign call with `count-reader`, and since #844 the Simulate tab can run exactly that call against a staged counter, but the tutorial's own script has no tab.

## Take

Worth doing, and small: the simulation code needs nothing new for a package-backed script. `useSimulation`, `useTargetSimulation` and the mock client only read `masp`, `procedureExports`, `dependencies` and `metadata`. What's missing is a place to show the tab, and two data gaps on the embedded packages.

Scope it to **read-only scripts that hold a package**. The MASM built-ins are a different problem (see "Out of scope"): half of them can't be put on the simulated account at all.

## Decisions

- **The console shows on a read-only script that can be simulated**, with both its tabs. Not a fourth page tab next to Manifest: a failed run writes to the log and switches to Output, the result dialog's "see the log" depends on it, and a second home for the Simulate panel would fork its layout rules (phone, `keepMounted`).
- **Which scripts**: `canSimulate(script)`, a pure helper: the type is `account-component`, `note` or `transaction-script`, and `masp` isn't empty. Libraries and authentication components get no console, as today. An editable script always has its console, as today.
- **The console opens on Simulate** for a read-only script: its log starts empty and there's nothing to compile. The empty log's placeholder says "Simulation runs are logged here." instead of "Compile the script to see its output here."
- **No Compile button and no compile shortcuts**, as today. The console's own shortcuts (Cmd/Ctrl+J toggles it, +L clears it) work on these scripts.
- **The split's sizes are shared** with editable scripts (`script-editor-layout`): one habit, one setting. On a phone the console starts collapsed to its bar, as for editable scripts.
- **Storage starts** as it does for any script: the package's storage schema when it has one, else a workspace component made from the script (tutorial 10's Count Reader component gives `count` = 0), else slots added by hand.
- **Nothing else changes for a read-only script**: no edit, no dependency edit, no delete. "Apply to storage" writes to the tab's in-memory slots only, which aren't the script.

## Gaps to close in the data

- **`count-reader` (embedded) has no `dependencies`**, so `simulationBlockedReason` refuses `copy_count` ("no account component among the dependencies"). Add its `counter-account` dependency with the embedded counter's commitment. In tutorial 10 it then resolves to the workspace's `counter-account` (same id and commitment), with its storage schema: no dynamic import.
- **A verified import has no `metadata` and no `callsForeign`** (`packageToScript` reads the manifest only). It works without: slots are added by hand, note storage is raw felts, a `null` flag isn't blocked and stages the dependencies that resolve. Its dependencies carry the dependency's name as id, so they resolve by commitment only (rules 2 and 3 of `foreignDependencies`), and show as "missing" otherwise. Leave it: the API would have to return the schemas for verified packages, which is its own change.

## Steps

### Checks to run first (stop and report if one fails)

1. In tutorial 10, with the dependency of step 4 added by hand and the console forced on: `copy_count` on `count-reader` against the staged `counter-account` at 7 sets `count` to 7. The embedded packages were compiled apart from the example's: confirm the counter's commitment in `lib/tutorials/counter-account.ts` is the dependency digest inside `count-reader`'s package (read the manifest from the masp, as `counter-account.test.ts` does for its exports).
2. In tutorial 9, `increment-note` (read-only) on the simulated account: the count goes from 5 to 6. Its dependency resolves to the workspace's read-only `counter-account`.
3. In tutorial 8, the embedded `basic-wallet` as an account component: its simulated account holds the standard basic wallet too. `createSimulatedAccount` already builds that pair for a P2ID target, but confirm a procedure runs.
4. A verified import (tutorial 12's flow, or any deployed counter imported with its verified source): `get_count` and `increment_count` run with a slot added by hand.

### Pure helpers

5. `lib/simulation/can-simulate.ts`: `canSimulate(script)` as decided. Unit tests: each type, an empty `masp`, a MASM built-in.
6. `components/script/simulate/not-ready.ts`: unchanged for package-backed scripts (a read-only one is `compiled` with a `masp`, so it returns nothing). Add the case to its tests if it has none.

### Data

7. `lib/tutorials/count-reader.ts`: the `counter-account` dependency (`id: "counter-account"`, `type: "account-component"`, the embedded counter's commitment, imported from `counter-account.ts`, not copied).
8. A unit test next to it, like `counter-account.test.ts`: the dependency's commitment is the one in the package's manifest. `pnpm templates:check` covers the Rust basic wallet only; say in `docs/claude/script-templates.md` that `count-reader`'s dependency is checked by this test.
9. The Manifest tab of `count-reader` now lists the dependency, without Add or Remove (`!script.readOnly` already hides them). Check it reads well.

### Script page (`components/script/script.tsx`)

10. Render the split when `!script.readOnly || canSimulate(script)`; keep the bare tabs otherwise.
11. `useScriptShortcuts`: split `enabled` in two. Compile (S, Enter) needs an editable script; the console's (J, L) need a console. `e2e/script-shortcuts.spec.ts` has the step "a read-only script has no shortcuts": it uses a built-in, which keeps none. Add a package-backed read-only script to it: J toggles, S does nothing.
12. `compileAndShow` isn't reachable without the button and the shortcut: no change, but don't pass `compiling` assumptions to the console for a read-only script (it's always false).

### Console (`components/script/editor-console.tsx`)

13. A `readOnly` prop (from `script.readOnly`): the initial view is `simulate`, and the empty log's placeholder changes. Keep the placeholder one text node in the bar (`script-editor.md`: the specs' regexes).
14. The "Last compile failed" effect can't fire (`status` is `compiled`): leave it.
15. `onRevealLocation` is only used by compile output: leave it wired.

### Simulate panel

16. `AccountComponentSimulation` and `TargetSimulation` run as they are. Their intro sentences don't mention compiling when the script is ready: read both once on a read-only script.
17. The unresolved-dependency sentences say "Compile this script again…" and "Compile it, then this script…", which a read-only script can't do. With `script.readOnly`, say instead that the dependency's package isn't in the workspace, and stop there. Pass the sentences from the two panels, which already own them.

### Tutorials

18. Tutorial 10: add a sentence to the step that opens `count-reader` (`foreign-procedure-invocation/step2.tsx` or `step3.tsx`), saying the call can be tried in the console's Simulate tab before deploying: set the counter's count under "Foreign accounts", pick the simulated `counter-account` as `copy_count`'s argument, Invoke. Follow `tutorial-copy.md`. No step is gated on it.
19. Tutorials 6, 8 and 9 get the console on their read-only scripts without a copy change. Grep `apps/web/components/tutorials` for sentences that describe a read-only script's page ("console", "under the editor"): tutorial steps name where things sit, and no test catches stale copy.
20. On a phone inside a tutorial, the page's height already leaves room for the closed tutorial panel (`MOBILE_TUTORIAL_PAGE_HEIGHT_CLASS_NAME`); the console's bar now takes 42 px of it on these scripts. Check the source is still readable at 320 px with the panel closed.

### E2E

21. `e2e/tutorial-10-foreign-procedure-invocation.spec.ts`: on the `count-reader` page, the console is there, on Simulate; set the staged counter to 7, pick it, Invoke, the dialog shows `count` at 7. No Compile button.
22. `e2e/script-simulate.spec.ts`, or tutorial 9's spec: a read-only note on the simulated account (step 2).
23. A built-in (the P2ID note) still has no console: one assertion, in `script-shortcuts.spec.ts` or `script-layout.spec.ts`.
24. `e2e/mobile`: the read-only script page of a tutorial fits at 320 px, console collapsed and open.

### Docs

25. `docs/claude/simulation.md`: which read-only scripts get the tab and why the built-ins don't; `count-reader`'s dependency.
26. `docs/claude/script-editor.md`: "The console shows on every tab of an editable script" gains the read-only case; the shortcuts' two conditions.
27. `spec/editor-console-improvements.md`: mark the item done, with a pointer here.

## Checks before the PR

- `pnpm lint`, `pnpm typecheck`, unit tests in `apps/web` and `apps/api`.
- `vite build`: `canSimulate` and the console add nothing from `@miden-sdk/*` to the entry's static graph.
- Web on 3000 and the API on 3001: tutorials 6, 8, 9, 10 and 12, `script-simulate`, `script-shortcuts`, `script-layout`, `script-explorer`, and the `e2e/mobile` projects.
- By hand: a verified import with an unresolved dependency shows the reworded sentence.

## Out of scope

- **The MASM built-ins.** Each needs its own answer:
  - `basic-wallet` is already a component of every simulated account: adding it again fails the build on duplicate procedures. Its procedures would run on a bare simulated account, which needs a special case.
  - `fungible-faucet` needs a faucet account, which the simulated account isn't.
  - Authentication components aren't called directly.
  - The built-in notes (P2ID, the fee notes) would run through `clientCreateNoteFromScript`, which already assembles from MASM. But their storage is raw felts, which can't name the simulated account, and they have no `accountProcedures`, so no target filter. The built-in P2ID is the one worth a follow-up: a hand-written note storage schema would make it typed, after checking the order its MASM reads the account id in.
- Storage and note storage schemas for verified imports (an API change).
- Making a read-only script editable from its page ("fork this script").
