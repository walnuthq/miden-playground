# Plan 017: The app state is written to storage once per change and never read back

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/components/global-context/provider.tsx apps/web/lib/utils/state.ts`
> Plan 014 adds one field to `defaultState` in `lib/utils/state.ts`:
> expected. If `provider.tsx`, `stateSerializer` or `stateDeserializer`
> changed, compare with the excerpts below; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (the persistence of all user work)
- **Depends on**: plans/010-sync-keeps-newer-account-changes.md (same sync path: land and e2e-verify 010 first)
- **Category**: perf
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

The app keeps its state in a reducer and mirrors it to `localStorage` with
`usehooks-ts`'s `useLocalStorage`. The mirror is written from inside the
reducer function, and each write makes the hook read the value back and run
the full deserializer (parse, script migration, built-in script merge), whose
result nothing uses. So every dispatch costs a full `JSON.stringify` of all
scripts (with their compiled packages), accounts, notes and transactions, a
synchronous storage write, then a full parse and migration, on the main
thread. A sync tick dispatches twice every 2.5 s; opening a dialog dispatches
too. The reducer also has a side effect, which React's StrictMode runs twice
in development. This plan writes once per real change, skips changes that
aren't persisted, and never reads back. The cost was reasoned from the code,
not profiled.

## Current state

- `apps/web/components/global-context/provider.tsx:17-37`:

  ```tsx
  const usePersistedReducer = () => {
    const [state, setState] = useLocalStorage(STATE_STORAGE_KEY, defaultState(), {
      serializer: stateSerializer,
      deserializer: stateDeserializer,
    });
    const persistedReducer = useCallback(
      (prevState: State, action: RunAction) => {
        if (
          action.workspaceRun !== undefined &&
          action.workspaceRun !== prevState.workspaceRun
        ) {
          return prevState;
        }
        const nextState = reducer(prevState, action);
        setState(nextState);
        return nextState;
      },
      [setState],
    );
    return useReducer(persistedReducer, state);
  };
  ```

- `usehooks-ts` `useLocalStorage` (in
  `apps/web/node_modules/usehooks-ts/dist/index.js`): `setValue` does
  `window.localStorage.setItem(key, serializer(newValue))`, then
  `window.dispatchEvent(new StorageEvent("local-storage", { key }))`; the
  hook's own listener answers with `setStoredValue(readValue())`, and
  `readValue` is `getItem` + `deserializer`. The initial value is
  `readValue()` too: the stored string passed to `deserializer`, or the
  initial value when the key is absent. The stored string is exactly
  `stateSerializer(state)`.

- `apps/web/lib/utils/state.ts`:
  - `export const STATE_STORAGE_KEY = "state";` (line 15)
  - `export const defaultState = (): State => ({ … })` (line 17)
  - `export const stateSerializer = ({ … }: State) => JSON.stringify({ … })`
    (lines 93-133) destructures exactly the persisted fields:
    `serializedMockChain, accounts, transactions, inputNotes, scripts,
    components, tutorialId, tutorialStep, tutorialMaxStep,
    tutorialStartBlockNum, tutorialRunId, tutorialOpen,
    nextTutorialStepDisabled, completedTutorials, tutorialProgress,
    exampleId, projectId, projectName`. Everything else in `State` (dialog
    flags, `syncingState`, `submittingTransaction`, `nextState`,
    `workspaceRun`, …) is not persisted.
  - `export const stateDeserializer = (value: string): State` (line 190)
    wraps its body in a `try` and returns a full `State`.

- Other users of the key:
  `apps/web/components/providers/miden-provider.tsx:34`
  (`localStorage.removeItem(STATE_STORAGE_KEY)`, on a store reset) and
  `apps/web/e2e/retired-built-ins.spec.ts:22-27` (reads and rewrites
  `localStorage.getItem("state")`). Nothing else listens to the
  `local-storage` event or calls `useLocalStorage` with this key.
- `apps/web/main.tsx` renders under `<StrictMode>`.
- Reducers return the same `state` object when they ignore an action, and
  new objects only for what they change (`{ ...state, field }`), so comparing
  the persisted fields by reference tells whether anything persisted
  changed.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0              |
| Build         | `cd apps/web && pnpm build`                            | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**:

- `apps/web/components/global-context/provider.tsx`
- `apps/web/lib/utils/state.ts` (add one exported list; `stateSerializer`
  and `stateDeserializer` bodies unchanged)

**Out of scope** (do NOT touch):

- The storage key, the stored format, `stateSerializer`'s output.
- Debouncing or deferring the write (`requestIdleCallback`, timers): the e2e
  specs and the saved-projects flow read storage right after an action.
- `components/providers/miden-provider.tsx`, the reducers, `usehooks-ts`
  itself (other code may use its other hooks: check before removing the
  dependency, and don't).
- Splitting the context or making `SYNC_STATE` keep array identities.

## Git workflow

- Branch: `perf/persist-state-once` from `main`.
- Conventional commit, e.g. `perf(web): persist the state once per change`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Name the persisted fields

In `lib/utils/state.ts`, above `stateSerializer`, add:

```ts
// The fields stateSerializer writes: keep the two in step. A change to any
// other field (a dialog flag, syncingState) isn't worth a write.
export const PERSISTED_KEYS = [
  "serializedMockChain",
  "accounts",
  "transactions",
  "inputNotes",
  "scripts",
  "components",
  "tutorialId",
  "tutorialStep",
  "tutorialMaxStep",
  "tutorialStartBlockNum",
  "tutorialRunId",
  "tutorialOpen",
  "nextTutorialStepDisabled",
  "completedTutorials",
  "tutorialProgress",
  "exampleId",
  "projectId",
  "projectName",
] as const satisfies readonly (keyof State)[];
```

**Verify**: compare the list with the destructured parameter of
`stateSerializer` field by field: same 18 names.
`cd apps/web && pnpm typecheck` → exit 0.

### Step 2: Replace `useLocalStorage` in the provider

`usePersistedReducer` becomes (imports: `useEffect`, `useReducer`, `useRef`
from `react`; `PERSISTED_KEYS` from `@/lib/utils/state`; remove the
`usehooks-ts` and `useCallback`-for-the-reducer imports if unused):

```tsx
// The state as it was last persisted, or the default one.
const readPersistedState = (): State => {
  try {
    const value = localStorage.getItem(STATE_STORAGE_KEY);
    return value === null ? defaultState() : stateDeserializer(value);
  } catch {
    // Storage can throw when it's blocked.
    return defaultState();
  }
};

