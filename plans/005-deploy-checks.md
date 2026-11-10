# Plan 005: Deploys run lint, typecheck and unit tests first

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 301e950..HEAD -- .github/workflows/deploy-api-cloudflare.yml .github/workflows/deploy-web-cloudflare.yml`
> If either file changed, compare the "Current state" excerpts against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (a failing check blocks a deploy; that is the point)
- **Depends on**: plans/001-api-unit-tests.md (adds `pnpm test` to `apps/api`)
- **Category**: tests
- **Planned at**: commit `301e950`, 2026-11-10

## Why this matters

A push to `main` deploys to production: the API workflow migrates the
production database and then deploys the Worker; the web workflow builds and
deploys. Neither runs lint, typecheck or the unit tests, and pull requests
have no status checks, so the only gate is whatever the author ran locally.
The checks take about a minute. Running them as the first steps of each
deploy job stops a broken `main` before the migration and the deploy.

The maintainer has decided not to run the Playwright end-to-end suite in CI
for now. This plan does not add it.

## Current state

- `.github/workflows/deploy-api-cloudflare.yml` — one job, `deploy`, steps:
  Checkout, Install pnpm, Setup Node.js (26, pnpm cache), Install dependencies
  (`pnpm install --frozen-lockfile`), **Migrate the database**
  (`working-directory: apps/api`, `pnpm db:migrate`), **Deploy api to
  Cloudflare** (`pnpm run deploy`).
- `.github/workflows/deploy-web-cloudflare.yml` — same first four steps, then
  **Deploy web to Cloudflare** (`working-directory: apps/web`,
  `pnpm run deploy`).
- The install step, identical in both:

  ```yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
  ```

- Root `package.json` scripts: `"lint": "biome check ."` (whole repo),
  `"typecheck": "turbo typecheck"` (every workspace).
- `apps/web/package.json`: `"test": "node --test 'lib/**/*.test.ts'"`.
  `apps/api/package.json` gets the same `test` script from plan 001.
- Step comments in these workflows are full sentences explaining why; match
  that style.
- `.github/workflows/deploy-status-page.yml` exists too and is not part of
  this plan.

## Commands you will need

| Purpose   | Command (repo root)                       | Expected on success |
| --------- | ----------------------------------------- | ------------------- |
| Lint      | `pnpm lint`                               | exit 0              |
| Typecheck | `pnpm typecheck`                          | exit 0              |
| API tests | `pnpm --filter miden-playground-api test` | exit 0, `fail 0`    |
| Web tests | `pnpm --filter miden-playground-web test` | exit 0, `fail 0`    |

## Scope

**In scope**:

- `.github/workflows/deploy-api-cloudflare.yml`
- `.github/workflows/deploy-web-cloudflare.yml`

**Out of scope** (do NOT touch):

- `.github/workflows/deploy-status-page.yml`.
- Adding a pull-request workflow, Playwright, `pnpm masm:check`,
  `pnpm templates:check` or `pnpm lockfile:check` (they need running services
  or were not asked for).
- The `on:`, `permissions:` and `concurrency:` blocks, action versions, the
  existing steps and their order.
- Any source file: if a check fails locally, report it instead of fixing it.

## Git workflow

- Branch: `ci/deploy-checks` from `main`.
- Conventional commit, e.g. `ci: check lint, types and unit tests before a deploy`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it. Note that
  merging this to `main` triggers both deploy workflows (each lists its own
  file under `paths`).

## Steps

### Step 1: Confirm the checks pass today

Run the four commands of the table above from the repo root.

**Verify**: all four exit 0. If `pnpm --filter miden-playground-api test`
fails with "missing script: test", plan 001 has not landed: STOP.

### Step 2: API workflow

In `.github/workflows/deploy-api-cloudflare.yml`, insert between "Install
dependencies" and "Migrate the database":

```yaml
# Before the migration: nothing reaches production from a commit that
# fails them. Lint and typecheck cover the whole repository.
- name: Lint
  run: pnpm lint

- name: Typecheck
  run: pnpm typecheck

- name: Test
  run: pnpm --filter miden-playground-api test
```

### Step 3: Web workflow

In `.github/workflows/deploy-web-cloudflare.yml`, insert between "Install
dependencies" and "Deploy web to Cloudflare":

```yaml
# Before the deploy: nothing reaches production from a commit that fails
# them. Lint and typecheck cover the whole repository.
- name: Lint
  run: pnpm lint

- name: Typecheck
  run: pnpm typecheck

- name: Test
  run: pnpm --filter miden-playground-web test
