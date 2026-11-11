# Plan 024: CI runs the lockfile and MASM vocabulary drift checks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- .github/workflows apps/api/scripts/check-lockfile.ts apps/web/scripts/sync-masm-vocabulary.ts apps/api/package.json apps/web/package.json`
> Plan 021 may have replaced the `uses:` tags with commit SHAs: then copy
> the pinned references from `checks.yml` instead of the tags shown below.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (after plan 021 if it is in progress: copy its pinned `uses:` lines)
- **Category**: dx
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Two generated files must follow something outside the repository, and two
scripts check them, but nothing runs those scripts except a person who
remembers. When the project template's `Cargo.lock` drifts from the crates
the compile service warmed its cache with, every production compile
downloads and rebuilds the difference: that already happened and took 176 s
per build. When the MASM vocabulary drifts from the assembler version, the
MASM tab highlights with stale keywords. A scheduled workflow turns both
into a red run within a week instead of a user report.

## Current state

- `apps/api/package.json`: `"lockfile:check": "node scripts/check-lockfile.ts"`.
  `apps/api/scripts/check-lockfile.ts:1-22` — compares
  `templates/project-template/Cargo.lock` with the compile service's
  `GET /lockfile`; exits 1 on drift:

  ```ts
  //   node scripts/check-lockfile.ts           # exits with 1 on drift
  //   node scripts/check-lockfile.ts --write   # rewrites the template's lockfile
  //
  // API_COMPILE_URL defaults to the local api-compile (http://localhost:8080).
  …
  const API_COMPILE_URL = process.env.API_COMPILE_URL ?? "http://localhost:8080";
  ```

  The production compile service's URL is public, in the committed
  `apps/api/wrangler.jsonc` (`env.production.vars.API_COMPILE_URL`).

- `apps/web/package.json`: `"masm:check": "node scripts/sync-masm-vocabulary.ts --check"`.
  `apps/web/scripts/sync-masm-vocabulary.ts:1-9` — reads the template
  lockfile for the `miden-assembly-syntax` version, fetches the assembler's
  sources from `raw.githubusercontent.com` at that tag and compares with
  `lib/masm/vocabulary.json`; exits 1 on drift. Needs no local service.

- `apps/api/package.json` also has `templates:check`, which needs a running
  API, a database and the compile service (`docs/claude/script-templates.md`):
  it can't run in CI and stays manual.

- `.github/workflows/checks.yml` — the setup steps to copy:

  ```yaml
  permissions:
    contents: read
  …
      - name: Checkout
        uses: actions/checkout@v7

      - name: Install pnpm
        uses: pnpm/action-setup@v6

      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
  ```

  Its job is named `Lint, typecheck and test`, and branch protection on
  `main` requires that exact name. The new workflow must NOT reuse that name
  and must not become a required check: it depends on two external
  services.

- Docs: `docs/claude/project-template-lockfile.md` and
  `docs/claude/masm-highlighting.md` describe the two checks; both say to
  run them after an SDK or image bump.
- The compile service's container sleeps after 5 idle minutes; its first
  answer after a sleep can take several seconds.

## Commands you will need

| Purpose        | Command                                                                                                           | Expected on success |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- |
| MASM check     | `pnpm --filter miden-playground-web masm:check`                                                                   | exit 0              |
| Lockfile check | `API_COMPILE_URL=<production URL from apps/api/wrangler.jsonc> pnpm --filter miden-playground-api lockfile:check` | exit 0              |
| Lint           | `pnpm lint` (repo root)                                                                                           | exit 0              |

Both checks are read-only: they fetch and compare, and write nothing without
`--write`.

## Scope

**In scope**: `.github/workflows/drift.yml` (create);
`docs/claude/project-template-lockfile.md` and
`docs/claude/masm-highlighting.md` (one sentence each).

**Out of scope** (do NOT touch):

- `checks.yml` and the deploy workflows.
- The two scripts.
- Branch protection settings.
- Running `lockfile:sync` or `masm:sync` to fix a drift you find: report it.

## Git workflow