const persistedReducer = (prevState: State, action: RunAction) =>
  action.workspaceRun !== undefined &&
  action.workspaceRun !== prevState.workspaceRun
    ? prevState
    : reducer(prevState, action);

const usePersistedReducer = () => {
  const [state, dispatch] = useReducer(
    persistedReducer,
    undefined,
    readPersistedState,
  );
  // Written after the render that changed it, and only when a persisted
  // field did: the reducer stays pure, and a dialog opening costs no write.
  const persisted = useRef(state);
  useEffect(() => {
    const previous = persisted.current;
    if (
      previous !== state &&
      PERSISTED_KEYS.some((key) => previous[key] !== state[key])
    ) {
      try {
        localStorage.setItem(STATE_STORAGE_KEY, stateSerializer(state));
      } catch (error) {
        console.warn("Error persisting the state:", error);
      }
    }
    persisted.current = state;
  }, [state]);
  return [state, dispatch] as const;
};
```

`GlobalContextProvider` below it is unchanged.

Note on the first render: before this change a first visit wrote the default
state to storage only after the first dispatch; the same holds now.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`grep -n "usehooks-ts\|setState(" apps/web/components/global-context/provider.tsx`
→ no match.

### Step 3: Checks

**Verify**: `cd apps/web && pnpm exec biome check --write components/global-context/provider.tsx lib/utils/state.ts`
→ exit 0; `pnpm test` → exit 0; `pnpm build` → exit 0.

## Test plan

- No unit test: the provider is a React component, and `lib/utils/state.ts`
  can't be loaded by `node --test` (its graph reads `import.meta.env`).
- E2E (operator, local: web :3000 + api :3001): the whole suite,
  `cd apps/web && pnpm test:e2e`, because every spec depends on persistence.
  The ones that exercise it directly: `e2e/retired-built-ins.spec.ts`
  (rewrites the stored state and reloads), `e2e/projects.spec.ts`,
  `e2e/workspace-switch.spec.ts`, the tutorial resume specs. Report plainly
  if you could not run them.
- Manual check for the operator: edit a script, reload: the edit is there.
  Open and close a dialog with the browser's Application → Local Storage
  panel open: the `state` entry is not rewritten.

## Done criteria

- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `cd apps/web && pnpm build` exits 0
- [ ] `grep -rn "useLocalStorage" apps/web/components/global-context` → no match
- [ ] `grep -c '"' <(sed -n '/export const PERSISTED_KEYS/,/as const/p' apps/web/lib/utils/state.ts)` prints `18`
- [ ] `git status` shows only the two in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code.
- Something else relies on the `local-storage` event or on a second
  `useLocalStorage(STATE_STORAGE_KEY, …)` (grep `apps/web` for both).
- `e2e/retired-built-ins.spec.ts` or a resume/projects spec fails: the spec
  may read storage before the effect ran. Report the spec and the line; do
  not add waits to specs or move the write back into the reducer.
- A persisted field is mutated in place somewhere (the reference comparison
  would then miss a change): report where.

## Maintenance notes

- A field added to `stateSerializer` must be added to `PERSISTED_KEYS`, or
  its changes alone won't be written. The comment says so; a reviewer should
  check both in any diff touching either.
- `SYNC_STATE` still builds new `accounts`, `inputNotes` and `transactions`
  arrays on every tick, so each sync still writes once. Making it keep the
  previous arrays when nothing changed would remove that write and most
  re-renders; it is the natural follow-up, with plan 010's reducer tests as
  its safety net.
- The write is still synchronous and still serializes everything: a
  workspace with many compiled packages pays for it on each real change.
