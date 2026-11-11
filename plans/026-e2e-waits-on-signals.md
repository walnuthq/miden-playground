# Plan 026: The workspace and project specs wait on signals instead of fixed delays

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. This is an investigate-then-fix plan: for each
> delay, either replace it with a condition or record why it stays. When
> done, update the status row for this plan in `plans/README.md` — unless a
> reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/e2e/workspace-switch.spec.ts apps/web/e2e/projects.spec.ts`
> If either changed, re-run the `grep` of "Current state" and work from its
> live output.

## Status

- **Priority**: P3
- **Effort**: S–M
- **Risk**: LOW (test-only)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Five places in two specs sleep for a fixed time: 1 s, 2 s, 5 s and twice
45 s, about 98 s of waiting per run of a suite that takes about 8 minutes.
Two kinds of risk come with them. A sleep that orders two actions (the 1 s)
can lose the race on a slow machine. A sleep before an "this did not happen"
assertion passes vacuously if the thing became slower than the sleep, which
is exactly the regression those tests exist to catch. Some of these may have
no better signal; the goal is to replace the ones that do and to write down
why the others stay.

## Current state

- `grep -n "waitForTimeout" apps/web/e2e/workspace-switch.spec.ts apps/web/e2e/projects.spec.ts`:

  ```
  apps/web/e2e/workspace-switch.spec.ts:158:  await page.waitForTimeout(1_000);
  apps/web/e2e/workspace-switch.spec.ts:202:  await page.waitForTimeout(2_000);
  apps/web/e2e/workspace-switch.spec.ts:272:  await page.waitForTimeout(5_000);
  apps/web/e2e/workspace-switch.spec.ts:294:  await page.waitForTimeout(45_000);
  apps/web/e2e/projects.spec.ts:345:  await page.waitForTimeout(45_000);
  ```

- `workspace-switch.spec.ts:153-159` — two quick switches; the app's store
  clear is held by a test hook:

  ```ts
  await holdNextStoreClear(page);
  await openProject(page, "Empty");
  await page.waitForFunction(() => !!window.releaseStoreClear);
  await openProject(page, "With account");
  // The second one is queued once the menu's action is done.
  await page.waitForTimeout(1_000);
  await releaseStoreClear(page);
  ```

- `workspace-switch.spec.ts:195-205` — Save while a switch is in progress
  must do nothing:

  ```ts
  const save = menu.getByRole("menuitem", { name: "Save", exact: true });
  await expect(save).toHaveAttribute("aria-disabled", "true");
  await save.click({ force: true });
  await page.waitForTimeout(2_000);
  const during = await savedStore(page, "Mine");
  ```

- `workspace-switch.spec.ts:262-274` — opening the active project must not
  re-import the store:

  ```ts
  const imports: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Store imported successfully.")) {
      imports.push(message.text());
    }
  });

  await openProject(page, "Mine");
  await expect(page).toHaveURL(/\/accounts$/);
  // Longer than a reload of the project takes.
  await page.waitForTimeout(5_000);
  expect(imports).toEqual([]);
  ```

- `workspace-switch.spec.ts:280-296` — a failed example deploy doesn't retry
  (a decided behaviour: the toast offers Retry, nothing retries by itself):

  ```ts
  const prover = /tx-prover\.testnet\.miden\.io/;
  let attempts = 0;
  await page.route(prover, (route) => {
    attempts++;
    return route.abort();
  });
  await startExample(page);
  const failed = page.getByText("Counter Contract couldn't be deployed.");
  await expect(failed.first()).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  // Longer than an attempt takes.
  await page.waitForTimeout(45_000);
  console.info("Deploy attempts:", attempts);
  expect(attempts).toBe(1);
  ```

- `projects.spec.ts:332-351` — a deploy still running when the user switches
  to a tutorial must not write into the tutorial's workspace; the prover
  request is held by a route and released with `release()`:

  ```ts
  release();

  // Longer than the rest of the deploy takes.
  await page.waitForTimeout(45_000);
  await expect(page.getByRole("row", { name: /Counter Contract/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/Counter Contract (deployed|couldn't)/),
  ).toHaveCount(0);
  ```

- The specs run locally only, against the dev server:
  `apps/web/e2e/README.md` (web on :3000, `apps/api` on :3001 with its
  Docker services; 4 workers, one retry; real testnet transactions).
  `docs/claude/saved-projects.md` explains the workspace switch, the
  `workspaceRun` guard and the test hooks on `window`.
- Rule: never edit `apps/web` source or stash while a Playwright run is in
  progress: Vite's reload breaks the pages under test.

## Commands you will need

| Purpose          | Command                                                                                          | Expected on success |
| ---------------- | ------------------------------------------------------------------------------------------------ | ------------------- |
| One spec         | `cd apps/web && pnpm test:e2e e2e/workspace-switch.spec.ts`                                      | all pass            |
| Repeat for flake | `cd apps/web && pnpm test:e2e e2e/workspace-switch.spec.ts --repeat-each=3 --retries=0`          | all pass            |
| Typecheck        | `cd apps/web && pnpm typecheck`                                                                  | exit 0              |
| Lint + format    | `cd apps/web && pnpm exec biome check --write e2e/workspace-switch.spec.ts e2e/projects.spec.ts` | exit 0              |

## Scope

**In scope**: `apps/web/e2e/workspace-switch.spec.ts`,
`apps/web/e2e/projects.spec.ts`.

**Out of scope** (do NOT touch):

- App source. If a delay can only be replaced by adding a test hook to the
  app (like `window.releaseStoreClear`), record that as the reason it stays
  and describe the hook in your report: adding test-only surface to the app
  is the maintainer's decision.
- `e2e/bread.ts`, `e2e/scripts/mainnet-qa-wallet.ts` (wallet extension
  timing, another concern).
- `playwright.config.ts`, timeouts, retries, worker count.
- What the tests assert.

## Git workflow

- Branch: `test/e2e-waits-on-signals` from `main`.
- Conventional commit, e.g. `test(e2e): wait on signals in the workspace specs`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Start the web app and the API as `apps/web/e2e/README.md` describes, then run
both specs once and record their durations.

**Verify**: both pass. If one fails before any change, STOP.

### Step 2: The 45 s after `release()` (`projects.spec.ts:345`)

The deploy's remaining work is observable from the test: the held prover
request completes, then the transaction is submitted to the node. Replace
the sleep with waits on those network events, then the assertions:

- Before `release()`, start
  `const proved = page.waitForResponse(<the prover route's pattern used above in the same test>)`.
- After `release()`, `await proved;` then wait for the node's submit
  request to finish if the test can name it (look at how the spec's
  `provingStarted` promise and route are built a few lines above, and at
  the RPC host in `apps/web/lib/types/network.ts`). If only the prover
  response is observable, follow it with a short settle
  (`await page.waitForTimeout(5_000)`) and say so in a comment.

**Verify**: the spec passes with `--repeat-each=3 --retries=0`.

### Step 3: The 45 s "doesn't retry" (`workspace-switch.spec.ts:294`)

There is no event for "nothing more happened". Check whether the wait can be
bounded by something real instead of a guess: read how the deploy is started
(`startExample` in the spec, then the app's deploy hook it triggers,
`apps/web/hooks/use-examples.ts`) and find what a retry would have to wait
for (a timer, a sync tick). If a retry could only start within N seconds of
the failure, wait N plus a margin and write that reasoning in the comment.
If nothing bounds it, keep 45 s and replace the comment with the reason.

**Verify**: the spec passes; the comment above the wait states what the
duration is derived from.

### Step 4: The three short ones (`:158`, `:202`, `:272`)

- `:158` (ordering): find what "queued" means in the app (the second
  `openProject` sets the state the first switch will pick up:
  `docs/claude/saved-projects.md`, `State.nextState`). If the spec can
  observe it without a new hook (a menu closing, a toast, the switcher's
  label), wait on that. Otherwise leave it and record why.
- `:202` (Save does nothing): `savedStore(page, "Mine")` reads the saved
  project. Replace the sleep with a poll that the saved store stays equal
  for a short window only if the helper allows; otherwise leave it.
- `:272` (no re-import): the URL assertion already waited for navigation.
  Leave it unless a positive "settled" signal exists (e.g. the sync
  indicator in the header returning to idle).

For each one left in place, the comment above it must say what it waits for
and why no condition exists.

**Verify**: both specs pass with `--repeat-each=3 --retries=0`.

### Step 5: Format, typecheck, measure

**Verify**: `cd apps/web && pnpm exec biome check --write e2e/workspace-switch.spec.ts e2e/projects.spec.ts`
→ exit 0; `pnpm typecheck` → exit 0. Record the specs' new durations next to
step 1's.

## Test plan

The specs are the tests. `--repeat-each=3 --retries=0` on both is the flake
check; the before/after durations go in your report with, for each of the
five delays, "replaced by …" or "kept because …".

## Done criteria

- [ ] Both specs pass with `--repeat-each=3 --retries=0`
- [ ] `grep -c "waitForTimeout" apps/web/e2e/workspace-switch.spec.ts apps/web/e2e/projects.spec.ts` is lower than `4` and `1`, or every remaining one has a comment giving its reason
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `git status` shows only the two spec files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated, with the durations

## STOP conditions

- You can't run the local e2e setup (no Docker, no API, no compile
  service): this plan can't be done blind. Report.
- A spec fails before any change, or flakes on testnet's prover in a way
  unrelated to the delays (rerun once; if it persists, report).
- Removing a delay makes a spec pass in less time than the thing it guards
  against could take (the assertion became vacuous): put the delay back.

## Maintenance notes

- "Nothing happens" assertions need a bound that comes from the app (a
  timer length, a sync interval), not a guess: write the derivation next to
  the wait.
- Correction (review, 2026-11-11): a deploy-attempt counter would not
  remove the "doesn't retry" wait. The spec already counts attempts with
  `page.route`, and the hard part is showing that no retry ever comes.
  `releaseStoreClear` is not an app hook either: it is a test-side patch of
  `indexedDB.databases`. The likeliest thing to trigger a retry is the 2.5 s
  sync tick re-rendering `network-badge.tsx`'s deploy effect, so 45 s covers
  about 18 ticks.
- Outcome: only the `projects.spec.ts` wait was replaced, by the prover's
  answer plus 5 s. This holds only while the held proof outlasts the SDK's
  request deadline, so the abandoned deploy fails and never submits. The
  test therefore covers a deploy that fails after the switch, never one that
  succeeds late. Revision 2 (79b7913) adds a route on the node's
  `SubmitProvenTransaction`: if a submit is seen during the first 5 s
  settle, the test waits for its answer plus 5 s before asserting (none was
  seen in 4 runs). The 45 s retry comment now cites the sync tick.
