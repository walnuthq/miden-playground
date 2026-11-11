# Plan 021: Workflow actions are pinned to commit SHAs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- .github`
> If a workflow changed, re-run the `grep` of "Current state" and work from
> its live output.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

The deploy workflows hold the production database URL, the Cloudflare API
token and a Slack webhook. Every action they use is referenced by a major
version tag (`@v7`), which its publisher can move to any commit. One of them,
`pnpm/action-setup`, is third-party and installs the `pnpm` binary every
later step runs. A repointed tag would run new code with those secrets in
reach. Pinning each action to a full commit SHA makes the workflow run
exactly the code that was reviewed; Dependabot then proposes the updates.
The likelihood is low; the fix is mechanical.

## Current state

- `grep -n "uses:" .github/workflows/*.yml` at the planned commit:

  ```
  .github/workflows/checks.yml:27:        uses: actions/checkout@v7
  .github/workflows/checks.yml:30:        uses: pnpm/action-setup@v6
  .github/workflows/checks.yml:33:        uses: actions/setup-node@v7
  .github/workflows/deploy-api-cloudflare.yml:31:        uses: actions/checkout@v7
  .github/workflows/deploy-api-cloudflare.yml:34:        uses: pnpm/action-setup@v6
  .github/workflows/deploy-api-cloudflare.yml:37:        uses: actions/setup-node@v7
  .github/workflows/deploy-status-page.yml:45:        uses: actions/checkout@v7
  .github/workflows/deploy-status-page.yml:48:        uses: pnpm/action-setup@v6
  .github/workflows/deploy-status-page.yml:51:        uses: actions/setup-node@v7
  .github/workflows/deploy-status-page.yml:66:        uses: actions/cache@v6
  .github/workflows/deploy-status-page.yml:107:        uses: actions/upload-pages-artifact@v5
  .github/workflows/deploy-status-page.yml:120:        uses: actions/deploy-pages@v5
  .github/workflows/deploy-web-cloudflare.yml:34:        uses: actions/checkout@v7
  .github/workflows/deploy-web-cloudflare.yml:37:        uses: pnpm/action-setup@v6
  .github/workflows/deploy-web-cloudflare.yml:40:        uses: actions/setup-node@v7
  ```

- `.github/` holds only `workflows/`: there is no `dependabot.yml`.
- `.github/workflows/checks.yml` defines the job named
  `Lint, typecheck and test`, which branch protection on `main` requires by
  that exact name. Do not rename jobs or steps.
- The rest of the workflows is sound and must stay as it is: no
  `pull_request_target`, `permissions: contents: read` on the checks job,
  deploys only on push to `main` or manual dispatch.

## Commands you will need

| Purpose       | Command                                                      | Expected on success |
| ------------- | ------------------------------------------------------------ | ------------------- |
| Resolve a tag | `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`        | a 40-character SHA  |
| Exact release | `gh api repos/<owner>/<repo>/releases/latest --jq .tag_name` | e.g. `v7.0.1`       |
| Lint          | `pnpm lint` (repo root)                                      | exit 0              |

`gh` must be authenticated (`gh auth status`). Public repositories only: no
secret is involved.

## Scope

**In scope**:

- `.github/workflows/checks.yml`, `deploy-api-cloudflare.yml`,
  `deploy-web-cloudflare.yml`, `deploy-status-page.yml` (the `uses:` lines
  only)
- `.github/dependabot.yml` (create)

**Out of scope** (do NOT touch):

- Any other line of the workflows: triggers, permissions, job and step
  names, `with:` blocks, secrets.
- Action major versions: pin the version in use, don't upgrade.
- `pnpm-workspace.yaml`, npm dependency updates (Dependabot is configured
  here for GitHub Actions only).

## Git workflow

- Branch: `ci/pin-actions` from `main`.
- Conventional commit, e.g. `ci: pin actions to commit SHAs`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Resolve each tag to a SHA

For each distinct action reference (`actions/checkout@v7`,
`pnpm/action-setup@v6`, `actions/setup-node@v7`, `actions/cache@v6`,
`actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`):

```sh
gh api repos/actions/checkout/commits/v7 --jq .sha
gh api "repos/actions/checkout/tags?per_page=100" --jq '.[] | select(.commit.sha == "<that sha>") | .name'
```

The second command names the exact release tag(s) pointing at that commit
(e.g. `v7.0.1`), for the comment.

**Verify**: six SHAs, each 40 hex characters, each with an exact version.

### Step 2: Replace the references

Rewrite every `uses:` line as:

```yaml
uses: actions/checkout@<40-char sha> # v7.0.1
```

Same SHA for every occurrence of the same action.

**Verify**:
`grep -n "uses:" .github/workflows/*.yml | grep -vE "@[0-9a-f]{40} # v[0-9]"`
→ no output. `grep -c "uses:" .github/workflows/*.yml` → `3`, `3`, `6`, `3`
(checks, deploy-api, deploy-status-page, deploy-web).
`git diff --stat` → only `uses:` lines changed (15 lines).

### Step 3: Let Dependabot keep them current

Create `.github/dependabot.yml`:

```yaml
# Keeps the workflows' pinned actions (commit SHAs) up to date.
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
    groups:
      actions:
        patterns: ["*"]
```

**Verify**: `pnpm lint` (root) → exit 0 (Biome may not check YAML: then
validate with
`node -e 'console.log(require("node:fs").readFileSync(".github/dependabot.yml","utf8").includes("github-actions"))'`
→ `true`).

## Test plan

- The `Checks` workflow runs on the pull request and exercises the pinned
  `checkout`, `action-setup` and `setup-node`: it must pass (operator, after
  pushing).
- The deploy workflows run on merge to `main`: the operator watches the
  first run of each (`deploy-status-page` uses three more actions). A merge
  is a production deploy in this repo: only the operator merges.

## Done criteria

- [ ] `grep -n "uses:" .github/workflows/*.yml | grep -vE "@[0-9a-f]{40} # v[0-9]"` prints nothing
- [ ] `.github/dependabot.yml` exists with the `github-actions` ecosystem
- [ ] `git diff --stat 874bd1a -- .github/workflows` shows 15 changed lines, all `uses:`
- [ ] `plans/README.md` status row updated

## STOP conditions

- `gh` is not authenticated or a tag doesn't resolve.
- A tag resolves to a commit with no exact release tag pointing at it (pin
  the SHA anyway only if the operator agrees: report).
- The operator doesn't want Dependabot pull requests: skip step 3 and say so
  in the plan's row; the pins then need manual updates.

## Maintenance notes

- A Dependabot pull request for actions changes workflow files: review the
  action's release notes before merging, as for any dependency.
- New workflows: pin by SHA with the version in a comment.
- `docs/claude/node-tooling.md` says Node's version appears as
  `node-version` in the workflows: unchanged here.
