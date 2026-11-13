# Plan 030: A test covers an example deploy that succeeds after the user left its workspace

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report: do not improvise. This is an investigate-then-write plan. Step 1
> fixes the submit route, step 2 measures the one timing still unknown, and
> step 3 picks its hold from that number, so record every number. When done, update the status row for this plan in
> `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 79b7913..HEAD -- apps/web/e2e/projects.spec.ts apps/web/e2e/workspace-switch.spec.ts apps/web/hooks/use-examples.ts apps/web/hooks/use-accounts.ts apps/web/hooks/use-fund-account.ts apps/web/components/lib/network-badge.tsx apps/web/lib/utils/workspace-guard.ts apps/web/components/global-context/provider.tsx`
> If `79b7913` is unknown, plan 026's branch hasn't been merged yet: STOP.
> If any listed file changed, compare it against "Current state" below; on a
> mismatch in the deploy or switch path, STOP.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW (test-only, but may surface a product bug)
- **Depends on**: plans/026-e2e-waits-on-signals.md (merged: this plan extends its deploy test's routes)
- **Category**: tests
- **Planned at**: commit `1a866c7` (main) plus branch `test/e2e-waits-on-signals` at `79b7913`, 2026-11-11
- **Revised at**: commit `52c6eb5` (main), 2026-11-11, after the first
  execution stopped. It found that the submit route never matches (the node
  method is `SubmitProvenTx`, not `SubmitProvenTransaction`), and it measured
  D, S and P (see "Measured so far").

## Why this matters

When the user leaves an example while its account is still being deployed,
the deploy keeps running: nothing cancels it. The app relies on three guards
so the late result can't reach the next workspace. The reducer drops actions
from an earlier workspace run, the success and failure toasts check
`abandoned()`, and `NetworkBadge` doesn't start a deploy during a switch. The
existing test, "a deploy still running doesn't reach the next workspace" in
`apps/web/e2e/projects.spec.ts`, only ever covers the deploy **failing**
after the switch. It holds the proof request for the whole switch, and the
SDK's prover deadline (about 10 s, measured) expires first, so the deploy
dies with "Request timed out" and never submits. Its `submitted` guard was
meant to catch a submit if the timing changed, but its route matches a
method name the SDK doesn't use (see "Current state"), so that guard has
never been able to fire. Step 1 fixes it.

A deploy that **succeeds** after the switch is the dangerous case, and no
test exercises it. The Miden client is the same instance before and after a
switch: the switch clears its IndexedDB store and imports the next
workspace's store into it (`popState` in `apps/web/hooks/use-app-state.ts`).
A transaction that submits and is applied after that import writes the
example's counter account, and its consumed funding note, into the **next
workspace's store**. The reducer guard stops the UI from listing it. The
store itself has no guard, and a later save of that workspace exports the
store with the stray account in it. This test shows whether that happens.

## Current state

The deploy path (read these before step 1):

- `apps/web/components/lib/network-badge.tsx:83-106`: the effect that starts
  an example's deploy. `deployingWorkspaceRun` stops it from retrying. It
  passes `abandoned = () => workspaceLeft(workspaceRun)` to `loadExample`.
- `apps/web/hooks/use-examples.ts:79-115`, `loadExample`:

  ```ts
  try {
    await deployAccount({
      name: component.name,
      storageMode: "public",
      components: [authNoAuth, component],
    });
    if (!abandoned()) {
      toast.success(`${component.name} deployed.`);
    }
    return true;
  } catch (error) {
    if (abandoned()) {
      console.warn(`${component.name}: deploy abandoned`, error);
      return false;
    }
    toast.error(`${component.name} couldn't be deployed.`, { ... });
  ```

- `apps/web/hooks/use-accounts.ts:263-335`, `deployAccount`:
  `clientDeployAccount(...)` creates the account locally, then
  `fundAccount(wasmAccount, …)` funds it, then
  `dispatch({ type: "NEW_ACCOUNT", … })`. That `dispatch` is bound to the
  old workspace run and is dropped by the reducer.
- `apps/web/hooks/use-fund-account.ts:100-147`, `fundAccount` then
  `consumeFundingNote`: a faucet note is consumed by
  `execute({ accountId, request })`. That call is where the remote prover
  request (`https://tx-prover.testnet.miden.io`) and then the node's
  submit happen. The submit is a gRPC-web POST to
  `https://rpc.testnet.miden.io/miden.node.v1.NodeService/SubmitProvenTx`.
  The method name comes from the SDK's WASM: run
  `grep -ao "NodeService/SubmitProven[A-Za-z]*" node_modules/.pnpm/@miden-sdk+miden-sdk@0.17.8/node_modules/@miden-sdk/miden-sdk/dist/st/assets/miden_client_web.wasm`.
  There is also a `SubmitProvenTxBatch` method, which the route must not
  match. It then calls
  `waitForCommit(transactionId, { timeoutMs: TRANSACTION_COMMIT_TIMEOUT })`
  (60 s) and `client.getAccount(account.id())`.
- The prover has no explicit timeout. The SDK builds it with
  `wasm.TransactionProver.newRemoteProver(remoteUrl, undefined)`
  (`node_modules/.pnpm/@miden-sdk+miden-sdk@0.17.8/node_modules/@miden-sdk/miden-sdk/dist/st/index.js`,
  `resolveProver`), so the deadline is the WASM client's default: about
  10 s, measured.
- `apps/web/lib/utils/workspace-guard.ts`: `workspaceLeft(run)` is true
  while switching or once the run changed.
- `apps/web/components/global-context/provider.tsx:33-37`:
  `persistedReducer` drops an action whose `workspaceRun` isn't the current
  one.
- `docs/claude/saved-projects.md`, line 9: "Nothing cancels what's running
  when a workspace is replaced … A deploy abandoned this way loses its
  account with the store, and reports nothing". That sentence is the
  behaviour under test.

The existing test, `apps/web/e2e/projects.spec.ts` (at `79b7913`), from the
line `test("a deploy still running doesn't reach the next workspace"` to the
end of that test. It routes `/prover/`, holding the request on `held` until
`release()`, then fetching and fulfilling it and resolving `proverAnswered`.
It also routes
`/rpc\.testnet\.miden\.io\/miden\.node\.v1\.NodeService\/SubmitProvenTransaction/`
(`projects.spec.ts:349`), setting `submitted` and resolving `submitAnswered`.
**That regex never matches**: the SDK calls `SubmitProvenTx`. In the first
execution, no request with "Submit" in its URL was seen, even in runs where
the deploy completed, and no request matching the plan's regex appeared on
the submit path. So `submitted` is always false there, and the comment at
`projects.spec.ts:371-375` ("no SubmitProvenTransaction request follows
(observed)") rests on a route that can't fire. It starts the counter
example (`startExample(page)` from `e2e/example.ts`), waits for
`provingStarted`, and switches to tutorial 2 through the sidebar switcher
(`switcher(page)`, menu items "Tutorials" then `/^2\. /`). It waits for the
switcher to show `tutorial2` ("Transfer assets between wallets") and a
`Wallet A` row, then calls `release()`. After the waits, it checks that
there's no `Counter Contract` row and no `/Counter Contract (deployed|couldn't)/`
text. Keep that test's flow as it is: it covers the failure path. Step 1
changes only its submit regex and the method name in its comment. The new
test is a sibling.

Measured so far (first execution, local, 2026-11-11):

- **D**, the prover request deadline (route fires → browser logs
  `Deadline expired … Request timed out`, then
  `Counter Contract: deploy abandoned`): about 10.0 s (one run).
- **S**, the switch (click `/^2\. /` → `Wallet A` row visible): about
  10.4 s (one run).
- **P**, an unheld proof (prover route fires → `route.fetch()` resolves):
  0.37–0.46 s (four runs).
- Without a switch, the counter deploy completes: the
  `Counter Contract deployed` toast appears at about T+28 s from the start.
- **D_submit**: not measured yet, because the submit route never fired.
  The submit likely goes through the same gRPC-web client, so expect a
  deadline near 10 s too, but measure it.

D < S, so holding only the prover can't outlast the switch (the old hold B
is ruled out).

Patterns to reuse:

- **Reading a saved project's store**: `savedStore(page, name)` in
  `apps/web/e2e/workspace-switch.spec.ts:106-135` opens IndexedDB
  `PlaygroundProjects` and finds the `meta` entry with
  `kind === "project" && name === name`. It then reads `projects` at
  `` `${meta.kind}:${meta.id}` `` and resolves `get.result.store`. The
  record also holds the saved app state: check its shape in
  `apps/web/lib/types/project.ts` and `apps/web/lib/utils/project.ts`. A
  tutorial is saved as a project of kind `"tutorial"` when you leave it
  (`docs/claude/saved-projects.md`, line 3).
- **Counting accounts in a store dump**:
  `(JSON.parse(dump) as { accountCode: unknown[] }).accountCode.length`
  (`workspace-switch.spec.ts:174-175`).
- Tutorial 2 creates a per-user Wallet B in the background
  (`components/tutorials/transfer-assets-between-wallets/use-wallet-b.ts`),
  so its account count isn't fixed. Don't compare against a hardcoded count.
- `logBrowserErrors(page)` and `TRANSACTION_TIMEOUT` (3 min) come from
  `e2e/tutorial.ts`.

Environment:

- The specs run locally only: web on :3000 (`cd apps/web && pnpm dev`) and
  `apps/api` on :3001 (`cd apps/api && env -u DATABASE_URL pnpm dev`, with its
  Docker postgres up). The counter example only needs postgres.
- In a git worktree, copy the ignored `apps/web/.env.development.local`,
  `apps/web/.env.local` and `apps/api/.env.local` from the main checkout
  first, and run `pnpm install --frozen-lockfile`.
- Real testnet transactions: proving and submitting can flake, so rerun once
  before concluding.
- Never edit files while a Playwright run is in progress. Run long runs under
  `caffeinate -dims`.
- Stop servers by PID only (`lsof -ti tcp:3000`), never with `pkill` or
  `killall`.

## Commands you will need

| Purpose          | Command                                                                                     | Expected on success |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| One test         | `cd apps/web && pnpm test:e2e e2e/projects.spec.ts -g "succeeds after"`                     | passes              |
| Repeat for flake | `cd apps/web && pnpm test:e2e e2e/projects.spec.ts -g "deploy" --repeat-each=3 --retries=0` | all pass            |
| Whole spec       | `cd apps/web && pnpm test:e2e e2e/projects.spec.ts`                                         | all pass            |
| Typecheck        | `cd apps/web && pnpm typecheck`                                                             | exit 0              |
| Lint + format    | `cd apps/web && pnpm exec biome check --write e2e/projects.spec.ts`                         | exit 0              |

## Scope

**In scope**: `apps/web/e2e/projects.spec.ts`: a new test, helpers in that
file if needed, and the existing deploy test's submit regex and comment
(step 1 only).

**Out of scope** (do NOT touch):

- App source (`apps/web/hooks`, `components`, `lib`). If the new test shows
  that a late deploy writes into the next workspace, that is a product bug:
  STOP and report it with evidence. Don't fix it, and don't mark the test
  `test.fail`/`fixme` on your own.
- The existing test "a deploy still running doesn't reach the next
  workspace", beyond step 1's regex and comment change. Its route setup may
  be extracted into a shared helper only if that test's behaviour stays
  identical.
- `apps/web/e2e/workspace-switch.spec.ts`. Copy the `savedStore` pattern
  into `projects.spec.ts` instead of importing it: spec files don't export
  helpers here.
- `playwright.config.ts`, timeouts, retries, worker count.

## Git workflow

- Branch: `test/late-deploy-success` from `main` (after plan 026 is merged).
- Two conventional commits: step 1 as
  `test(e2e): route the deploy test's submit by its real method name`, then
  `test(e2e): cover a deploy that succeeds after leaving the example`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the submit route in the existing deploy test

In "a deploy still running doesn't reach the next workspace", replace the
submit route's regex with:

```ts
/rpc\.testnet\.miden\.io\/miden\.node\.v1\.NodeService\/SubmitProvenTx$/;
```

The `$` keeps it from matching `SubmitProvenTxBatch`. If a request URL
turns out to carry a query string, use `SubmitProvenTx(\?|$)` instead.
In its comment, change "no SubmitProvenTransaction request follows
(observed)" to "no SubmitProvenTx request follows (observed)". Change
nothing else in that test.

Put the regex in a module-level `const SUBMIT_ROUTE = …` above the test,
with a one-line comment naming where the method name comes from (the SDK's
WASM, `NodeService/SubmitProvenTx`). The new test reuses it.

**Verify**:
`pnpm test:e2e e2e/projects.spec.ts -g "still running" --retries=0` passes,
twice. With the prover held through the 10 s deadline the deploy still dies
before submitting, so `submitted` stays false and the test is unchanged in
effect. If it now fails, or a submit is seen, STOP and report: the failure
path assumption is wrong.

### Step 2: Measure the submit deadline

Write the new test's skeleton (step 3 names it) with timestamped
`console.info` lines and a `page.on("console")` that timestamps every
browser message. Let the prover answer at once (fetch and fulfill, no
hold). Route `SUBMIT_ROUTE` and **hold it, never releasing it**. Don't
switch. Record:

- `T_submit`: when the submit route fires (relative to the test start).
- `T_submit_deadline`: when the browser logs a deadline or timeout error
  after the submit fired, or `Counter Contract: deploy abandoned` /
  `couldn't be deployed`.

D_submit = `T_submit_deadline - T_submit`.

**Verify**: the submit route fired (if it never fires within 2 min, STOP:
the method name or URL is still wrong; report every request URL logged
by `page.on("request")` that contains `rpc.testnet`). D_submit recorded
from two runs, or "none seen within 5 min".

### Step 3: Write the test "a deploy that succeeds after leaving its example doesn't reach the next workspace"

Add it right after the existing deploy test, with a comment above it in the
style of the existing one (one or two sentences on what it covers and how).

The goal: the deploy's transaction is **submitted and answered after the
tutorial's store has been imported**, so any write the SDK makes lands in the
tutorial's store. The `Wallet A` row being visible means the import is done.
Measured: D ≈ 10 s, S ≈ 10.4 s, P ≈ 0.4 s. Choose the hold from D_submit:

- **A, if D_submit > S + 5 s (≈ 15.5 s), or no submit deadline was
  seen:** let the prover answer at once. Hold the submit route from when
  it fires until the `Wallet A` row is visible, then fetch and fulfill it.
  Start the switch as soon as the submit route fires (instead of on
  `provingStarted`).
- **C, otherwise, if D + D_submit > S + 5 s:** split the switch over both
  deadlines, since each request gets its own. Start the switch as soon as
  the prover route fires. Hold the prover for `D - 3 s` (about 7 s), then
  fetch and fulfill it. Hold the submit from when it fires until the
  `Wallet A` row is visible, or until `D_submit - 3 s` has passed since it
  fired, whichever comes first, then fetch and fulfill it. Then check
  that the `Wallet A` row was already visible when the submit was
  released: record a boolean `importedBeforeSubmit` and assert it with
  the message "the switch outlasted both holds: re-measure, see the
  comment above". Compute the two hold lengths from named constants
  (`PROVER_DEADLINE_MS`, `SUBMIT_DEADLINE_MS`) with a comment citing the
  measured values, not from bare numbers.
- **Neither holds:** STOP and report the numbers. The scenario can't be
  forced from the test without an app hook.

Then:

1. Await the submit's answer (`submitAnswered`). Then assert that the success
   path really ran:
   `expect(submitted, "the deploy never submitted: the timings changed, see the comment above").toBe(true)`.
   A new test is free to assert this, and it keeps the test from passing
   without checking anything.
   On hold C, also assert `importedBeforeSubmit` before the UI checks.
2. Wait for the deploy to end. It ends when `waitForCommit` sees the
   transaction committed, or when it throws (it logs
   `Counter Contract: deploy abandoned` through `console.warn`). Wait on that
   console message with a `page.waitForEvent("console", …)` started before
   the release, **or** for a bound derived from `TRANSACTION_COMMIT_TIMEOUT`
   (60 s) plus a margin. Write which one you used, and why, in a comment.
   Find out in a run whether the warning appears on this path, or whether
   the success path ends silently.
3. UI assertions, the same as the existing test: no `Counter Contract` row,
   no `/Counter Contract (deployed|couldn't)/` text.
4. Store assertion:
   - Leave tutorial 2 for a new Testnet sandbox through the switcher. That
     saves tutorial 2 as a `"tutorial"` project; check the menu item's name
     in `components/lib/project-switcher.tsx`.
   - Read that saved project's record from `PlaygroundProjects`: copy
     `savedStore` and adapt the `meta` match to the tutorial kind and id.
     Check the id in `hooks/use-tutorials.ts`.
   - Parse its `store` and its saved app state. Assert that every account id
     in the store is an account the saved state lists. Find the field names
     in `lib/types/store.ts` and `lib/types/project.ts`, and handle the id
     encodings, hex in the store and bech32 or hex in the state: normalize
     both.
   - If the store's account ids can't be read reliably, assert instead that
     the dump doesn't contain the counter contract's account code root.
     Capture it during the run, for example from the example's own store
     before the switch.

**Verify**: `pnpm test:e2e e2e/projects.spec.ts -g "succeeds after"` passes,
or fails on the store or UI assertion. A failure there is the product bug:
see the STOP conditions.

### Step 4: Flake check, format, typecheck

**Verify**:

- `pnpm test:e2e e2e/projects.spec.ts -g "deploy" --repeat-each=3 --retries=0`
  → all pass. That runs both deploy tests, and the new one asserts
  `submitted` each time.
- `pnpm exec biome check --write e2e/projects.spec.ts` → exit 0.
- `pnpm typecheck` → exit 0.
- `pnpm test:e2e e2e/projects.spec.ts` → all pass.

## Test plan

One new e2e test in `apps/web/e2e/projects.spec.ts`, modelled on "a deploy
still running doesn't reach the next workspace" in the same file. It covers:
a deploy whose transaction is submitted after the switch to tutorial 2 adds
no row, shows no toast, and leaves no account in tutorial 2's saved store.
The report lists D_submit (and S, if re-measured), which hold (A or C) was chosen, the
new test's duration, and whether the "deploy abandoned" warning appears on
the success path.

## Done criteria

- [ ] The existing deploy test routes `NodeService/SubmitProvenTx$` and its comment names `SubmitProvenTx`
- [ ] `grep -c "SubmitProvenTransaction" apps/web/e2e/projects.spec.ts` → 0
- [ ] The new test exists and asserts `submitted === true`, the UI (no row,
      no toast) and the saved store (no stray account)
- [ ] `pnpm test:e2e e2e/projects.spec.ts -g "deploy" --repeat-each=3 --retries=0` → 6 passed
- [ ] `pnpm test:e2e e2e/projects.spec.ts` → all pass
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `git status` shows only `apps/web/e2e/projects.spec.ts` (and `plans/README.md`)
- [ ] The comment above the new test names the hold used and the measured numbers it relies on

## STOP conditions

- The drift check fails, or `79b7913` isn't on `main`.
- The new test fails on the UI or the store assertion, reproducibly (twice):
  that is a real bug. Report the evidence (what showed up where, with a
  store excerpt of ids only, never key material) and leave the test
  uncommitted, or committed on the branch with a note: don't change app code.
- After step 1 the existing deploy test fails, or sees a submit.
- The submit route never fires in step 2 (the URL is still wrong).
- Neither hold A nor hold C fits the measured numbers (step 3).
- `submitted` is false in any run of the new test: the timing doesn't force
  the success path. Report the numbers instead of adding sleeps.
- Testnet flakes (prover or RPC errors unrelated to the hold) persist after
  one rerun.

## Maintenance notes

- The test depends on two measured timings: the client's request deadlines
  and the switch duration. The `submitted` assertion turns a timing change
  into a clear failure instead of a test that passes without checking
  anything. If it starts failing with that message, re-measure (D as in the
  existing test's hold, D_submit as in step 2) before touching the hold.
- The submit route matches the node method name in the SDK's WASM. If an SDK
  bump renames it (check with the `grep -ao` command in "Current state"),
  both deploy tests stop seeing submits silently. On hold C or A the new
  test's `submitted` assertion catches that; the old test's guard doesn't.
- If the test shows the store is polluted, the fix is in the app: for
  example, `deployAccount`/`consumeFundingNote` checking `abandoned()` before
  `execute`, or the switch waiting for an in-flight deploy. That needs its
  own plan and a product decision, because `docs/claude/saved-projects.md`
  says a switch doesn't wait for a deploy on purpose.
- Plan 026's deploy test (the failure path) and this one share route setup.
  If one changes how the prover or submit is routed, check the other.