```

**Verify** (both files):
`node -e "const y=require('node:fs').readFileSync(process.argv[1],'utf8'); if(!/- name: Test\n\s+run: pnpm --filter/.test(y)) process.exit(1)" .github/workflows/deploy-api-cloudflare.yml`
→ exit 0, same for the web file; `pnpm lint` → exit 0 (Biome checks YAML
formatting if it is configured to; fix indentation it reports);
`git diff --stat` → exactly the two workflow files, insertions only.

## Test plan

No unit test applies. The real verification is the first run of each workflow
after merge: the three new steps appear and pass before the deploy steps. The
operator watches it.

## Done criteria

- [ ] Both workflow files contain the `Lint`, `Typecheck` and `Test` steps
  between install and the first production step
- [ ] `git diff 301e950 -- .github/workflows` shows insertions only
- [ ] `pnpm lint`, `pnpm typecheck` and both `test` commands exit 0 locally
- [ ] `git status` shows only the two workflow files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A check from step 1 fails on an untouched `main`. Report the output; fixing
  source is out of scope.
- `pnpm typecheck` needs a file that is git-ignored (it would fail in CI but
  pass locally). To check, compare `git status --ignored --short apps` against
  the paths in any typecheck error after a fresh clone; if unsure, report.

## Part 2 (added 2026-11-10): the same checks on every pull request

Maintainer decision: run the checks on every pull request to `main` and make
them a required status check through branch protection. Admins keep the
ability to push directly to `main` (`enforce_admins: false`), so the
deploy-time checks of steps 2–3 stay as the backstop for those pushes.
Same branch, `ci/deploy-checks`, as a second commit.

**In scope (added)**: `.github/workflows/checks.yml` (new), `README.md`
(one paragraph, step 5). Everything else from "Out of scope" still holds.

### Step 4: PR workflow

Create `.github/workflows/checks.yml`:

```yaml
name: Checks

# On every pull request to main, whatever it touches: branch protection
# requires this job, and a required check skipped by a `paths` filter would
# leave the pull request waiting forever.
on:
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

# A new push to the pull request supersedes the run in progress.
concurrency:
  group: checks-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    # Branch protection on main requires a check of this exact name: rename
    # it there too.
    name: Lint, typecheck and test
    runs-on: ubuntu-latest
    steps:
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

      # Lint and typecheck cover the whole repository.
      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Test api
        run: pnpm --filter miden-playground-api test

      - name: Test web
        run: pnpm --filter miden-playground-web test
```

The first four steps must match the deploy workflows character for
character (action versions, Node 26).

**Verify**: `pnpm lint` → exit 0;
`node -e "const y=require('node:fs').readFileSync('.github/workflows/checks.yml','utf8'); for (const s of ['name: Lint, typecheck and test','pull_request:','cancel-in-progress: true','miden-playground-api test','miden-playground-web test']) if(!y.includes(s)) {console.error('missing',s); process.exit(1)}"`
→ exit 0 (if the sandbox blocks `node -e`, use one `grep -c` per string).

### Step 5: README

In `README.md`, section "### Coding conventions", insert this paragraph at
the end of the section: after the closing fence of the `pnpm typecheck` code
block, before `### Tests` (not between the intro sentence ending in "coding
conventions:" and the commands it introduces):

```markdown
Every pull request to `main` runs [`checks.yml`](.github/workflows/checks.yml) (lint, typecheck and the unit tests), and branch protection requires it to pass before merging. The deploy workflows run the same checks again before they migrate or deploy.
```

**Verify**: `pnpm lint` → exit 0 (Biome formats Markdown; run
`pnpm format` only if lint reports README.md, then re-check that the diff of
README.md is that one paragraph).

### Step 6: Commit

Second commit on `ci/deploy-checks`, e.g.
`ci: run lint, types and unit tests on pull requests`. No attribution line.

**Verify**: `git diff dff21ae --stat` → exactly
`.github/workflows/checks.yml`, the two deploy workflows and `README.md`, no
deletions.

### Not for the executor: branch protection

The reviewer turns it on after the workflow has run once on this branch's PR
(the required check name must match what GitHub reports), with the
maintainer's confirmation (given 2026-11-10):

```sh
gh api -X PUT repos/walnuthq/miden-playground/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["Lint, typecheck and test"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

`strict: true` requires the branch to be up to date with `main`, so the
check ran on what will actually be merged.

## Maintenance notes

- Renaming the `checks` job's `name:` breaks branch protection silently
  (pull requests wait for a check that never reports): update the protection
  rule in the same change.
- The deploy-time checks only matter for admin pushes that bypass
  protection; if admins are ever enforced, they can be dropped.

- A red check now blocks the production deploy; rerun the workflow from the
  Actions tab after the fix lands on `main`.
- `pnpm lint` also checks Markdown formatting; a doc-only change under
  `apps/web/**` or `apps/api/**` with unformatted Markdown will block a
  deploy. Run `pnpm format` before committing.
- If the maintainer later wants pull-request checks, the same three steps
  move into a workflow triggered by `pull_request`.
