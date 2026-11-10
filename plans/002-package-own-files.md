# Plan 002: A stored package holds only its own files

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 301e950..HEAD -- apps/api/lib/utils.ts apps/api/db/packages.ts apps/api/routes/scripts.ts apps/api/routes/verified.ts`
> Plan 001 is expected to have landed (it does not touch these four files). If
> any of them changed, compare the "Current state" excerpts against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (touches the compile path every script uses)
- **Depends on**: plans/001-api-unit-tests.md
- **Category**: bug
- **Planned at**: commit `301e950`, 2026-11-10

## Why this matters

When a script is compiled with dependencies, the API stores the dependencies'
files inside the script's own `files` column, and nothing ever removes them.
After the user removes a dependency and recompiles, the stale directory is
still stored and still sent to every build and verification. Worse, the
**Export** zip of a script with no dependencies strips the first path segment
of every stored file, so the stale dependency's `src/lib.rs`, `Cargo.toml` and
`miden-project.toml` collide with the script's own and can replace them in the
zip. After this plan a package stores only the files under its own `<name>/`
directory, and builds, exports and verifications assemble dependencies from
the dependencies' own rows.

## Current state

Vocabulary: a _package_ is a row of the `packages` table (a script). Its
`files` column is a JSON object of path → content, every path prefixed with
the package name, e.g. `counter-note/src/lib.rs`. `dependencies` is an array
of ids: either UUIDs of other rows, or the names of two built-in _default
dependencies_ (`basic-wallet`, `counter-account`) defined in
`apps/api/lib/default-dependencies.ts` with their own `files`.

- `apps/api/lib/utils.ts` — `compilePackage`. The bug:

  ```ts
  // apps/api/lib/utils.ts:125-149
  const [dbPackage, dependenciesPackages] = await Promise.all([
    getPackage(id),
    getDependencies(dependencies),
  ]);
  if (!dbPackage) {
    throw new Error("Error: Package not found");
  }
  const { name, type } = dbPackage;
  const updatedFiles = dbPackage.files;
  updatedFiles[`${name}/src/lib.rs`] = source;
  updatedFiles[`${name}/miden-project.toml`] = generateMidenProjectToml({
    name,
    type,
    rust: source,
    dependencies: dependenciesPackages,
  });
  const files = dependenciesPackages.reduce<Record<string, string>>(
    (previousValue, currentValue) => {
      for (const [path, content] of Object.entries(currentValue.files)) {
        previousValue[path] = content;
      }
      return previousValue;
    },
    updatedFiles,
  );
  ```

  The `reduce` is seeded with `updatedFiles`, so it writes the dependencies'
  files into `updatedFiles` itself. `updatedFiles` is then stored on a failed
  build (`utils.ts:171`, `files: updatedFiles`). On a successful build the
  compile service's `files` answer is stored (`utils.ts:205`,
  `files: storedFiles`, and `utils.ts:226`); that answer is every file that
  was sent plus the updated lockfile, so it contains the dependencies too.
- `apps/api/routes/scripts.ts:205-254` — `GET /:id/export`:

  ```ts
  // apps/api/routes/scripts.ts:212-236
  const dependenciesPackages =
    dbPackage.dependencies.length > 0
      ? await getDependencies(dbPackage.dependencies)
      : [];
  const files =
    dbPackage.dependencies.length > 0
      ? dependenciesPackages.reduce<Record<string, string>>(
          (previousValue, currentValue) => {
            for (const [path, content] of Object.entries(
              currentValue.files,
            )) {
              previousValue[path] = content;
            }
            return previousValue;
          },
          dbPackage.files,
        )
      : Object.entries(dbPackage.files).reduce<Record<string, string>>(
          (previousValue, [path, content]) => {
            const strippedPath = path.split("/").slice(1).join("/");
            previousValue[strippedPath] = content;
            return previousValue;
          },
          {},
        );
  ```

- `apps/api/routes/verified.ts:38-52` — `packageFilesWithDependencies` merges
  `dbPackage.files` with `getDependencies(dbPackage.dependencies)` files.
- `apps/api/db/packages.ts:66-93` — `getDependencies(ids)` returns the default
  dependencies named in `ids` plus the rows whose id is in `ids`, selecting
  the columns `id, name, type, commitment, files`. It is not recursive.
- **Transitive dependencies work today only by accident**: if note N depends
  on component A, and A depends on component B, then A's stored files contain
  B's (because of this bug), so N's build receives B. Once packages store only
  their own files, the build must collect dependencies recursively. Step 2
  adds that.
- The lockfile the compile service returns is at `<name>/Cargo.lock`, under
  the package's own directory (checked in the compile service's source), so
  keeping only `<name>/…` paths keeps it.
- Tests: plan 001 added `"test": "node --test 'lib/**/*.test.ts'"` to
  `apps/api/package.json`. Node cannot resolve the `@/` alias at runtime, so a
  module under test uses relative `.ts` imports and `import type` for types
  (see `apps/api/lib/package-sources.ts` and its test from plan 001).

## Commands you will need

Run from `apps/api` unless noted.

| Purpose       | Command                           | Expected on success |
| ------------- | --------------------------------- | ------------------- |
| Tests         | `pnpm test`                       | exit 0, `fail 0`    |
| Typecheck     | `pnpm typecheck`                  | exit 0              |
| Bundle check  | `pnpm build`                      | exit 0              |
| Lint + format | `pnpm exec biome check --write .` | exit 0              |
| Lint, repo    | `pnpm lint` (repo root)           | exit 0              |

## Scope

**In scope**:

- `apps/api/lib/package-files.ts` (create)
- `apps/api/lib/package-files.test.ts` (create)
- `apps/api/lib/utils.ts` (`compilePackage` only)
- `apps/api/db/packages.ts` (`getDependencies` column list, new
  `getDependenciesDeep`)
- `apps/api/routes/scripts.ts` (the `/:id/export` handler only)
- `apps/api/routes/verified.ts` (`packageFilesWithDependencies` only)

**Out of scope** (do NOT touch):

- `apps/api/db/schema.ts` and `apps/api/drizzle/` — no schema change, no
  migration, no data backfill. Stored rows heal on their next compile, and the
  readers filter stale files meanwhile.
- `createPackage` in `utils.ts` — it already stores own files only.
- `apps/api/lib/import.ts`, `apps/web/**`.
- The request/response shapes of every route.
- Error handling and status codes — plan 003.

## Git workflow

- Branch: `fix/package-own-files` from `main` (after plan 001 is merged or
  on top of its branch, as the operator says).
- Conventional commits, e.g. `fix(api): store only a package's own files`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the pure helpers and their tests

Create `apps/api/lib/package-files.ts` (no `@/` runtime imports):

```ts
type PackageFiles = Record<string, string>;

// A package's own files: the stored entries under its `<name>/` directory.
// Rows compiled before packages stored only their own files can still hold
// their dependencies' directories.
export const ownFiles = (name: string, files: PackageFiles): PackageFiles =>
  Object.fromEntries(
    Object.entries(files).filter(([path]) => path.startsWith(`${name}/`)),
  );

// The files of a build: the package's own next to each dependency's own
// (`../<dependency>` in its miden-project.toml).
export const buildFiles = (
  own: PackageFiles,
  dependencies: { name: string; files: PackageFiles }[],
): PackageFiles =>
  Object.assign(
    {},
    ...dependencies.map(({ name, files }) => ownFiles(name, files)),
    own,
  );

// The files of an exported zip: a package without dependencies is the zip's
// root, one with dependencies sits in its directory next to theirs.
export const exportFiles = (
  name: string,
  files: PackageFiles,
  dependencies: { name: string; files: PackageFiles }[],
): PackageFiles => {
  const own = ownFiles(name, files);
  if (dependencies.length > 0) {
    return buildFiles(own, dependencies);
  }
  return Object.fromEntries(
    Object.entries(own).map(([path, content]) => [
      path.slice(name.length + 1),
      content,
    ]),
  );
};
```

Create `apps/api/lib/package-files.test.ts` (style: `node:test` +
`node:assert/strict`, like `apps/api/lib/package-sources.test.ts`):

- `ownFiles("a", { "a/src/lib.rs": "A", "b/src/lib.rs": "B", "ab/x": "X" })`
  → `{ "a/src/lib.rs": "A" }` (`ab/` is not `a/`).
- `buildFiles` puts the package's files and each dependency's own files side
  by side, and drops a dependency's stale foreign directories
  (dependency `{ name: "b", files: { "b/src/lib.rs": "B", "c/src/lib.rs": "C" } }`
  contributes only `b/src/lib.rs`).
- `buildFiles` does not mutate its arguments (`structuredClone` the inputs
  before, `assert.deepEqual` after).
- **Regression**: `exportFiles("note", { "note/src/lib.rs": "NOTE", "note/Cargo.toml": "N", "zz-removed/src/lib.rs": "STALE", "zz-removed/Cargo.toml": "S" }, [])`
  → exactly `{ "src/lib.rs": "NOTE", "Cargo.toml": "N" }`.
- `exportFiles` with one dependency keeps the `note/…` and `dep/…` prefixes.

**Verify**: `pnpm test` → exit 0, the new tests pass.

### Step 2: Resolve dependencies recursively

In `apps/api/db/packages.ts`:

1. In `getDependencies`, add `dependencies: true` to the `columns` object.
2. Add below it:

```ts
// The dependencies of a build: the given ones and, in turn, the ones they
// depend on. A package's miden-project.toml lists only its direct ones.
export const getDependenciesDeep = async (dependencies: string[]) => {
  const found = new Map<
    string,
    Awaited<ReturnType<typeof getDependencies>>[number]
  >();
  let pending = dependencies;
  while (pending.length > 0) {
    const batch = await getDependencies(pending);
    pending = [];
    for (const dependency of batch) {
      if (found.has(dependency.id)) {
        continue;
      }
      found.set(dependency.id, dependency);
      // Default dependencies have none.
      const nested =
        "dependencies" in dependency ? dependency.dependencies : [];
      pending.push(...nested.filter((id) => !found.has(id)));
    }
  }
  return [...found.values()];
};
```

The `found` map also ends a dependency cycle. If TypeScript rejects the
`"dependencies" in dependency` narrowing, adapt the typing minimally (for
example give the default dependencies an explicit `dependencies: []` when
mapping them inside `getDependencies`); do not change behaviour.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Fix `compilePackage`

In `apps/api/lib/utils.ts`:

1. Import `getDependenciesDeep` from `@/db/packages` and
   `{ buildFiles, ownFiles }` from `@/lib/package-files`.
2. Load the three values together:

   ```ts
   const [dbPackage, dependenciesPackages, buildDependencies] =
     await Promise.all([
       getPackage(id),
       getDependencies(dependencies),
       getDependenciesDeep(dependencies),
     ]);
   ```

   `dependenciesPackages` (direct only) keeps feeding
   `generateMidenProjectToml` and the returned `dependencies` arrays, exactly
   as today.
3. Replace `const updatedFiles = dbPackage.files;` with
   `const updatedFiles = ownFiles(name, dbPackage.files);`.
4. Replace the whole `const files = dependenciesPackages.reduce(…)` statement
   with `const files = buildFiles(updatedFiles, buildDependencies);`.
5. In the success branch, right after the destructuring of `build`, add
   `const packageFiles = ownFiles(name, storedFiles);` and use `packageFiles`
   instead of `storedFiles` in the `updatePackage` call and in
   `files: scriptFiles(name, storedFiles)`. Update the comment above
   `updatePackage` to say the package's own compiled sources plus the
   `Cargo.lock` are stored.

The failed-build branch needs no edit: `updatedFiles` is no longer mutated.

**Verify**: `pnpm typecheck` → exit 0;
`grep -n "reduce" lib/utils.ts` → no match.

### Step 4: Fix the export route and verification

- `apps/api/routes/scripts.ts`, `/:id/export` handler: replace the
  `dependenciesPackages` and `files` statements quoted in "Current state" with:

  ```ts
  const dependenciesPackages =
    dbPackage.dependencies.length > 0
      ? await getDependenciesDeep(dbPackage.dependencies)
      : [];
  const files = exportFiles(
    dbPackage.name,
    dbPackage.files,
    dependenciesPackages,
  );
  ```

  Import `getDependenciesDeep` (replacing `getDependencies` in that import if
  it becomes unused) and `exportFiles` from `@/lib/package-files`.
- `apps/api/routes/verified.ts`, `packageFilesWithDependencies`: return
  `buildFiles(ownFiles(dbPackage.name, dbPackage.files), dependencies)` where
  `dependencies` comes from `getDependenciesDeep(dbPackage.dependencies)`
  (keep the `length > 0` guard). Remove the `as Record<string, string>` cast
  if it is no longer needed.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0;
`pnpm exec biome check --write .` → exit 0; `pnpm test` → exit 0.

### Step 5: Manual end-to-end check (only if the operator provides a running stack)

This needs the web app on port 3000, the API on 3001 and the compile service.
If they are not running, skip this step and say so in your report; do not try
to start them.

1. Create a note script from the "Counter note" example, add the
   `counter-account` dependency, compile (succeeds).
2. Remove the dependency, compile (fails: that is expected).
3. Click Export: the zip's `src/lib.rs` is the note's source.

## Test plan

- `apps/api/lib/package-files.test.ts` as listed in step 1, including the
  named regression test for the export collision.
- `compilePackage`, the routes and `getDependenciesDeep` need the database
  and are not unit-testable in this repo; they are covered by typecheck and by
  the Playwright suite the operator runs (`apps/web/e2e`, tutorials 6-12 and
  the example specs compile scripts with dependencies).

## Done criteria

- [ ] `cd apps/api && pnpm test` exits 0, including the regression test
- [ ] `pnpm typecheck` and `pnpm lint` (repo root) exit 0
- [ ] `cd apps/api && pnpm build` exits 0
- [ ] `grep -n "reduce" apps/api/lib/utils.ts apps/api/routes/scripts.ts` returns no match
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts in "Current state" don't match the live code.
- You find a caller that relies on a package's stored `files` containing its
  dependencies (search: `grep -rn "\.files" apps/api --include=*.ts`
  excluding `node_modules`). Report it instead of adapting it.
- The fix seems to need a schema change or a data migration.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Reviewer: check that a successful compile still stores `<name>/Cargo.lock`
  (the warm lockfile the next compile reuses; slow compiles are the symptom if
  it is lost), and run the e2e specs that compile with dependencies before
  merging.
- Rows compiled before this change keep stale directories until their next
  compile; `ownFiles` hides them on every read path, so no backfill is needed.
- `getDependenciesDeep` issues one query per dependency level. Depth is 1 or 2
  in practice.
- A dependency name that is a prefix of another (`a` and `ab`) is safe because
  the filter matches `<name>/`.
