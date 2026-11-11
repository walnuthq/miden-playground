# Plan 029: A submitted transaction keeps the account's multisig data and consumable notes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 398ba13..HEAD -- apps/web/components/global-context/reducer/transaction.ts apps/web/components/global-context/reducer/transaction.test.ts apps/web/hooks/use-transactions.ts`
> If any of them changed, compare the "Current state" excerpts against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plans 007, 008 and 010 are merged; this builds on
  their reducer tests)
- **Category**: bug
- **Planned at**: commit `398ba13`, 2026-11-10

## Why this matters

An account in the app's state holds two things the SDK's store doesn't know:
its multisig data (signers, proposals) and the list of notes it can consume.
When a transaction is submitted, the app rebuilds the account from the store
and passes neither, so the rebuilt account has no multisig data and an empty
list of consumable notes. The next sync, at most 2.5 s later, recomputes the
notes; nothing recomputes the multisig data. Plan 010 fixed the same omission
in the sync.

What a user can see today:

- After any transaction, the account's other consumable notes disappear from
  its page (the "Consume" alert and the notes table) until the next sync.
  A tutorial step that completes when "the counter has no consumable notes"
  (`your-first-smart-contract-and-custom-note/step7.tsx`) can read as
  completed during that window.
- The multisig loss is latent: at the planned commit, a multisig account
  doesn't submit through this path (its sends and consumes become proposals,
  recorded elsewhere). If one ever does, its Multisig tab and proposals
  vanish for good.

The fix also removes a staleness: the rebuild reads the previous account from
the hook's render-time copy, taken before the transaction was proven, which
can take tens of seconds.

## Current state

- `apps/web/hooks/use-transactions.ts:287-310`, in `recordTransaction`:

  ```ts
  const nextAccount = await client.getAccount(
    WasmAccountId.fromHex(accountId),
  );
  const previousAccount = accounts.find(
    ({ id }) => id === nextAccount?.id().toString(),
  );
  if (!transactionRecord || !nextAccount || !previousAccount) {
    throw new Error("Transaction record or account not found");
  }
  const transaction = wasmTransactionToTransaction({
    record: transactionRecord,
    result: transactionResult,
    scripts,
  });
  const account = wasmAccountToAccount({
    wasmAccount: nextAccount,
    name: previousAccount.name,
    components: previousAccount.components,
    updatedAt: lastSyncTime,
  });
  dispatch({
    type: "SUBMIT_TRANSACTION",
    payload: {
      transaction,
      account,
  ```

- `apps/web/lib/web-client.ts:556-574` — `wasmAccountToAccount` takes
  optional `multisig` and `consumableNoteIds = []` and copies them onto the
  account (`:619-621`). Not passed means `undefined` and `[]`.
- `apps/web/components/global-context/reducer/transaction.ts:76-99` — the
  reducer puts the payload's account in place of the current one:

  ```ts
  case "SUBMIT_TRANSACTION": {
    const index = state.accounts.findIndex(
      ({ id }) => id === action.payload.account.id,
    );
    if (index === -1) {
      // The account was deleted while its transaction was running.
      return {
        ...state,
        submittingTransaction: false,
        transactions: [...state.transactions, action.payload.transaction],
      };
    }
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
  }
  ```

- `apps/web/lib/types/transaction.ts` — a `Transaction` has
  `inputNotes: TransactionNote[]`, each with an `id` built by
  `note.id().toString()` (`web-client.ts:801`). An account's
  `consumableNoteIds` hold the same ids (they come from the state's input
  notes, `hooks/use-app-state.ts:94-103`).
- How the sync does it since plan 010 (`hooks/use-app-state.ts:105-112`):
  it passes `multisig: previousAccount.multisig` and the recomputed
  `consumableNoteIds`.
- Tests: `apps/web/components/global-context/reducer/transaction.test.ts`
  already covers `SUBMIT_TRANSACTION` with these helpers:

  ```ts
  const account = (id: string, extra: object = {}) =>
    ({ id, name: id, ...extra }) as unknown as Account;
  const transaction = (id: string) =>
    ({ id }) as unknown as State["transactions"][number];
  const state = (accounts: Account[], submitting = true) =>
    ({
      accounts,
      transactions: [],
      submittingTransaction: submitting,
    }) as unknown as State;
  ```

  Its test "SUBMIT_TRANSACTION appends and replaces the account in place"
  asserts `assert.equal(next.accounts[1], updated)` (same object). That
  assertion must change in step 1: the reducer will build a new object.
- The web unit tests run in plain node
  (`node --import ./test/alias.ts --test …`): the reducer file is loadable
  because its imports are type-only. Keep them type-only.

## Commands you will need

