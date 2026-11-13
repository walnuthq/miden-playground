# Plan 031: The failing-deploy test passes its requests through and waits for the deploy to end

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report: do not improvise. When done, update the status row for this plan in
> `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: find the commit that holds plan 030's work.
> If `git branch --contains c4dba32` lists `main`, compare against `main`;
> otherwise use the branch `test/late-deploy-success`. Then run
> `git diff --stat c4dba32..<that ref> -- apps/web/e2e/projects.spec.ts`.
> If `c4dba32` is unknown, plan 030's branch is gone: STOP. If the file
> changed, compare the test "a deploy still running doesn't reach the next
> workspace" against "Current state" below; on any mismatch in its routes or
> its waits, STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (test-only)
- **Depends on**: plans/030-late-deploy-success-test.md (DONE on branch
  `test/late-deploy-success`, c4dba32: this plan uses its `SUBMIT_ROUTE` and
  copies its patterns)
- **Category**: tests
- **Planned at**: branch `test/late-deploy-success` at `c4dba32` (on top of
  `main` at `52c6eb5`), 2026-11-11

## Why this matters

`apps/web/e2e/projects.spec.ts` has two tests on an example deploy that is
still running when the user switches to tutorial 2:

- "a deploy still running doesn't reach the next workspace" (from plan 026)
  covers the deploy **failing** after the switch;
- "a deploy that succeeds after leaving its example doesn't reach the next
  workspace" (from plan 030) covers it **succeeding**.

The first test replays the held requests from Node with `route.fetch()` and
fulfills the page with the result. Plan 030's execution found that the
prover's load balancer refuses a replayed request: `route.fetch()` gets
HTTP 464 with an empty body (headers `awselb/2.0`, `content-length: 0`).
So in that test:

- `proverAnswered` doesn't mean the prover answered. It resolves after a
  refused replay, or after `route.fulfill` throws because the page already
  aborted the request. The wait after it is a fixed 5 s settle in disguise,
  and the comment says "Fetched here, not continued, so the test knows when
  it was answered", which is untrue.
- If a submit ever got through (its guard), the page would get a 464 instead
  of the node's answer, which hides exactly the late write the guard exists
  to catch.

Measured during plan 030 (local, testnet, 2026-11-11): the SDK gives up on
the prover about 10.0 s after the request, and the switch to tutorial 2 takes
about 10.4 s. Because this test releases the prover only after the switch,
the deadline has already fired: the browser logs `Deadline expired … Request
timed out`, then `Counter Contract: deploy abandoned`, and no submit follows.
That console warning is the real signal that the deploy ended. Plan 030's
test already waits on it; this test should too.

## Current state

`apps/web/e2e/projects.spec.ts` at `c4dba32`, lines 312-392 (abridged where
marked):

```ts
// The node's submit method, as named in the SDK's WASM (NodeService/SubmitProvenTx).
// The `$` keeps it from matching SubmitProvenTxBatch.
const SUBMIT_ROUTE =
  /rpc\.testnet\.miden\.io\/miden\.node\.v1\.NodeService\/SubmitProvenTx$/;

