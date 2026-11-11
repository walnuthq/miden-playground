# Plan 008: Reducers leave the lists alone when the item to update is gone

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/components/global-context/reducer`
> Plan 007 adds `*.test.ts` files there: expected. If a reducer `.ts` file
> changed, compare the "Current state" excerpts against the live code; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/007-web-reducer-and-store-tests.md
- **Category**: bug
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Six reducer cases find an item with `findIndex` and rebuild the list with
`slice(0, index)` and `slice(index + 1)`. When the item is not there, `index`
is `-1`: `slice(0, -1)` is the list without its last item and `slice(0)` is
the whole list, so the result is the list duplicated (minus one item, plus the
payload for updates). That happens when an operation finishes after its
target was deleted: a compile answering after its script was deleted, a
transaction or multisig update landing after its account was deleted. The
duplicates get persisted to localStorage and produce duplicate React keys.

## Current state

All in `apps/web/components/global-context/reducer/`.

- `script.ts:90-118`:

  ```ts
  case "UPDATE_SCRIPT": {
    const index = state.scripts.findIndex(
      ({ id }) => id === action.payload.script.id,
    );
    return {
      ...state,
      scripts: [
        ...state.scripts.slice(0, index),
        {
          ...(state.scripts[index] ?? defaultScript()),
          ...action.payload.script,
          updatedAt: Date.now(),
        },
        ...state.scripts.slice(index + 1),
      ],
    };
  }
  case "DELETE_SCRIPT": {
    const index = state.scripts.findIndex(
      ({ id }) => id === action.payload.scriptId,
    );
    return {
      ...state,
      scripts: [
        ...state.scripts.slice(0, index),
        ...state.scripts.slice(index + 1),
      ],
    };
  }
  ```

  `script.ts:3` is `import { defaultScript } from "@/lib/utils/script";`, the
  file's only value import, used only in `UPDATE_SCRIPT`. No caller relies on
  `UPDATE_SCRIPT` creating a script: scripts are added with `NEW_SCRIPT` and
  `IMPORT_SCRIPTS`; `UPDATE_SCRIPT` is dispatched from
  `hooks/use-scripts.ts` (`compileScript`, `updateScript`), and `updateScript`
  is called by `hooks/use-apply-code.ts`, `components/lib/editor.tsx`,
  `components/script/dependencies-table.tsx` and
  `components/script/add-dependency-dialog.tsx`, always for an existing
  script.

- `account.ts:66-89`:

  ```ts
  case "DELETE_ACCOUNT": {
    const index = state.accounts.findIndex(
      ({ id }) => id === action.payload.accountId,
    );
    return {
      ...state,
      accounts: [
        ...state.accounts.slice(0, index),
        ...state.accounts.slice(index + 1),
      ],
    };
  }
  case "UPDATE_ACCOUNT": {
    const index = state.accounts.findIndex(
      ({ id }) => id === action.payload.account.id,
    );
    return {
      ...state,
      accounts: [
        ...state.accounts.slice(0, index),
        { ...action.payload.account, updatedAt: Date.now() },
        ...state.accounts.slice(index + 1),
      ],
    };
  }
  ```

- `transaction.ts:76-90`:

  ```ts
  case "SUBMIT_TRANSACTION": {
    const index = state.accounts.findIndex(
      ({ id }) => id === action.payload.account.id,
    );
    return {
      ...state,
      submittingTransaction: false,
      transactions: [...state.transactions, action.payload.transaction],
      accounts: [
        ...state.accounts.slice(0, index),
        action.payload.account,
        ...state.accounts.slice(index + 1),
      ],
      // serializedMockChain: action.payload.serializedMockChain,
    };
  ```

- `component.ts:63-75`:

  ```ts
  case "UPDATE_COMPONENT": {
    const index = state.components.findIndex(
      ({ id }) => id === action.payload.component.id,
    );
    return {
      ...state,
      components: [
        ...state.components.slice(0, index),
        { ...action.payload.component, updatedAt: Date.now() },
        ...state.components.slice(index + 1),
      ],
    };
  }
  ```

- Tests: plan 007 created `account.test.ts`, `transaction.test.ts`,
  `component.test.ts`, `state.test.ts` next to the reducers, run by
  `cd apps/web && pnpm test` (`node --import ./test/alias.ts --test …`).
  `script.ts` could not be loaded by the tests because of its
  `@/lib/utils/script` value import (that module reads `import.meta.env`).

## Commands you will need

| Purpose       | Command                                                                          | Expected on success |
| ------------- | -------------------------------------------------------------------------------- | ------------------- |
| Unit tests    | `cd apps/web && pnpm test`                                                       | exit 0, `fail 0`    |
| Typecheck     | `cd apps/web && pnpm typecheck`                                                  | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write components/global-context/reducer` | exit 0              |

## Scope

**In scope**: `apps/web/components/global-context/reducer/script.ts`,
`account.ts`, `transaction.ts`, `component.ts`, their `*.test.ts` files
(`script.test.ts` is created).

**Out of scope** (do NOT touch):

- `SYNC_STATE` in `reducer/state.ts` (plan 010).
- The hooks and components that dispatch these actions.
- `lib/utils/script.ts`.

## Git workflow

- Branch: `fix/reducers-missing-items` from `main`.
- Conventional commit, e.g. `fix(web): ignore reducer updates for deleted items`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the failing tests

Add to the existing test files, and create `script.test.ts` (it will only
load after step 2: write it now, expect it to fail to load until then):

- `account.test.ts`: `DELETE_ACCOUNT` with an unknown `accountId` returns
  the same `state` object (`assert.equal(next, state)`); `UPDATE_ACCOUNT` for
  an unknown id returns the same `state` object.
- `transaction.test.ts`: `SUBMIT_TRANSACTION` whose `payload.account.id` is
  unknown appends the transaction, sets `submittingTransaction: false` and
  leaves `accounts` deep-equal to before (same length, same items).
- `component.test.ts`: `UPDATE_COMPONENT` for an unknown id returns the same
  `state` object.
- `script.test.ts`: `UPDATE_SCRIPT` for an existing script merges the payload
  over it and keeps the others' identity; for an unknown id returns the same
  `state` object; `DELETE_SCRIPT` removes an existing script; for an unknown
  id returns the same `state` object.

**Verify**: `cd apps/web && pnpm test` → fails, in the new cases only.

### Step 2: Fix the six cases

In each of the six cases, right after the `findIndex`, add:

```ts
if (index === -1) {
  return state;
}
```

except `SUBMIT_TRANSACTION`, which must still record the transaction:

```ts
if (index === -1) {
  // The account was deleted while its transaction was running.
  return {
    ...state,
    submittingTransaction: false,
    transactions: [...state.transactions, action.payload.transaction],
  };
}
```

In `UPDATE_SCRIPT`, replace `...(state.scripts[index] ?? defaultScript()),`
with `...state.scripts[index],` and delete the now-unused
`import { defaultScript } from "@/lib/utils/script";` line.

**Verify**: `grep -n "defaultScript" apps/web/components/global-context/reducer/script.ts`
→ no match. `cd apps/web && pnpm test` → exit 0, `fail 0`.

### Step 3: Checks

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write components/global-context/reducer` → exit 0;
`pnpm test` → exit 0.

## Test plan

The cases of step 1, in the files plan 007 created plus the new
`script.test.ts`, modelled on `account.test.ts`.

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0, including `script.test.ts`
- [ ] `grep -c "index === -1" apps/web/components/global-context/reducer/{script,account,transaction,component}.ts` prints `2`, `2`, `1`, `1`
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The reducer excerpts don't match the live code.
- `pnpm typecheck` fails in `UPDATE_SCRIPT` after removing the
  `defaultScript()` fallback in a way a type annotation on the merged object
  doesn't fix.
- `script.test.ts` still fails to load after step 2 (another value import
  appeared in `script.ts`).
- Plan 007 is not merged (no `apps/web/test/alias.ts`).

## Maintenance notes

- New "update by id" reducer cases: use `map`, or check `index === -1`.
- `reducer/script.ts` now has only type imports, so it is unit-testable;
  plan 009 adds a value import of `@/lib/utils/script-files`, which loads in
  node too.
- A reviewer should check that `SUBMIT_TRANSACTION` still clears
  `submittingTransaction` on the new early return: the sync loop waits on it.
