# Plan 022: A test fails when the SDK version is bumped in one place only

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/package.json pnpm-workspace.yaml apps/web/lib/utils/store.ts`
> A version bump since then is fine as long as the three places agree; the
> excerpts below show the shape to expect, not the version.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Bumping the Miden SDK means writing the new version in three places by hand:
the web app's dependencies, the workspace `overrides`, and a constant that
stamps the stores the tutorials are seeded from. The SDK refuses to import a
store stamped by a newer client and clears one stamped below its migration
baseline, so a missed constant doesn't fail the build: it breaks tutorials
and sandbox imports at runtime. Today only a paragraph in
`docs/claude/upgrading-miden.md` guards it. A unit test that compares the
three makes CI catch it.

## Current state

- `apps/web/package.json:30-34`:

  ```json
  "@miden-sdk/miden-sdk": "0.17.8",
  "@miden-sdk/miden-wallet-adapter": "0.17.8",
  "@miden-sdk/para": "0.17.8",
  "@miden-sdk/para-react": "0.17.8",
  "@miden-sdk/react": "0.17.8",
  ```

  (`@miden-sdk/vite-plugin` at line 56 is versioned apart, `0.17.5`: it is
  NOT part of the set.)

- `pnpm-workspace.yaml:28-30`:

  ```yaml
  overrides:
    "@miden-sdk/miden-sdk": "0.17.8"
    "@miden-sdk/react": "0.17.8"
  ```

- `apps/web/lib/utils/store.ts:4-8`:

  ```ts
  // The version of the web SDK's IndexedDB store (the `idxdb-store` crate version
  // it writes to the `clientVersion` setting). Bump it alongside the SDK: it
  // stamps the stores seeded from `defaultStore`, and the SDK refuses to import a
  // store stamped by a client newer than the running one.
  const CLIENT_VERSION = "0.17.8";
  ```

- `docs/claude/upgrading-miden.md:3` — "When bumping `@miden-sdk/*`, also
  update `CLIENT_VERSION` in `apps/web/lib/utils/store.ts` to the new
  version. … Bump the `@miden-sdk/*` pins in `pnpm-workspace.yaml`
  `overrides` too".
- Web unit tests: `cd apps/web && pnpm test` runs `node --test` on
  `lib/**/*.test.ts` (plain node, type stripping; relative imports with
  `.ts`; `node:test` + `node:assert/strict`). A test that reads files is
  already the pattern in `apps/web/lib/utils/compiler-output.test.ts`
  (`readFileSync`). CI runs this command on every pull request.
- `lib/utils/store.ts` imports through the `@/` alias, so the test must not
  import it: read it as text.

## Commands you will need

| Purpose       | Command                                                                      | Expected on success |
| ------------- | ---------------------------------------------------------------------------- | ------------------- |
| Unit tests    | `cd apps/web && pnpm test`                                                   | exit 0, `fail 0`    |
| Typecheck     | `cd apps/web && pnpm typecheck`                                              | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write lib/utils/sdk-version.test.ts` | exit 0              |

## Scope

**In scope**: `apps/web/lib/utils/sdk-version.test.ts` (create);
`docs/claude/upgrading-miden.md` (one sentence).

**Out of scope** (do NOT touch):

- `store.ts`, `package.json`, `pnpm-workspace.yaml`: the test reads them.
- Deriving `CLIENT_VERSION` from the package at build time: the constant
  names the store crate's version, which the docs say equals the SDK's, but
  that equality is the SDK's to keep; a test that fails loudly is safer than
  a silent derivation.

## Git workflow

- Branch: `test/sdk-version-consistency` from `main`.
- Conventional commit, e.g. `test(web): check the SDK version is bumped everywhere`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the test

`apps/web/lib/utils/sdk-version.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// The SDK version is written by hand in three places (see
// docs/claude/upgrading-miden.md): a bump that misses one breaks store
// imports at runtime, not at build time.
const web = join(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(join(web, path), "utf-8");

const { dependencies } = JSON.parse(read("package.json")) as {
  dependencies: Record<string, string>;
};
const sdkVersion = dependencies["@miden-sdk/miden-sdk"];

test("the @miden-sdk packages of the web app share one version", () => {
  for (const name of [
    "@miden-sdk/miden-wallet-adapter",
    "@miden-sdk/para",
    "@miden-sdk/para-react",
    "@miden-sdk/react",
  ]) {
    assert.equal(dependencies[name], sdkVersion, name);
  }
});

test("the workspace overrides pin the same version", () => {
  const workspace = read("../../pnpm-workspace.yaml");
  for (const name of ["@miden-sdk/miden-sdk", "@miden-sdk/react"]) {
    const version = workspace.match(
      new RegExp(`^  "${name}": "([^"]+)"$`, "m"),
    )?.[1];
    assert.equal(version, sdkVersion, name);
  }
});

test("CLIENT_VERSION stamps stores with the same version", () => {
  const version = read("lib/utils/store.ts").match(
    /^const CLIENT_VERSION = "([^"]+)";$/m,
  )?.[1];
  assert.equal(version, sdkVersion);
});
```

**Verify**: `cd apps/web && pnpm test` → exit 0, three new tests pass.

### Step 2: Prove it catches a mismatch

Temporarily change `CLIENT_VERSION` in `store.ts` to `"0.0.0"`, run
`cd apps/web && pnpm test` → it must fail in "CLIENT_VERSION stamps stores";
then restore the file with `git checkout -- apps/web/lib/utils/store.ts`.

**Verify**: `git status --short apps/web/lib/utils/store.ts` → no output;
`pnpm test` → exit 0.

### Step 3: Mention it in the upgrade guide

In `docs/claude/upgrading-miden.md`, after the sentence about bumping the
`overrides`, add: "`apps/web/lib/utils/sdk-version.test.ts` fails when the
three disagree." Then
`pnpm exec biome check --write docs/claude/upgrading-miden.md` (Biome formats
Markdown here).

**Verify**: `pnpm lint` (root) → exit 0; `cd apps/web && pnpm typecheck` →
exit 0.

## Test plan

The plan is the test. Step 2 is its negative check.

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0 with the three new tests
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `git status` shows only the two in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The three places don't agree at the commit you start from (then the bug
  already exists: report the versions, don't "fix" one).
- The dependency names in `package.json` changed (a package was renamed or
  dropped): report the new list.
- `pnpm-workspace.yaml` uses a `link:` override for the SDK (a local
  checkout, see the commented lines above `overrides`): the test would fail
  by design; report.

## Maintenance notes

- Pointing the SDK at a local checkout with `link:` overrides makes this
  test fail locally: that is expected, and such a state shouldn't be
  committed.
- If the store crate's version ever stops matching the npm version, the
  third test encodes a rule that is no longer true: update it together with
  `docs/claude/upgrading-miden.md`.
