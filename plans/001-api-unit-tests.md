# Plan 001: `apps/api` has unit tests for its pure logic

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 301e950..HEAD -- apps/api/lib apps/api/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `301e950`, 2026-11-10

## Why this matters

`apps/api` (a Hono app on Cloudflare Workers) has no test script and no tests.
It generates the `miden-project.toml` the Miden compiler checks, orders
imported packages by dependency, and assembles the files of each build. The
web app next to it has 62 unit tests; the API has none, so plans 002 and 003
(a bug fix and input validation in this code) have nothing to pin their
behaviour. This plan adds a `pnpm test` to the API and covers the pure
functions, without changing any behaviour.

## Current state

- `apps/api/package.json` — scripts: `dev`, `build`, `lint`, `typecheck`, … No
  `test`.
- `apps/web/package.json` has the convention to copy:
  `"test": "node --test 'lib/**/*.test.ts'"`.
- Tests run with plain `node` (Node 26 strips types; there is no `tsx`, no
  Vitest). From `docs/claude/node-tooling.md`: TypeScript run by `node` needs
  "`.ts` extensions on relative imports and `import type` for types, and can't
  use enums, namespaces, parameter properties or tsconfig path aliases".
- The API imports with the `@/` path alias, which `node` cannot resolve. An
  `import type … from "@/…"` line is fine (it is erased), a runtime import is
  not. `apps/api/tsconfig.json` has `allowImportingTsExtensions: true`, so
  relative `./x.ts` imports typecheck and bundle.
- Runtime alias imports that block testing today:
  - `apps/api/lib/toml.ts:2` — `import { kebabCase } from "@/lib/case";`
  - `apps/api/lib/package-type.ts:1` —
    `import { packageTypeEnum } from "@/db/schema";`
    (`apps/api/db/schema.ts` only imports `drizzle-orm/pg-core`, loadable by
    node.)
- `apps/api/lib/case.ts` and `apps/api/lib/uuid.ts` have no imports.
- `apps/api/lib/import.ts:13-111` holds two private functions, `lastSegment`
  and `resolvePackageSources`. The file also imports `@/examples`, which
  imports `.rs`/`.toml` files as text (a Wrangler bundler rule), so node can
  never load `import.ts`. Its start:

  ```ts
  // apps/api/lib/import.ts:1-20
  import { examples } from "@/examples";
  import { sourcesHash } from "@/examples/hash";
  import { packageTypeNames, toPackageType } from "@/lib/package-type";
  import { parseMidenProjectToml } from "@/lib/toml";
  import type {
    CompiledPackage,
    Dependency,
    MidenProjectToml,
    PackageSource,
  } from "@/lib/types";
  import { compilePackage, createPackage } from "@/lib/utils";

  const lastSegment = (path: string) => path.split("/").at(-1);

  // Parses the packages' miden-project.toml and resolves their path dependencies
  // to package names, then orders them so each package comes after the ones it
  // depends on.
  const resolvePackageSources = (
    packageSources: Record<string, PackageSource>,
  ) => {
  ```

  `resolvePackageSources` ends at line 111 (`};`), just before
  `export const importScriptsFromPackageSources`. It is called twice in the
  same file (in `importScriptsFromPackageSources` and `importExample`).
- Test style to copy: `apps/web/lib/utils/script-files.test.ts`:

  ```ts
  import assert from "node:assert/strict";
  import { describe, test } from "node:test";
  import { buildFileTree } from "./file-tree.ts";
  ```

- `docs/claude/case-helpers.md`: `kebabCase` in `apps/api/lib/case.ts` is a
  port of lodash's and must stay identical to it, "quirks included (`P2IDNote`
  → `p-2-id-note`)". Do not edit `case.ts`.

## Commands you will need

Run from `apps/api` unless noted.

| Purpose       | Command                                         | Expected on success         |
| ------------- | ----------------------------------------------- | --------------------------- |
| Tests         | `pnpm test`                                     | exit 0, `fail 0`            |
| Typecheck     | `pnpm typecheck`                                | exit 0                      |
| Bundle check  | `pnpm build`                                    | exit 0 (dry run, no deploy) |
| Lint + format | `pnpm exec biome check --write .` (in apps/api) | exit 0                      |
| Lint, repo    | `pnpm lint` (repo root)                         | exit 0                      |

## Scope

**In scope** (the only files you should modify):