- Branch: `ci/drift-checks` from `main`.
- Conventional commit, e.g. `ci: check the template lockfile and MASM vocabulary weekly`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Run both checks locally

Read the production `API_COMPILE_URL` from `apps/api/wrangler.jsonc`
(`env.production.vars`), then run the two commands of the table.

**Verify**: both exit 0. If one exits 1 with a drift report, that is a real
finding: STOP and report it (see STOP conditions).

### Step 2: Add the workflow

`.github/workflows/drift.yml`:

```yaml
name: Drift checks

# Two generated files follow something outside this repository: the project
# template's Cargo.lock (the crates api-compile warmed its cache with) and the
# MASM vocabulary (the assembler's sources). Neither check can be required on
# pull requests: they depend on api-compile and GitHub's raw files being up.
on:
  schedule:
    - cron: "17 6 * * 1"
  pull_request:
    branches: [main]
    paths:
      - "apps/api/templates/project-template/Cargo.lock"
      - "apps/web/lib/masm/**"
      - ".github/workflows/drift.yml"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  drift:
    name: Template lockfile and MASM vocabulary
    runs-on: ubuntu-latest
    steps:
      # … the four setup steps of checks.yml, copied as they are …

      - name: MASM vocabulary
        run: pnpm --filter miden-playground-web masm:check

      # Production's api-compile: the lockfile its image warmed is the one
      # that matters. The container sleeps when idle, so its first answer can
      # be slow.
      - name: Template lockfile
        if: always()
        run: pnpm --filter miden-playground-api lockfile:check
        env:
          API_COMPILE_URL: <the production URL, as in apps/api/wrangler.jsonc>
```

Copy the four setup steps from `checks.yml` exactly, including whatever
form their `uses:` references have at that point.

**Verify**:
`node -e 'const t=require("node:fs").readFileSync(".github/workflows/drift.yml","utf8"); for (const s of ["masm:check","lockfile:check","schedule:","workflow_dispatch","contents: read"]) if(!t.includes(s)) throw new Error(s); console.log("ok")'`
→ `ok`. `grep -c "Lint, typecheck and test" .github/workflows/drift.yml` →
`0`.

### Step 3: Say so in the two guides

- `docs/claude/project-template-lockfile.md`: add a sentence to the
  `pnpm lockfile:check` bullet: the `Drift checks` workflow runs it weekly
  against production's api-compile, and on pull requests that touch the
  template lockfile.
- `docs/claude/masm-highlighting.md`: add that the same workflow runs
  `masm:check`.

Then `pnpm exec biome check --write docs/claude/project-template-lockfile.md docs/claude/masm-highlighting.md`.

**Verify**: `pnpm lint` (root) → exit 0.

## Test plan

- Local: step 1's two commands.
- After the pull request is opened (operator): the `Drift checks` run on it
  must pass (the PR touches `.github/workflows/drift.yml`, which triggers
  it). After merge, trigger it once with
  `gh workflow run drift.yml` and check the run is green.

## Done criteria

- [ ] `.github/workflows/drift.yml` exists and passes the `node -e` check of step 2
- [ ] Both local checks of step 1 exited 0 (or a drift was reported)
- [ ] `pnpm lint` exits 0
- [ ] `git status` shows only the three in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A check exits 1 locally: the files have already drifted. Report the
  script's output; fixing it (`lockfile:sync` / `masm:sync`) is the
  operator's call, in its own commit.
- `GET /lockfile` on production answers something other than 200 (the
  service doesn't expose it publicly): then the lockfile step can't run in
  CI; ship the workflow with the MASM step only and say so.
- The operator wants the checks required on pull requests: that conflicts
  with their dependence on external services; report.

## Maintenance notes

- A red weekly run means: run `pnpm lockfile:sync` in `apps/api` (and check
  the compile times) or `pnpm masm:sync` in `apps/web`, as the two guides
  describe.
- GitHub disables scheduled workflows on repositories with no activity for
  60 days, and only notifies the workflow's last editor about failures:
  whoever merges this should watch the first weeks.
- `templates:check` remains manual; it needs local services.