// Leaving an example while its account is being deployed abandons the deploy,
// which must not report to, or add its account to, the next workspace. The
// proof is held back so the deploy is mid-transaction during the switch.
test("a deploy still running doesn't reach the next workspace", async ({
  page,
}) => {
  logBrowserErrors(page);
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let proving = () => {};
  const provingStarted = new Promise<void>((resolve) => {
    proving = resolve;
  });
  let answered = () => {};
  const proverAnswered = new Promise<void>((resolve) => {
    answered = resolve;
  });
  await page.route(/prover/, async (route) => {
    proving();
    await held;
    try {
      // Fetched here, not continued, so the test knows when it was answered.
      await route.fulfill({ response: await route.fetch() });
    } catch {
      // The page abandoned the request meanwhile.
    } finally {
      answered();
    }
  });
  let submitted = false;
  let submitDone = () => {};
  const submitAnswered = new Promise<void>((resolve) => {
    submitDone = resolve;
  });
  await page.route(SUBMIT_ROUTE, async (route) => {
    submitted = true;
    try {
      await route.fulfill({ response: await route.fetch() });
    } catch {
      // The page abandoned the request meanwhile.
    } finally {
      submitDone();
    }
  });
  await startExample(page);
  await provingStarted;

  // … switch to tutorial 2, wait for `tutorial2` in the switcher and the
  // `Wallet A` row (unchanged by this plan) …

  // The proof is held for the whole switch, which outlasts the SDK's request
  // deadline: the deploy fails ("Request timed out") and no
  // SubmitProvenTx request follows (observed). If the timing changes
  // and a submit does happen, the test waits for the node's answer before
  // asserting, so the assertions never run before a late write could land.
  // The settles let the page render whatever the abandoned deploy wrote.
  release();
  await proverAnswered;
  await page.waitForTimeout(5_000);
  if (submitted) {
    await submitAnswered;
    await page.waitForTimeout(5_000);
  }
  await expect(page.getByRole("row", { name: /Counter Contract/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/Counter Contract (deployed|couldn't)/),
  ).toHaveCount(0);
});
```

The pattern to copy is in the next test, "a deploy that succeeds after
leaving its example doesn't reach the next workspace", in the same file:

```ts
// Registered from the start: the warning comes 1-2 s after the node's answer.
let deployAbandoned = false;
page.on("console", (message) => {
  if (message.text().includes("deploy abandoned")) {
    deployAbandoned = true;
  }
});
// …
// The prover and the node are called through the page (continue, not fetch:
// a request replayed from Node is refused by their load balancer).
await page.route(/prover/, async (route) => {
  proverFired();
  await new Promise((resolve) =>
    setTimeout(resolve, PROVER_DEADLINE_MS - 3_000),
  );
  await route.continue();
});
// …
await expect
  .poll(() => deployAbandoned, {
    message: "the late deploy never ended with the abandoned warning",
    timeout: TRANSACTION_COMMIT_TIMEOUT_MS + 15_000,
  })
  .toBe(true);
// The settle lets the page render whatever the deploy wrote.
await page.waitForTimeout(5_000);
```

`PROVER_DEADLINE_MS = 10_000`, `SUBMIT_DEADLINE_MS = 10_200` and
`TRANSACTION_COMMIT_TIMEOUT_MS = 60_000` are module-level constants declared
just above that test, after the failing-deploy test.

Where the warning comes from: `apps/web/hooks/use-examples.ts`, `loadExample`,
logs `` `${component.name}: deploy abandoned` `` through `console.warn` when
`deployAccount` throws after the user left the workspace.

## Commands you will need

| Purpose          | Command                                                                                     | Expected on success |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| The one test     | `cd apps/web && pnpm test:e2e e2e/projects.spec.ts -g "still running" --retries=0`          | 1 passed            |
| Repeat for flake | `cd apps/web && pnpm test:e2e e2e/projects.spec.ts -g "deploy" --repeat-each=3 --retries=0` | 6 passed            |
| Whole spec       | `cd apps/web && pnpm test:e2e e2e/projects.spec.ts --retries=0`                             | 3 passed            |
| No replays left  | `grep -c "route.fetch" apps/web/e2e/projects.spec.ts`                                       | `0`                 |
| Typecheck        | `cd apps/web && pnpm typecheck`                                                             | exit 0              |
| Lint + format    | `cd apps/web && pnpm exec biome check --write e2e/projects.spec.ts`                         | exit 0              |

Environment for the e2e runs:

- Web on :3000 (`cd apps/web && pnpm dev`) and `apps/api` on :3001
  (`cd apps/api && env -u DATABASE_URL pnpm dev`, its Docker postgres
  `api-postgres-1` up). Without the api, "Launch example" never navigates.
- In a git worktree, copy the ignored `apps/web/.env.development.local`,
  `apps/web/.env.local` and `apps/api/.env.local` from the main checkout
  first, and run `pnpm install --frozen-lockfile`.
- Run Playwright under `caffeinate -dims`. Never edit files while a run is
  in progress (Vite HMR breaks the test pages).
- Stop servers by PID only (`lsof -ti tcp:3000`, then `kill <pid>`), never
  with `pkill` or `killall`.
- Real testnet transactions: rerun once before concluding a failure is real.

## Scope

**In scope**: `apps/web/e2e/projects.spec.ts`, only the test "a deploy still
running doesn't reach the next workspace", the comment above it, and moving
the three timing constants above it (step 1).

**Out of scope** (do NOT touch):

- The test "a deploy that succeeds after leaving its example doesn't reach
  the next workspace", except that its constants move (step 1). Its body
  stays byte-identical.
- The save/open/delete tests in the same file.
- `SUBMIT_ROUTE`.
- App source (`apps/web/hooks`, `components`, `lib`),
  `apps/web/e2e/*.ts` helpers, `playwright.config.ts`.

## Git workflow

- If `c4dba32` is on `main`: branch `test/deploy-test-continues` from `main`.
  Otherwise: work on top of `test/late-deploy-success` (check it out, or
  branch `test/deploy-test-continues` from it, as the operator says; if the
  operator says nothing, branch from it).
- One conventional commit:
  `test(e2e): let the failing-deploy test's requests through, wait for its end`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move the timing constants above both deploy tests

Move the block that declares `PROVER_DEADLINE_MS`, `SUBMIT_DEADLINE_MS` and
`TRANSACTION_COMMIT_TIMEOUT_MS` (with their comments) to just below
`SUBMIT_ROUTE`, so both tests read them after their declaration. Don't
change their values or comments.

**Verify**: `cd apps/web && pnpm typecheck` exits 0, and
`git diff -w` shows only the moved lines.

### Step 2: Rewrite the failing-deploy test's routes and waits

In "a deploy still running doesn't reach the next workspace":

1. Register, right after `logBrowserErrors(page)`, the same `deployAbandoned`
   flag and `page.on("console", …)` listener as the next test. It must be
   registered before `startExample`: here the warning fires during the
   switch, about 10 s after the prover request, before `release()`.
2. Prover route: keep `proving()` and `await held`, then
   `await route.continue()` inside `try { … } catch { … }`. The catch keeps
   the existing comment "The page abandoned the request meanwhile.": once the
   deadline fired, the page has aborted the request, and `continue` throws.
   Delete `answered`, `proverAnswered` and the "Fetched here, not continued"
   comment.
3. Submit route: `submitted = true;` then `await route.continue();` in the
   same try/catch. Delete `submitDone` and `submitAnswered`.
4. Replace everything from `release();` up to (not including) the first
   `await expect(page.getByRole("row", …` with:

   ```ts
   release();
   await expect
     .poll(() => deployAbandoned, {
       message: "the deploy never ended with the abandoned warning",
       timeout: PROVER_DEADLINE_MS + 15_000,
     })
     .toBe(true);
   expect(
     submitted,
     "a submit got through: the deploy no longer fails during the switch, see the comment above",
   ).toBe(false);
   // The settle lets the page render whatever the abandoned deploy wrote.
   await page.waitForTimeout(5_000);
   ```

5. Rewrite the comment above `release();` to say, in two to four lines: the
   prover is held for the whole switch (about 10.4 s, measured
   2026-11-11), which outlasts its about 10 s deadline, so the deploy ends
   with "deploy abandoned" and never submits; the test waits on that warning
   and fails if a submit gets through, because then this test no longer
   covers the failing path (the next test covers the succeeding one).

Keep the switch steps between `await provingStarted;` and the comment
exactly as they are.

**Verify**:

- `grep -c "route.fetch" apps/web/e2e/projects.spec.ts` → `0`.
- `grep -c "proverAnswered\|submitAnswered" apps/web/e2e/projects.spec.ts` → `0`.
- `cd apps/web && pnpm exec biome check --write e2e/projects.spec.ts` exits 0
  and `pnpm typecheck` exits 0.
- `git diff` on the succeeding test's body is empty: only the constants
  moved.

### Step 3: Run the tests

**Verify** (servers up, under `caffeinate -dims`):

- `pnpm test:e2e e2e/projects.spec.ts -g "still running" --retries=0` →
  1 passed. Note the test's duration.
- `pnpm test:e2e e2e/projects.spec.ts -g "deploy" --repeat-each=3 --retries=0`
  → 6 passed.
- `pnpm test:e2e e2e/projects.spec.ts --retries=0` → 3 passed.

## Test plan

No new test. The failing-deploy test changes in what it waits on and
asserts:

- it passes requests through instead of replaying them, so a late submit
  would reach the node and the app as in production;
- it waits for the deploy's own end signal instead of a fixed settle after a
  fake "answered";
- it now fails if a submit gets through, instead of silently covering the
  other test's scenario.

## Done criteria

- [ ] `grep -c "route.fetch" apps/web/e2e/projects.spec.ts` → `0`
- [ ] The failing-deploy test polls `deployAbandoned` and asserts
      `submitted === false` with a message
- [ ] The succeeding test's body is unchanged (`git diff` shows only the moved
      constants around it)
- [ ] `pnpm test:e2e e2e/projects.spec.ts -g "deploy" --repeat-each=3 --retries=0` → 6 passed
- [ ] `pnpm test:e2e e2e/projects.spec.ts --retries=0` → 3 passed
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `git status` shows only `apps/web/e2e/projects.spec.ts` (and `plans/README.md`)

## STOP conditions

- The drift check fails, or `c4dba32` is unknown.
- The failing-deploy test fails on the `deployAbandoned` poll twice in a row:
  the deploy no longer ends with that warning on this path. Report the
  browser console lines from `logBrowserErrors` after the switch.
- `submitted` is true in any run: the timings changed and a submit got
  through. Report when the prover route fired, when `Wallet A` showed, and
  when the submit fired. Don't lengthen holds or add sleeps.
- The UI assertions (no `Counter Contract` row, no toast) fail: that is a
  product bug. Report it, don't change app code.
- Testnet flakes unrelated to the change persist after one rerun.

## Maintenance notes

- Both deploy tests now rely on the "deploy abandoned" warning in
  `hooks/use-examples.ts`. If that message is reworded, both fail on their
  poll with a clear message: update the string in both tests together.
- The `submitted === false` assertion makes this test sensitive to the same
  timings as plan 030's test (prover deadline about 10 s, switch about
  10.4 s). If the switch gets much faster than the deadline, the deploy may
  complete or submit before the switch ends and this test fails. That is the
  intended signal: re-measure as plan 030 describes before changing holds.
- Never go back to `route.fetch()` for the prover or the node: their load
  balancer answers a replayed request with HTTP 464.