| Purpose       | Command                                                                                                    | Expected on success |
| ------------- | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| Unit tests    | `cd apps/web && pnpm test`                                                                                 | exit 0, `fail 0`    |
| Typecheck     | `cd apps/web && pnpm typecheck`                                                                            | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write components/global-context/reducer hooks/use-transactions.ts` | exit 0              |

## Scope

**In scope**:

- `apps/web/components/global-context/reducer/transaction.ts`
  (the `SUBMIT_TRANSACTION` case only)
- `apps/web/components/global-context/reducer/transaction.test.ts`
- `apps/web/hooks/use-transactions.ts` (a comment in `recordTransaction`
  only)

**Out of scope** (do NOT touch):

- `wasmAccountToAccount` and its other callers (`use-accounts.ts`,
  `use-multisig.ts`, `use-app-state.ts`).
- The account's `name` and `components`: the hook still passes them from its
  render-time copy. Same staleness in principle, but nothing in the app
  renames an account or changes its components while a transaction runs;
  leave it.
- The multisig proposal flows in `use-multisig.ts`: they update the account
  through `UPDATE_ACCOUNT` and already pass `multisig`.
- `packages/ui/src/components`.

## Git workflow

- Branch: `fix/submitted-transaction-keeps-account-data` from `main`.
- Conventional commit, e.g.
  `fix(web): keep multisig data and consumable notes after a transaction`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Tests first

In `transaction.test.ts`:

1. In "SUBMIT_TRANSACTION appends and replaces the account in place",
   replace `assert.equal(next.accounts[1], updated);` with:

   ```ts
   assert.equal(next.accounts[1]?.id, "b");
   assert.equal(next.accounts[1]?.name, "after");
   ```

   and build the two `b` accounts with a list so the reducer has one to
   filter: `account("b", { consumableNoteIds: [] })` for the one in the state
   and `account("b", { name: "after", consumableNoteIds: [] })` for
   `updated`. Give `tx` no input notes:
   `({ id: "t", inputNotes: [] }) as unknown as State["transactions"][number]`
   (extend the `transaction` helper with an optional second argument
   `inputNoteIds: string[] = []` that maps to `inputNotes: ids.map((id) => ({ id }))`,
   and use it everywhere).

2. Add:

   ```ts
   test("SUBMIT_TRANSACTION keeps what only the app knows about the account", () => {
     const multisig = { config: {}, proposals: [] };
     const current = account("b", {
       multisig,
       consumableNoteIds: ["n1", "n2", "n3"],
     });
     // As rebuilt from the store: no multisig data, no consumable notes.
     const rebuilt = account("b", { nonce: 2, consumableNoteIds: [] });
     const next = reducer(state([account("a"), current]), {
       type: "SUBMIT_TRANSACTION",
       payload: { transaction: transaction("t", ["n2"]), account: rebuilt },
     } as Action);
     const updated = next.accounts[1] as unknown as Record<string, unknown>;
     assert.equal(updated.nonce, 2);
     assert.equal(updated.multisig, multisig);
     // Minus the note the transaction consumed.
     assert.deepEqual(updated.consumableNoteIds, ["n1", "n3"]);
   });
   ```

   The "deleted account" test needs only the helper change.

**Verify**: `cd apps/web && pnpm test` → the new test FAILS (multisig is
`undefined`). Expected at this point.

### Step 2: The reducer keeps the app-held fields

In `transaction.ts`, in the `SUBMIT_TRANSACTION` case, after the
`index === -1` block, build the account from the payload and the current
one, and use it in the returned list instead of `action.payload.account`:

```ts
// The payload's account is rebuilt from the store, which doesn't hold
// its multisig data or the notes it can consume: keep the current ones,
// minus the notes this transaction consumed.
const current = state.accounts[index]!;
const consumedNoteIds = action.payload.transaction.inputNotes.map(
  ({ id }) => id,
);
const account = {
  ...action.payload.account,
  multisig: current.multisig,
  consumableNoteIds: current.consumableNoteIds.filter(
    (id) => !consumedNoteIds.includes(id),
  ),
};
```

If Biome rejects the non-null assertion (`!`), read `current` before the
`index === -1` check instead
(`const current = state.accounts.find(({ id }) => id === action.payload.account.id)`
and test `if (!current)`), keeping `index` for the slices. Add no import.

**Verify**: `cd apps/web && pnpm test` → exit 0, `fail 0`;
`pnpm typecheck` → exit 0.

### Step 3: Say so where the account is rebuilt

In `use-transactions.ts`, above `const account = wasmAccountToAccount({` in
`recordTransaction`, add:

```ts
// Its multisig data and consumable notes aren't in the store: the reducer
// keeps the current ones (SUBMIT_TRANSACTION).
```

Change nothing else in the hook.

**Verify**: the Lint + format command → exit 0;
`git diff --stat` → the three in-scope files only.

## Test plan

- Unit: step 1's tests.
- Local e2e (operator, or you if the stack is up: web on :3000, `apps/api`
  on :3001, see `apps/web/e2e/README.md`): the tutorials that consume notes
  and the multisig one must still pass, e.g.
  `cd apps/web && pnpm test:e2e e2e/tutorial-1` … pick the specs by name
  with `ls apps/web/e2e/tutorial-*.spec.ts`: tutorial 1 (mint and consume),
  the smart-contract-and-custom-note tutorial (its step 7 reads
  `consumableNoteIds`), and the Guardian wallet backup tutorial (multisig).
  Never edit `apps/web` files while a Playwright run is in progress.
- By hand, optional: fund a wallet twice, consume one of the two notes; the
  other stays listed on the account page right after the transaction, with
  no blink.

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0, including the new test
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `pnpm lint` (repo root) exits 0
- [ ] `grep -n "current.multisig" apps/web/components/global-context/reducer/transaction.ts` prints one line
- [ ] `git status` shows only the three in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated, saying whether the local e2e ran

## STOP conditions

- The `SUBMIT_TRANSACTION` case or `recordTransaction` no longer match the
  excerpts.
- `Transaction.inputNotes` is gone or its ids are not built with
  `note.id().toString()` (the filter would silently match nothing).
- A spec fails after the change because a step relied on the consumable
  notes being emptied by a transaction: report which one; don't adapt the
  spec.
- You find a path where a multisig account's transaction is recorded through
  `SUBMIT_TRANSACTION` with fresher proposals in the payload than in the
  state: then the reducer must not overwrite them; report.

## Maintenance notes

- Rule this encodes: an account rebuilt from the SDK's store must get the
  fields the store doesn't hold (`multisig`, `consumableNoteIds`) from the
  app's current state, not from a render-time copy. A new app-only field on
  `Account` needs the same treatment here and in the sync
  (`hooks/use-app-state.ts`).
- The sync still recomputes `consumableNoteIds` every 2.5 s; this plan only
  covers the window before the next one.