- `apps/api/package.json` (add the `test` script only)
- `apps/api/lib/toml.ts` (one import line)
- `apps/api/lib/package-type.ts` (one import line)
- `apps/api/lib/import.ts` (remove the two moved functions, add one import)
- `apps/api/lib/package-sources.ts` (create)
- `apps/api/lib/case.test.ts`, `uuid.test.ts`, `toml.test.ts`,
  `package-type.test.ts`, `package-sources.test.ts` (create, all in
  `apps/api/lib/`)

**Out of scope** (do NOT touch):

- `apps/api/lib/case.ts` — must stay byte-identical to the lodash port.
- Any behaviour change. If a test shows surprising behaviour, record it in
  your report; do not fix it here.
- `apps/api/lib/utils.ts`, `apps/api/routes/*`, `apps/api/db/*` — plans 002
  and 003 change them.
- Adding a test framework or any dependency.

## Git workflow

- Branch: `test/api-unit-tests` from `main`.
- Conventional commits, as in `git log`: `chore(deps): update dependencies`,
  `docs(tutorials): fix and harmonize the tutorial copy`. Use e.g.
  `test(api): add unit tests for the pure helpers`.
- Never add a `Co-Authored-By` line or any AI attribution to commits.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the test script

In `apps/api/package.json`, add after the `typecheck` line:

```json
"test": "node --test 'lib/**/*.test.ts'",
```

**Verify**: `cd apps/api && pnpm test` → exits non-zero or reports 0 tests (no
test files yet). Either is fine at this step.

### Step 2: Make `toml.ts` and `package-type.ts` loadable by node

- `apps/api/lib/toml.ts:2`: change `"@/lib/case"` to `"./case.ts"`.
- `apps/api/lib/package-type.ts:1`: change `"@/db/schema"` to
  `"../db/schema.ts"`.

Leave every `import type … from "@/…"` line as it is.

**Verify**: `pnpm typecheck` → exit 0, and `pnpm build` → exit 0.

### Step 3: Move `resolvePackageSources` to its own module

Create `apps/api/lib/package-sources.ts` containing, moved verbatim from
`apps/api/lib/import.ts` lines 13-111: `lastSegment`, the comment above
`resolvePackageSources`, and `resolvePackageSources` itself, now with
`export`. Its imports:

```ts
import type { MidenProjectToml, PackageSource } from "@/lib/types";
import { packageTypeNames, toPackageType } from "./package-type.ts";
import { parseMidenProjectToml } from "./toml.ts";
```

In `apps/api/lib/import.ts`: delete the moved code, add
`import { resolvePackageSources } from "@/lib/package-sources";`, and remove
the imports that are no longer used there (`packageTypeNames`,
`toPackageType`, `parseMidenProjectToml`, `MidenProjectToml`). Biome reports
unused imports.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0;
`pnpm exec biome check --write .` → exit 0;
`grep -n "const resolvePackageSources" lib/import.ts` → no match.

### Step 4: Write the tests

All files in `apps/api/lib/`, importing with relative `.ts` paths, `describe`
/ `test` from `node:test`, `assert` from `node:assert/strict`.

`case.test.ts` — `kebabCase`:

| Input               | Expected             |
| ------------------- | -------------------- |
| `"P2IDNote"`        | `"p-2-id-note"`      |
| `"CounterContract"` | `"counter-contract"` |
| `"the2ndTry"`       | `"the-2nd-try"`      |
| `"counter_account"` | `"counter-account"`  |

`uuid.test.ts` — `isValidUUIDv4`: true for
`"3f2b8c1e-9d4a-4f6b-8a1c-0e5d7b9c2a4f"` and its upper-case form; false for
`""`, `"basic-wallet"`, `"3f2b8c1e-9d4a-1f6b-8a1c-0e5d7b9c2a4f"` (version 1),
`"3f2b8c1e-9d4a-4f6b-7a1c-0e5d7b9c2a4f"` (wrong variant), and the valid one
with a trailing space.

`package-type.test.ts` — `toPackageType`: `"lib"` → `"library"`, `"account"`
→ `"account-component"`, `"tx-script"` → `"transaction-script"`,
`"transaction-script"` → itself, `"note"` → `"note"`, `undefined` →
`undefined`, `""` → `undefined`, `"nope"` → `undefined`.

`toml.test.ts` — `generateMidenProjectToml` (all with default version). These
exact outputs were produced by running the current code:

