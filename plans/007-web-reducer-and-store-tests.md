# Plan 007: The web app's reducers and store helpers have unit tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/package.json apps/web/lib/utils/store.ts apps/web/lib/utils/project.ts apps/web/components/global-context/reducer`
> If any of these changed, compare the "Current state" excerpts against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

All of the web app's state goes through the reducers in
`apps/web/components/global-context/reducer/` (906 lines), and
`apps/web/lib/utils/store.ts` and `project.ts` decide whether a returning
user's IndexedDB store is deleted and whether a saved project can be restored.
None of it has a unit test: only local Playwright runs exercise it, from fresh
state. Plans 008, 009, 010 and 014 change these reducers and need a place to
put regression tests. This plan adds the harness and characterization tests of
today's behaviour, without changing behaviour.

## Current state

- `apps/web/package.json` — the unit-test script:

  ```json
  "test": "node --test 'lib/**/*.test.ts'",
  ```

- Tests run with plain `node` (Node 26, built-in type stripping, no `tsx`, no
  vitest). Plain node cannot resolve the `@/` path alias of
  `apps/web/tsconfig.json` (`"@/*": ["./*"]`), so every existing test imports
  with relative paths and `.ts` extensions. Exemplar,
  `apps/web/lib/utils/tutorial-status.test.ts:1-3`:

  ```ts
  import assert from "node:assert/strict";
  import { describe, test } from "node:test";
  import { tutorialStatus } from "./tutorial-status.ts";
  ```

- Which modules load in plain node today:
  - `components/global-context/reducer/{account,component,note,state,transaction,tutorial}.ts`
    have only `import type` lines (erased by node), so they load as they are.
  - `lib/utils/store.ts:1` has a value import through the alias
    (`import { type NetworkId, networks } from "@/lib/types/network";`), and
    `lib/utils/project.ts:4` imports
    `{ genesisBlockHeader } from "@/lib/utils/store"`. Both load once `@/` is
    resolved (verified with a resolve hook on Node 26.13).
  - `components/global-context/reducer/script.ts`, `reducer/index.ts` and
    `lib/utils/state.ts` do NOT load even with the alias resolved: their graph
    reaches `lib/constants.ts`, which reads `import.meta.env.VITE_API_URL` at
    module load. They are out of scope here.

- `apps/web/lib/utils/store.ts:176-194` — not exported today:

  ```ts
  const MIGRATION_SCHEMA_VERSION = 8;
  const MIGRATION_BASELINE = [0, 17, 0];

  const isBelowMigrationBaseline = (storedVersion: string | null) => {
    if (storedVersion === null) {
      return true;
    }
    const match = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/.exec(storedVersion);
    if (!match) {
      // The SDK keeps a store whose stamp isn't a version.
      return false;
    }
    const [, major, minor, patch, prerelease] = match;
    const version = [Number(major), Number(minor), Number(patch)];
    const index = version.findIndex(
      (part, index) => part !== MIGRATION_BASELINE[index],
    );
    if (index === -1) {
      return prerelease !== undefined;
    }
    return (version[index] ?? 0) < (MIGRATION_BASELINE[index] ?? 0);
  };
  ```

- `apps/web/lib/utils/store.ts:51-54`:

  ```ts
  export const genesisBlockHeader = (networkId: NetworkId) =>
    networkId === "mtst" || networkId === "mm"
      ? blockHeaders[networkId].header.data
      : "";
  ```

- `apps/web/lib/utils/project.ts:118-135`:

  ```ts
  export const isRestorable = (project: Project, networkId: NetworkId) => {
    if (project.version !== 1 || project.networkId !== networkId) {
      return false;
    }
    const expectedGenesis = genesisBlockHeader(networkId);
    if (!expectedGenesis) {
      return true;
    }
    try {
      const store = JSON.parse(project.store) as Partial<Store>;
      const genesis = store.blockHeaders?.find(
        ({ blockNum }) => Number(blockNum) === 0,
      );
      return !genesis || genesis.header.data === expectedGenesis;
    } catch {
      return false;
    }
  };
  ```

