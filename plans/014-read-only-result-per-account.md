# Plan 014: A read-only procedure's result shows only on the account it was read from

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/components/account/procedures-table-row.tsx apps/web/components/account/invoke-procedure-arguments-dialog.tsx apps/web/hooks/use-scripts.ts apps/web/components/global-context/reducer/script.ts apps/web/lib/types/state.ts apps/web/lib/utils/state.ts`
> Plans 008 and 009 edit `reducer/script.ts` and `use-scripts.ts`
> (`compileScript`): expected. On a mismatch with the excerpts below beyond
> that, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (run after 008 and 009 if they are in progress: same files)
- **Category**: bug
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

When a read-only procedure takes arguments, the Invoke dialog stores its
result in the global state, keyed by the procedure's digest. Every account
built from the same component has the same digest, so after reading
`get_x(arg)` on counter A, opening counter B shows A's value in B's row as if
it had been read from B. A wrong on-screen value in a tool people use to learn
how contracts behave is worth an S-sized fix.

## Current state

All paths under `apps/web/`.

- `lib/types/state.ts:73-74`:

  ```ts
  readOnlyProcedureDigest: string;
  readOnlyProcedureResult: string;
  ```

- `lib/utils/state.ts:64-65` (`defaultState`):

  ```ts
  readOnlyProcedureDigest: "",
  readOnlyProcedureResult: "",
  ```

  These two fields are not persisted (`stateSerializer` doesn't list them).

- `components/global-context/reducer/script.ts:52-55` and `:170-176`:

  ```ts
  | {
      type: "SET_READ_ONLY_PROCEDURE_RESULT";
      payload: { digest: string; result: string };
    };
  …
  case "SET_READ_ONLY_PROCEDURE_RESULT": {
    return {
      ...state,
      readOnlyProcedureDigest: action.payload.digest,
      readOnlyProcedureResult: action.payload.result,
    };
  }
  ```

- `hooks/use-scripts.ts:227-237` (and the hook reads and returns
  `readOnlyProcedureDigest`, `readOnlyProcedureResult` at lines 47-48 and
  250-251):

  ```ts
  const setReadOnlyProcedureResult = ({
    digest,
    result,
  }: {
    digest: string;
    result: string;
  }) =>
    dispatch({
      type: "SET_READ_ONLY_PROCEDURE_RESULT",
      payload: { digest, result },
    });
  ```

- `components/account/invoke-procedure-arguments-dialog.tsx:216-243` — three
  calls, all with `digest: procedureExport.digest`; the account is
  `senderAccountId`, in scope:

  ```tsx
  const word = await readWord({
    accountId: senderAccountId,
    script,
    procedureExport,
    procedureInputs,
  });
  if (procedureExport.signature.results.length === 1) {
    const [felt = 0n] = word.toU64s();
    setReadOnlyProcedureResult({
      digest: procedureExport.digest,
      result: felt.toString(),
    });
  } else if (procedureExport.signature.results.length === 4) {
    setReadOnlyProcedureResult({
      digest: procedureExport.digest,
      result: word.toHex(),
    });
  }
  } catch (error) {
    console.error(error);
    setReadOnlyProcedureResult({
      digest: procedureExport.digest,
      result: "ERROR",
    });
  }
  ```

- `components/account/procedures-table-row.tsx:48-69` — the row has an
  `account` prop:

  ```tsx
  const {
    invokeProcedure,
    openInvokeProcedureArgumentsDialog,
    readOnlyProcedureDigest,
    readOnlyProcedureResult,
  } = useScripts();
  …
  const [result, setResult] = useState("");
  useEffect(() => {
    if (
      procedureExport.digest === readOnlyProcedureDigest &&
      result !== readOnlyProcedureResult
    ) {
      setResult(readOnlyProcedureResult);
    }
  }, [
    procedureExport.digest,
    readOnlyProcedureDigest,
    result,
    readOnlyProcedureResult,
  ]);
  ```

- Tests: `components/global-context/reducer/script.test.ts` exists once plan
  008 has landed (`cd apps/web && pnpm test`). If it doesn't exist, skip the
  unit test of step 1 and say so.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**: the six files of the drift check, plus
`components/global-context/reducer/script.test.ts` if it exists.

**Out of scope** (do NOT touch):

- `readWord`, `invokeProcedure`, `canInvokeProcedure`,
  `isReadOnlyProcedure` (see `docs/claude/read-only-procedures.md`).
- The no-argument path of the row (it sets its local `result` directly and
  is already per-account).
- `stateSerializer` / `stateDeserializer`: the result stays unpersisted.

## Git workflow

- Branch: `fix/read-only-result-per-account` from `main`.
- Conventional commit, e.g. `fix(web): show a read-only result on its own account only`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Carry the account id in state

- `lib/types/state.ts`: add `readOnlyProcedureAccountId: string;` above
  `readOnlyProcedureDigest`.
- `lib/utils/state.ts` (`defaultState`): add
  `readOnlyProcedureAccountId: "",`.
- `reducer/script.ts`: payload becomes
  `{ accountId: string; digest: string; result: string }`, and the case also
  sets `readOnlyProcedureAccountId: action.payload.accountId`.
- If `reducer/script.test.ts` exists, add a test: the action sets the three
  fields.

**Verify**: `cd apps/web && pnpm typecheck` → fails only in
`hooks/use-scripts.ts` (the payload is incomplete): expected until step 2.

### Step 2: Pass it through the hook and the dialog

- `hooks/use-scripts.ts`: `setReadOnlyProcedureResult` takes and forwards
  `accountId`; read `readOnlyProcedureAccountId` from `useGlobalContext()`
  next to the other two and return it.
- `invoke-procedure-arguments-dialog.tsx`: add
  `accountId: senderAccountId,` to the three calls.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.
`grep -c "accountId: senderAccountId" apps/web/components/account/invoke-procedure-arguments-dialog.tsx`
→ at least `4` (the three new ones and the existing `readWord` call).

### Step 3: Compare it in the row

In `procedures-table-row.tsx`, read `readOnlyProcedureAccountId` from
`useScripts()` and change the effect's condition to:

```tsx
if (
  account.id === readOnlyProcedureAccountId &&
  procedureExport.digest === readOnlyProcedureDigest &&
  result !== readOnlyProcedureResult
) {
```

Add `account.id` and `readOnlyProcedureAccountId` to the dependency array.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write components/account hooks/use-scripts.ts components/global-context/reducer lib/types/state.ts lib/utils/state.ts`
→ exit 0 (Biome's `useExhaustiveDependencies` must not complain);
`pnpm test` → exit 0.

## Test plan

- Unit: the reducer case (if `script.test.ts` exists).
- E2E (operator, local: web :3000 + api :3001): the specs that invoke
  read-only procedures: `e2e/tutorial-6*.spec.ts`, `tutorial-9*`,
  `tutorial-10*` and `e2e/example-*.spec.ts`. Report plainly if you could
  not run them.
- Manual check for the operator: deploy two accounts from the same
  component with a read-only procedure that takes an argument; read it on
  the first; the second account's row stays empty.

## Done criteria

- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `cd apps/web && pnpm test` exits 0
- [ ] `grep -rn "readOnlyProcedureAccountId" apps/web --include=*.ts --include=*.tsx --exclude-dir=node_modules | wc -l` prints at least `7`
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code.
- `setReadOnlyProcedureResult` has a caller other than the dialog
  (`grep -rn "setReadOnlyProcedureResult" apps/web --include=*.tsx --include=*.ts --exclude-dir=node_modules`
  lists more than `use-scripts.ts` and the dialog).
- The dialog can be opened without a `senderAccountId`.

## Maintenance notes

- The result is still a single global slot: reading on account B replaces
  what A's row would pick up next. Rows keep their own copy in local state,
  so A's displayed value stays until A's page unmounts.
- If results ever need to survive navigation, key a map by
  `${accountId}:${digest}` instead of adding more scalar fields.