1. `{ name: "counter-note", type: "note", rust: "fn main() {}", dependencies: [] }` →

   ```
   [package]\nname = "counter-note"\nversion = "0.1.0"\n\n[lib]\nkind = "note"\nnamespace = "miden:counter-note/miden-counter-note@0.1.0"\npath = "src/lib.rs"\n\n[dependencies]\nmiden-core = "*"\nmiden-protocol = "*"\n\n
   ```

2. Same with `rust: ""` and
   `dependencies: [{ id: "x", name: "counter-account", type: "account-component", commitment: "" }]`
   → the same text, but ending
   `miden-protocol = "*"\ncounter-account = { path = "../counter-account" }\n\n\n`
   (three newlines).
3. `{ name: "my-counter", type: "account-component", rust: "#[component]\npub trait CounterContract {}", dependencies: [] }`
   → contains `namespace = "miden:my-counter/counter-contract@0.1.0"` and ends
   with
   `[package.metadata.miden]\nsupported-types = ["RegularAccountUpdatableCode"]\n\n`.
4. `{ name: "p2id-note", type: "note", rust: "", dependencies: [] }` → contains
   `namespace = "miden:p2id-note/miden-p2id-note@0.1.0"` (an already-kebab
   name is not re-split into `p-2-id-note`).
5. `{ name: "init", type: "transaction-script", rust: "", dependencies: [] }`
   → contains `namespace = "miden:base/transaction-script@1.0.0"`.
6. `{ name: "my-lib", type: "library", rust: "", dependencies: [] }` → contains
   no `namespace` line.

Also `generateCargoToml({ name: "abc" })`: starts with
`cargo-features = ["trim-paths"]\n\n[package]\nname = "abc"\nversion = "0.1.0"\n`,
and `parseMidenProjectToml` round-trips output 1 (`package.name` is
`"counter-note"`, `lib.kind` is `"note"`).

`package-sources.test.ts` — `resolvePackageSources`. Build inputs with a
helper that makes a `miden-project.toml` string (`[package] name`, `[lib]
kind`, `[dependencies]` with `x = { path = "../x" }` entries):

- Two packages given dependent-first (`note-a` depending on `account-b` by
  path `../account-b`): the result is ordered `account-b`, `note-a`, and
  `note-a`'s `dependencies` is `["account-b"]`.
- `miden-core = "*"` and `miden-protocol = "*"` entries are ignored.
- `kind = "tx-script"` resolves to type `"transaction-script"`.
- Each of these throws an `Error` whose message matches the pattern (use
  `assert.throws(fn, /pattern/)`): invalid TOML → `/invalid miden-project.toml/`;
  no `[package] name` → `/has no \[package\] name/`; unknown kind →
  `/has no valid \[lib\] kind/`; empty `rust` → `/src\/lib.rs is missing or empty/`;
  two packages with the same name → `/are both named/`; a path dependency whose
  directory is not among the imported packages → `/isn't in the imported folder/`.
- A dependency cycle (`a` → `b` → `a`) does not hang or throw and returns both.

**Verify**: `pnpm test` → exit 0, `fail 0`, at least 25 passing tests.

### Step 5: Final checks

**Verify**: from the repo root, `pnpm lint` → exit 0 and `pnpm typecheck` →
exit 0; `cd apps/api && pnpm build` → exit 0.

## Test plan

The tests are the deliverable; see step 4. Structural pattern:
`apps/web/lib/utils/script-files.test.ts`.

## Done criteria

- [ ] `cd apps/api && pnpm test` exits 0 with `fail 0` and ≥ 25 tests
- [ ] `pnpm typecheck` and `pnpm lint` (repo root) exit 0
- [ ] `cd apps/api && pnpm build` exits 0
- [ ] `git diff 301e950 -- apps/api/lib/case.ts` is empty
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- An expected value in step 4 disagrees with what the code returns. Do not
  change the source to match, and do not silently change the expectation:
  report the input, the expected and the actual value.
- `pnpm build` fails after step 2 or 3 (the bundler rejects the relative `.ts`
  imports).
- Moving `resolvePackageSources` needs a change to its body to typecheck.
- `node` cannot load a module under test because of an import this plan did
  not list.

## Maintenance notes

- New API modules meant to be unit-tested must use relative `.ts` imports for
  anything loaded at runtime; `@/` is fine for `import type` only.
- `lib/utils.ts`, `lib/import.ts`, `db/*` and `routes/*` stay untestable by
  node (they load the DB context or text-imported templates). Plans 002 and
  003 extract their pure parts into alias-free modules for the same reason.
- Plan 005 runs `pnpm test` in the deploy workflow.
