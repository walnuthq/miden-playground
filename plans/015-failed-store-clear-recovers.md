# Plan 015: A workspace switch recovers when clearing the store fails

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/hooks/use-app-state.ts`
> Plan 010 edits `syncState` and `syncAccounts` in this file: expected. If
> `popState` changed, compare it with the excerpt below; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Switching workspace (opening a project, a tutorial, a new sandbox) queues the
next state, then `popState` clears the SDK's IndexedDB store, imports the
next store and dispatches `POP_STATE`, which ends the switch. Every failure of
the import is handled with a fallback and a toast, but the clear itself runs
before the `try`. If it rejects, nothing dispatches `POP_STATE`: the app
stays in "switching" (no sync, Save disabled), and the effect that calls
`popState` retries it on every render. How often the clear rejects in
practice is unknown; the fix is moving one line.

## Current state

- `apps/web/hooks/use-app-state.ts:396-448` — `popState`:

  ```ts
  const popState = async () => {
    if (!nextState) {
      return;
    }
    const { nextStore, fallbackState } = nextState;
    await clearMidenStorage();
    try {
      // Synced below, so a sync failure isn't taken for a failed import.
      await importStore(storeDump(nextStore), storeName(networkId), {
        skipSync: true,
      });
      dispatch({ type: "POP_STATE", payload: { imported: nextState } });
    } catch (error) {
      // A saved project the running client refuses (e.g. written by a newer
      // one): start over from the fallback instead. The previous store is
      // cleared by now, so without a fallback it's a new sandbox.
      console.error("ERROR: importStore", error);
      const state = fallbackState ?? freshSandboxState(networkId);
      let fallbackImported = true;
      try {
        await importStore(storeDump(state.nextStore), storeName(networkId), {
          skipSync: true,
        });
      } catch (fallbackError) {
        console.error("ERROR: importStore", fallbackError);
        fallbackImported = false;
      }
      dispatch({
        type: "POP_STATE",
        payload: { imported: nextState, state },
      });
      if (!fallbackImported) {
        toast.error("The workspace couldn't be opened.", {
          description: "Reload the page to start a new sandbox.",
        });
      } else if (!fallbackState) {
        …
  ```

- `apps/web/components/lib/network-badge.tsx:58-74` — the caller; its comment
  states the invariant this plan restores:

  ```tsx
  const callPopState = async () => {
    callingPopState = true;
    try {
      // Every outcome of an import clears the state it was queued with, so
      // this doesn't run again for the same one.
      await popState();
    } catch (error) {
      console.error("ERROR: popState", error);
    } finally {
      callingPopState = false;
    }
  };
  ```

- `clearMidenStorage` is imported from `@miden-sdk/react` in
  `use-app-state.ts`.
- E2E specs that hold the clear on purpose (`e2e/workspace-switch.spec.ts`,
  helpers `holdNextStoreClear` / `releaseStoreClear`) depend on the clear
  still being awaited before the import.
- `docs/claude/saved-projects.md` documents this flow: read it before
  editing.

## Commands you will need

| Purpose       | Command                                                               | Expected on success |
| ------------- | --------------------------------------------------------------------- | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                                       | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                                            | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write hooks/use-app-state.ts` | exit 0              |

## Scope

**In scope**: `apps/web/hooks/use-app-state.ts` (`popState` only).

**Out of scope** (do NOT touch):

- `components/lib/network-badge.tsx`, the reducers, `lib/utils/store.ts`.
- The toasts' wording and the fallback logic.
- `apps/web/e2e/**`.

## Git workflow

- Branch: `fix/failed-store-clear` from `main`.
- Conventional commit, e.g. `fix(web): recover from a failed store clear on a workspace switch`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move the clear into the `try`

Move `await clearMidenStorage();` from above the `try {` to its first line,
and update the comments:

```ts
const { nextStore, fallbackState } = nextState;
try {
  await clearMidenStorage();
  // Synced below, so a sync failure isn't taken for a failed import.
  await importStore(storeDump(nextStore), storeName(networkId), {
    skipSync: true,
  });
  dispatch({ type: "POP_STATE", payload: { imported: nextState } });
} catch (error) {
  // The store couldn't be cleared, or the running client refuses the saved
  // project (e.g. written by a newer one): start over from the fallback
  // instead. Without a fallback it's a new sandbox.
  console.error("ERROR: importStore", error);
```

Leave everything else in the `catch` as it is: when the clear failed, the
fallback import is attempted on the uncleared store, and whatever its
outcome, `POP_STATE` is dispatched and a toast explains.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write hooks/use-app-state.ts` → exit 0;
`grep -n "await clearMidenStorage()" -B2 apps/web/hooks/use-app-state.ts`
→ the line before it is `try {` (inside `popState`).

## Test plan

- No unit test: `use-app-state.ts` imports the SDK and React context, which
  `node --test` can't load.
- E2E (operator, local: web :3000 + api :3001):
  `cd apps/web && pnpm test:e2e e2e/workspace-switch.spec.ts e2e/projects.spec.ts`
  must pass unchanged. Report plainly if you could not run them.
- Not asked for: a new spec forcing the clear to reject. The specs hold the
  clear with a window hook; a reject hook would be new test-only surface in
  app code, a decision for the maintainer.

## Done criteria

- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `git diff --stat` shows `apps/web/hooks/use-app-state.ts` only (and `plans/README.md`)
- [ ] In `popState`, `clearMidenStorage()` is called inside the `try`
- [ ] `plans/README.md` status row updated

## STOP conditions

- `popState` doesn't match the excerpt.
- `workspace-switch.spec.ts` fails after the change (the hold/release hooks
  wrap `clearMidenStorage` in a way that depends on where it's called).

## Maintenance notes

- After a failed clear, the fallback store is imported over whatever the old
  store still holds. The toast tells the user to reload when that import
  fails too.
- Anything added to `popState` before `POP_STATE` is dispatched must be
  inside the `try`, or the switch can hang again.
