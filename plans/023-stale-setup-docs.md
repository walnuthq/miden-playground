# Plan 023: The setup docs name only things that exist

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- README.md compose.yaml .dockerignore apps/web/AGENTS.md`
> If any changed, compare the "Current state" excerpts against the live
> files before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Three leftovers send people and agents to things that aren't there. The
README's setup tells contributors to run a `build:rust` script that no
package defines, so the fifth setup command fails. A root `compose.yaml`
builds `apps/api` from a Dockerfile that doesn't exist, so `docker compose up`
from the repo root fails, while the real database setup is
`apps/api/docker-compose.yml`. And `apps/web/AGENTS.md` tells agents to read
Next.js docs in `node_modules/next`, although the app is a Vite SPA and
`next` isn't installed.

## Current state

- `README.md:14-18`:

  ```md
  The app requires the following dependencies:

  - [NodeJS](https://nodejs.org/) >= 26
  - [pnpm](https://pnpm.io/) >= 11
  ```

  The root `package.json` pins `"packageManager": "pnpm@12.18.0+sha512…"`.

- `README.md:63-74`:

  ````md
  ```sh
  docker compose -f apps/api/docker-compose.yml up -d
  pnpm --filter miden-playground-api db:migrate
  ```

  Build Rust helpers:

  ```sh
  pnpm --filter miden-playground-api build:rust
  ```

  Install Miden Rust compiler using this guide: https://0xmiden.github.io/compiler/usage/cargo-miden.html
  ````

  `apps/api/package.json` scripts: `dev`, `build`, `deploy`, `lint`,
  `format`, `typecheck`, `test`, `cf-typegen`, `db:push`, `db:generate`,
  `db:migrate`, `examples:compile`, `templates:check`, `templates:sync`,
  `lockfile:check`, `lockfile:sync`. No `build:rust`.

  Compiling is done by a separate service (api-compile, from the
  miden-source-code-verification project), reached through
  `API_COMPILE_URL` (default `http://localhost:8080`). The API itself needs
  no Rust toolchain. `apps/web/e2e/README.md:9` says which flows need that
  service: the two examples and tutorial 9 only need Postgres (their
  packages come precompiled); tutorials 7, 8, 11 and 12 and the script
  editor compile.

- `compose.yaml` (repo root, tracked) — the whole file:

  ```yaml
  services:
    api:
      build:
        context: apps/api
        additional_contexts:
          - root=.
      restart: always
      #environment:
      #- WEB_URL=http://localhost:3000
      #volumes:
      #- ./apps/api:/home/node/apps/api
      #- /home/node/apps/www/.next
      #- /home/node/apps/www/node_modules
      ports:
        - 3002:3002
      #depends_on:
      #- storage
  ```

  `git ls-files | grep -i dockerfile` → nothing.

- `.dockerignore` (repo root, tracked): `Dockerfile`, `.dockerignore`,
  `node_modules`, `npm-debug.log`, `README.md`, `.next`, `.git`. Nothing
  builds a Docker image from this repo.
- No tracked `.md`, `.json` or `.yml` file outside `plans/` references
  `compose.yaml` or `.dockerignore`.

- `apps/web/AGENTS.md:12-20`:

  ```md
  <!-- BEGIN:nextjs-agent-rules -->

  ## This is NOT the Next.js you know

  This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

  This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

  <!-- END:nextjs-agent-rules -->
  ```

  Lines 1-10 (the `<!-- intent-skills:start -->` … `<!-- intent-skills:end -->`
  block) stay. The root `AGENTS.md` has a Turborepo block that is current:
  don't touch it.

- Biome formats Markdown in this repo: after editing a `.md` file, run
  `pnpm exec biome check --write <file>`; `pnpm lint` checks it in CI.

## Commands you will need

| Purpose     | Command                                                      | Expected on success |
| ----------- | ------------------------------------------------------------ | ------------------- |
| Format docs | `pnpm exec biome check --write README.md apps/web/AGENTS.md` | exit 0              |
| Lint        | `pnpm lint` (repo root)                                      | exit 0              |

## Scope

**In scope**: `README.md` (the two passages above), `compose.yaml` (delete),
`.dockerignore` (delete).

**Revised 2026-11-11 during execution**: `apps/web/AGENTS.md` (and the root
`AGENTS.md`) are untracked, ignored by `.gitignore:36` (`AGENTS.md`). Step 3
can't be committed and is dropped; the stale Next.js block in the local,
ignored copy is the maintainer's to remove by hand.

**Out of scope** (do NOT touch):

- `apps/api/docker-compose.yml`, the rest of the README (environment table,
  database migrations, local node setup).
- The root `AGENTS.md`, `CLAUDE.md`, `docs/claude/*`.
- `.gitignore`.

## Git workflow

- Branch: `docs/stale-setup` from `main`.
- Conventional commit, e.g. `docs: remove setup steps and files that no longer apply`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: README

- Change `>= 11` to `>= 12` on the pnpm line.
- Replace the "Build Rust helpers" paragraph, its code block and the
  "Install Miden Rust compiler…" line with:

  ```md
  Scripts are compiled by a separate service, api-compile (from
  [miden-source-code-verification](https://github.com/walnuthq/miden-source-code-verification)),
  which the API reaches at `API_COMPILE_URL` (`http://localhost:8080` by
  default). Without it, the examples still launch (their packages are
  precompiled), but compiling a script fails.
  ```

  Before writing the link, confirm the repository URL:
  `gh repo view walnuthq/miden-source-code-verification --json url --jq .url`.
  If it doesn't resolve, write the sentence without the link.

**Verify**: `grep -n "build:rust\|>= 11" README.md` → no match.

### Step 2: Remove the dead Docker files

```sh
git rm compose.yaml .dockerignore
```

**Verify**:
`grep -rn "compose.yaml\|dockerignore" --include=*.md --include=*.json --include=*.yml --include=*.yaml --include=*.ts . --exclude-dir=node_modules --exclude-dir=plans --exclude-dir=.git`
→ no match (`apps/api/docker-compose.yml` is another file and stays).

### Step 3: `apps/web/AGENTS.md` — DROPPED (file is gitignored, see Scope)

Delete from the blank line after `<!-- intent-skills:end -->` through
`<!-- END:nextjs-agent-rules -->`. The file ends with the
`<!-- intent-skills:end -->` line and a newline.

**Verify**: `grep -ci "next" apps/web/AGENTS.md` → `0`;
`head -1 apps/web/AGENTS.md` → `<!-- intent-skills:start -->`.

### Step 4: Format and lint

**Verify**: `pnpm exec biome check --write README.md apps/web/AGENTS.md` →
exit 0; `pnpm lint` → exit 0.

## Test plan

No tests: documentation and dead files. The greps above are the checks.

## Done criteria

- [ ] `grep -n "build:rust" README.md` → no match
- [ ] `ls compose.yaml .dockerignore 2>&1 | grep -c "No such file"` prints `2`
- [ ] `pnpm lint` exits 0
- [ ] `git status` shows only the three in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A workflow, script or doc references `compose.yaml`, `.dockerignore` or a
  Dockerfile (the grep of step 2 finds something): report it instead of
  deleting.
- `next` turns out to be a dependency of `apps/web`
  (`grep -n '"next"' apps/web/package.json` matches).
- The operator wants the api-compile setup documented in more detail than
  one paragraph: that needs facts from the other repository; report.

## Maintenance notes

- If a tool re-adds the Next.js block to `apps/web/AGENTS.md`, something
  still runs `next`: find it rather than committing the block again.
- The README now points at api-compile without setup steps for it: those
  live in that project.
