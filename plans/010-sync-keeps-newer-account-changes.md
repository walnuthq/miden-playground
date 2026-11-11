# Plan 010: A sync never restores a deleted account or reverts a newer update

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/hooks/use-app-state.ts apps/web/components/global-context/reducer/state.ts`
> If either changed, compare the "Current state" excerpts against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (the core sync merge)
- **Depends on**: plans/007-web-reducer-and-store-tests.md
- **Category**: bug
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

The app syncs every 2.5 s. A sync captures the accounts when it starts, works
for a while (RPC calls), then dispatches `SYNC_STATE` with its own copy of
every captured account. Anything that happened to an account in between is
overwritten: an account deleted during the sync comes back, and an account
updated by a transaction or a multisig action goes back to its older copy.
For private and multisig accounts the stale copy sticks, because the sync
never re-reads them from the client. Separately, a public account that carries
`multisig` data loses it on its first sync.

## Current state

- `apps/web/hooks/use-app-state.ts:277-336` — `syncState`. `previousAccounts`
  is the `accounts` array of the render the function was created in:

  ```ts
  const syncedAccounts = syncAccounts({
    previousAccounts,
    wasmAccounts,
    updatedAt: lastSyncTime,
    inputNotes: syncedInputNotes,
    connectedWallet,
    midenWalletAssets,
  });
  dispatch({
    type: "SYNC_STATE",
    payload: {
      accounts: syncedAccounts,
      inputNotes: syncedInputNotes,
      transactions: syncTransactions({
        previousTransactions,
        wasmTransactionRecords,
      }),
    },
  });
  ```

- `apps/web/hooks/use-app-state.ts:81-163` — `syncAccounts` returns one
  entry per account of `previousAccounts`: public ones rebuilt from the
  client, the others spread from the captured copy. The public branch:

  ```ts
  return [
    wasmAccountToAccount({
      wasmAccount,
      name: previousAccount.name,
      components: previousAccount.components,
      updatedAt,
      consumableNoteIds,
    }),
  ];
  ```

  `wasmAccountToAccount` (`apps/web/lib/web-client.ts:556-574`) accepts an
  optional `multisig?: AccountMultisig`, not passed here.

- `apps/web/components/global-context/reducer/state.ts:42-63`:

  ```ts
  case "SYNC_STATE": {
    // The payload is built from the accounts and transactions as they were
    // when the sync started: keep the ones added while it was running.
    const { accounts, inputNotes, transactions } = action.payload;
    return {
      ...state,
      accounts: [
        ...accounts,
        ...state.accounts.filter(
          ({ id }) => !accounts.some((account) => account.id === id),
        ),
      ],
      inputNotes,
      transactions: [ … same pattern … ],
      syncingState: false,
    };
  }
  ```

  The `StateAction` member for `SYNC_STATE` is declared at the top of the
  same file (`payload: { accounts: Account[]; inputNotes: InputNote[];
  transactions: Transaction[] }`).

- Reducers keep an account's object identity unless they change it:
  `UPDATE_ACCOUNT`, `SUBMIT_TRANSACTION` and `SYNC_STATE` put new objects in
  `state.accounts`; everything else spreads the array. So "the account in
  state is still the object the sync started from" is a reliable test for "it
  wasn't touched since".

- `apps/web/hooks/use-accounts.ts:156-162` — `deleteAccount` dispatches
  `DELETE_ACCOUNT` immediately and doesn't pause the sync loop.
- Dispatches are bound to a workspace: `State.workspaceRun` drops a
  `SYNC_STATE` that arrives after a workspace switch
  (`components/global-context/provider.tsx:22-29`). Not affected here.
- Tests: `reducer/state.test.ts` exists (plan 007), run by
  `cd apps/web && pnpm test`.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0, `fail 0`    |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**:

- `apps/web/components/global-context/reducer/state.ts`, `state.test.ts`
- `apps/web/hooks/use-app-state.ts` (the `SYNC_STATE` dispatch and the public
  branch of `syncAccounts`)

**Out of scope** (do NOT touch):

- `inputNotes` and `transactions` merging in `SYNC_STATE`.
- The sync interval and its conditions (`components/lib/network-badge.tsx`).
- `deleteAccount`, `use-multisig.ts`, `lib/web-client.ts`.
- The private/multisig/connected-wallet branches of `syncAccounts`.

## Git workflow

- Branch: `fix/sync-keeps-newer-account-changes` from `main`.
- Conventional commit, e.g. `fix(web): keep account changes made during a sync`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Tests first

In `reducer/state.test.ts`, the existing `SYNC_STATE` test must keep passing
once it passes `previousAccounts` (see step 2). Add:

1. An account present when the sync started (`previousAccounts` holds it) and
   missing from `state.accounts` now is NOT in the result.
2. An account whose object in `state.accounts` is not the one in
   `previousAccounts` (same id, new object) keeps the state object, not the
   payload's.
3. An untouched account (same object in `state.accounts` and
   `previousAccounts`) is replaced by the payload's.
4. An account added during the sync (in `state.accounts`, in neither
   `previousAccounts` nor the payload) is kept, after the synced ones.

**Verify**: `cd apps/web && pnpm test` → the new cases fail (or don't
compile); nothing else fails.

### Step 2: Merge in the reducer

Add `previousAccounts: Account[]` to the `SYNC_STATE` payload type, and
replace the `accounts:` expression:

```ts
case "SYNC_STATE": {
  // The payload is built from the accounts and transactions as they were
  // when the sync started (previousAccounts). An account deleted or changed
  // since then stays as it is now, and the ones added meanwhile are kept.
  const { accounts, previousAccounts, inputNotes, transactions } =
    action.payload;
  const untouched = (id: string) => {
    const current = state.accounts.find((account) => account.id === id);
    return (
      current !== undefined &&
      current === previousAccounts.find((account) => account.id === id)
    );
  };
  const syncedAccounts = accounts.filter(({ id }) => untouched(id));
  return {
    ...state,
    accounts: [
      ...syncedAccounts,
      ...state.accounts.filter(
        ({ id }) => !syncedAccounts.some((account) => account.id === id),
      ),
    ],
    …
```

Leave `inputNotes`, `transactions` and `syncingState` as they are.

**Verify**: `cd apps/web && pnpm test` → exit 0.

### Step 3: Pass `previousAccounts` from `syncState`

In `hooks/use-app-state.ts`, add `previousAccounts,` to the `SYNC_STATE`
payload. It must be the same array that `syncAccounts` received.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0 (it fails until the
payload is complete: that is the check that no other `SYNC_STATE` dispatch
exists; `grep -rn '"SYNC_STATE"' apps/web --include=*.ts --include=*.tsx`
must list only `use-app-state.ts`, `reducer/state.ts`, `reducer/index.ts`
and the test).

### Step 4: Keep `multisig` on re-read public accounts

In the public branch of `syncAccounts` (the `wasmAccountToAccount({ … })`
call quoted above), add `multisig: previousAccount.multisig,`.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write hooks/use-app-state.ts components/global-context/reducer`
→ exit 0; `pnpm test` → exit 0.

## Test plan

- Unit: the four cases of step 1, in `reducer/state.test.ts`.
- E2E (operator, local: web :3000 + api :3001): the full local suite,
  because every spec depends on the sync: `cd apps/web && pnpm test:e2e`.
  In particular `e2e/tutorial-1*.spec.ts`, `e2e/tutorial-2*.spec.ts`,
  `e2e/projects.spec.ts`, `e2e/workspace-switch.spec.ts` and the multisig
  tutorial (tutorial 5). Report plainly if you could not run them.

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0 with the four new cases
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `grep -n "previousAccounts" apps/web/components/global-context/reducer/state.ts` → at least 2 matches
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code.
- A unit test shows `SUBMIT_TRANSACTION` or `UPDATE_ACCOUNT` keeping the
  account's object identity (then the identity test in step 2 can't tell a
  touched account: report).
- An e2e spec fails because an account's balance or consumable notes stop
  updating (the "touched" branch then holds on to a stale account for more
  than one sync: report the spec and the account kind).

## Maintenance notes

- An account touched during a sync now skips that one sync's update and gets
  the next one, 2.5 s later.
- Private, multisig and connected-wallet accounts are still spread from the
  captured copy inside `syncAccounts`; with this plan a stale copy can no
  longer overwrite a newer one, because the reducer drops it.
- `inputNotes` is still replaced wholesale: a note added with `ADD_NOTE`
  during a sync disappears until the next sync reads it from the client. Not
  changed here.
- Reviewer: check that nothing mutates account objects in place (the
  identity test relies on it).