- `apps/web/components/global-context/reducer/state.ts:42-63` (`SYNC_STATE`):

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
      transactions: [
        ...transactions,
        ...state.transactions.filter(
          ({ id }) =>
            !transactions.some((transaction) => transaction.id === id),
        ),
      ],
      syncingState: false,
    };
  }
  ```

- Each reducer file default-exports `(state: State, action) => State`.
  `apps/web/components/global-context/reducer/account.ts:60-89` handles
  `NEW_ACCOUNT` (appends), `DELETE_ACCOUNT`, `UPDATE_ACCOUNT` (replaces the
  account with the same id and sets `updatedAt: Date.now()`).
- `apps/web/tsconfig.node.json` type-checks `"**/*.test.ts"`, `scripts`,
  `e2e`, `vite.config.ts` with `"types": ["node"]`.
- CI (`.github/workflows/checks.yml`) runs
  `pnpm --filter miden-playground-web test`: new tests run there with no
  workflow change.
- Repo rules: Biome formats and lints (`pnpm lint` at the root). No `lodash`.
  Comments in this repo are short and explain why.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0, `fail 0`    |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |
| Repo lint     | `pnpm lint` (repo root)                                | exit 0              |

## Scope

**In scope**:

- `apps/web/test/alias.ts` (create)
- `apps/web/package.json` (the `test` script only)
- `apps/web/tsconfig.node.json` (add `"test"` to `include`)
- `apps/web/lib/utils/store.ts` (add the word `export` once)
- `apps/web/lib/utils/store.test.ts`, `apps/web/lib/utils/project.test.ts`
  (create)
- `apps/web/components/global-context/reducer/account.test.ts`,
  `state.test.ts`, `transaction.test.ts`, `component.test.ts` (create)

**Out of scope** (do NOT touch):

- Any reducer's behaviour: this plan only characterizes it. The index `-1`
  bug in `DELETE_ACCOUNT`/`UPDATE_ACCOUNT`/`SUBMIT_TRANSACTION`/
  `UPDATE_COMPONENT` is plan 008: do not test or fix the "item not found"
  case here.
- `lib/constants.ts`, `lib/utils/state.ts`, `reducer/script.ts`,
  `reducer/index.ts`: they need `import.meta.env` and stay untested here.
- `.github/workflows/*`, `turbo.json`.

## Git workflow

- Branch: `test/web-reducer-and-store-tests` from `main`.
- Conventional commits, e.g. `test(web): add unit tests for the reducers and store helpers`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the alias resolve hook

Create `apps/web/test/alias.ts`:

```ts
// Resolves the `@/` alias of tsconfig.json for the unit tests, which run on
// plain node: `node --import ./test/alias.ts --test …`, from apps/web.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");

registerHooks({
  resolve: (specifier, context, nextResolve) => {
    if (specifier.startsWith("@/")) {
      const base = join(root, specifier.slice(2));
      const file = [`${base}.ts`, join(base, "index.ts")].find(existsSync);
      if (file) {
        return nextResolve(pathToFileURL(file).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
```

Add `"test"` to the `include` array of `apps/web/tsconfig.node.json`.

Change the script in `apps/web/package.json` to:

```json
"test": "node --import ./test/alias.ts --test 'lib/**/*.test.ts' 'components/**/*.test.ts'",
```

Before editing the script, run `cd apps/web && pnpm test` once and note the
`pass` count it prints.

**Verify**: `cd apps/web && pnpm test` → exit 0, `fail 0`, and the same
`pass` count as noted. `pnpm typecheck` → exit 0.

### Step 2: Export `isBelowMigrationBaseline`

In `apps/web/lib/utils/store.ts`, change
`const isBelowMigrationBaseline = (` to
`export const isBelowMigrationBaseline = (`. Nothing else.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.

### Step 3: `lib/utils/store.test.ts` and `lib/utils/project.test.ts`

`store.test.ts` imports `{ genesisBlockHeader, isBelowMigrationBaseline }`
from `"./store.ts"` and asserts:

| Input             | `isBelowMigrationBaseline` |
| ----------------- | -------------------------- |
| `null`            | `true`                     |
| `"0.16.9"`        | `true`                     |
| `"0.17.0-rc.1"`   | `true`                     |
| `"0.17.0"`        | `false`                    |
| `"0.17.8"`        | `false`                    |
| `"1.0.0"`         | `false`                    |
| `"0.9.20"`        | `true`                     |
| `"not-a-version"` | `false`                    |
| `"0.17"`          | `false`                    |

and that `genesisBlockHeader("mtst")` and `genesisBlockHeader("mm")` are
non-empty strings and `genesisBlockHeader("mlcl")`, `("mmck")`, `("mdev")` are
`""`.

`project.test.ts` imports `{ isRestorable }` from `"./project.ts"` and
`{ genesisBlockHeader }` from `"./store.ts"`. Build projects with a helper:

```ts
const project = (overrides: Record<string, unknown> = {}) =>
  ({
    version: 1,
    kind: "project",
    id: "p",
    name: "P",
    networkId: "mtst",
    savedAt: 0,
    state: "{}",
    store: JSON.stringify({ blockHeaders: [] }),
    ...overrides,
  }) as unknown as Parameters<typeof isRestorable>[0];
```

Cases: same network and no genesis header in the store → `true`; another
`networkId` → `false`; `version: 2` → `false`; a store whose
`blockHeaders` holds `{ blockNum: "0", header: { data: genesisBlockHeader("mtst") } }`
→ `true`; the same with `data: "other"` → `false`; `store: "not json"` →
`false`; network `"mlcl"` with `store: "not json"` → `true` (no expected
genesis, the store isn't parsed).

**Verify**: `cd apps/web && pnpm test` → exit 0, the new tests listed.

### Step 4: Reducer characterization tests

Create the four test files next to the reducers. Each imports the reducer by
relative path (`import reducer from "./account.ts";`) and builds a minimal
state cast to the reducer's parameter type, e.g.:

```ts
type State = Parameters<typeof reducer>[0];
const account = (id: string, extra: object = {}) =>
  ({
    id,
    name: id,
    updatedAt: 0,
    ...extra,
  }) as unknown as State["accounts"][number];
const state = (accounts: State["accounts"]) =>
  ({
    accounts,
    transactions: [],
    submittingTransaction: true,
  }) as unknown as State;
```

Cases to cover (existing items only):

- `account.test.ts`: `NEW_ACCOUNT` appends; `DELETE_ACCOUNT` of the middle of
  three accounts leaves the other two in order; `UPDATE_ACCOUNT` of an
  existing account replaces it in place and sets a numeric `updatedAt` > 0,
  the others keep their identity (`assert.equal(next.accounts[0], a)`).
- `transaction.test.ts`: `SUBMIT_TRANSACTION` for an existing account appends
  the transaction, replaces that account in place and sets
  `submittingTransaction: false`; `SUBMITTING_TRANSACTION` /
  `TRANSACTION_SUBMITTED` toggle the flag. Read
  `reducer/transaction.ts` for the exact payload shapes.
- `component.test.ts`: `NEW_COMPONENT` appends; `UPDATE_COMPONENT` of an
  existing component replaces it in place.
- `state.test.ts`: `SYNCING_STATE` sets the flag; `SYNC_STATE` puts the
  payload accounts first, keeps a state account whose id is not in the
  payload after them, replaces `inputNotes` with the payload's, keeps a state
  transaction missing from the payload, and sets `syncingState: false`.

**Verify**: `cd apps/web && pnpm test` → exit 0, `fail 0`, and at least 6 new
test files reported (`store`, `project`, four reducers).

### Step 5: Format and check

**Verify**: `cd apps/web && pnpm exec biome check --write test lib/utils/store.test.ts lib/utils/project.test.ts lib/utils/store.ts components/global-context/reducer package.json tsconfig.node.json`
→ exit 0; `pnpm typecheck` → exit 0; `pnpm test` → exit 0; from the repo
root `pnpm lint` → exit 0.

## Test plan

This plan is its test plan: six new test files, modelled on
`apps/web/lib/utils/tutorial-status.test.ts` (`node:test` + `node:assert/strict`,
`describe`/`test`, relative imports with `.ts`).

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0 with `fail 0`
- [ ] `ls apps/web/components/global-context/reducer/*.test.ts | wc -l` prints `4`
- [ ] `ls apps/web/lib/utils/store.test.ts apps/web/lib/utils/project.test.ts` lists both
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `pnpm lint` (root) exits 0
- [ ] `git diff 874bd1a -- apps/web/lib/utils/store.ts` shows only the added `export`
- [ ] `plans/README.md` status row updated

## STOP conditions

- `registerHooks` is not exported by `node:module` on the installed Node, or
  `pnpm typecheck` rejects it (do not switch to `module.register` or add a
  dependency: report).
- An existing test fails after step 1.
- A characterization test can only pass by changing a reducer.
- `pnpm build` (not required here) or `pnpm typecheck` starts including
  `test/alias.ts` in the browser `tsconfig.json` program and fails.

## Maintenance notes

- New web unit tests can now live under `components/**` and import modules
  that use `@/`, as long as their graph doesn't reach `lib/constants.ts`
  (`import.meta.env`) or `@miden-sdk/*`.
- `lib/utils/state.ts` (`migrateScript`, `stateDeserializer`) stays untested:
  making `lib/constants.ts` loadable in node touches how Vite inlines env
  values (see `docs/claude/vite-build.md`), a separate decision.
- Plans 008, 009, 010 and 014 add cases to the reducer test files created
  here.
