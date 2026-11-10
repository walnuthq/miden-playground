# Plan 004: The web app's script calls treat every non-OK response as an error

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 301e950..HEAD -- apps/web/lib/api.ts`
> If the file changed, compare the "Current state" excerpts against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (land before plans/003-api-validation-and-statuses.md)
- **Category**: bug
- **Planned at**: commit `301e950`, 2026-11-10

## Why this matters

`apps/web/lib/api.ts` wraps the playground API. Ten of its functions return
`{ error }` when `!response.ok`; three (`createScript`, `deleteScript`,
`getScript`) only do so when `response.status === 500`. On any other failure
(the API's existing 400 for an invalid script type, a 502/503 from
Cloudflare) they call `response.json()` on a text body, which throws, and the
user sees a JSON parse error in the toast instead of the API's message. Plan
003 will also make the API answer 400 and 404 in more cases, which these
three functions must handle first.

## Current state

- `apps/web/lib/api.ts` — the three sites:

  ```ts
  // apps/web/lib/api.ts:23-30 (createScript)
  const response = await fetch(`${API_URL}/scripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, example }),
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  ```

  ```ts
  // apps/web/lib/api.ts:67-72 (deleteScript)
  const response = await fetch(`${API_URL}/scripts/${scriptId}`, {
    method: "DELETE",
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  ```

  ```ts
  // apps/web/lib/api.ts:263-268 (getScript)
  const response = await fetch(`${API_URL}/scripts/${id}`, {
    method: "GET",
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  ```

- The convention used everywhere else in the file (e.g. `compileScript`,
  line 58):

  ```ts
  if (!response.ok) {
    return { error: await response.text() };
  }
  ```

- Callers already handle `{ error }`: `apps/web/hooks/use-scripts.ts`
  (`newScript`, `deleteScript`), `apps/web/hooks/use-script.ts` (`getScript`
  through `useQuery`; it reads `data?.script`, so `{ error }` renders the
  not-found page).

## Commands you will need

| Purpose       | Command                                                   | Expected on success |
| ------------- | --------------------------------------------------------- | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                           | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                                | exit 0, `fail 0`    |
| Lint + format | `cd apps/web && pnpm exec biome check --write lib/api.ts` | exit 0              |

## Scope

**In scope**: `apps/web/lib/api.ts` (three conditions).

**Out of scope** (do NOT touch):

- The other functions in `api.ts`, including `getVerifiedAccountComponents`
  and `getVerifiedNote` (they parse a JSON error body from another service on
  purpose).
- Callers, hooks, components, toasts.
- `apps/api/**`.

## Git workflow

- Branch: `fix/web-api-response-ok` from `main`.
- Conventional commit, e.g.
  `fix(web): treat every failed script request as an error`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Replace the three conditions

In `createScript`, `deleteScript` and `getScript`, change
`if (response.status === 500) {` to `if (!response.ok) {`. Nothing else.

**Verify**: `grep -n "response.status === 500" apps/web/lib/api.ts` → no
match; `grep -c "if (!response.ok)" apps/web/lib/api.ts` → `13`.

### Step 2: Checks

**Verify**: `cd apps/web && pnpm typecheck` → exit 0; `pnpm test` → exit 0;
`pnpm exec biome check --write lib/api.ts` → exit 0 with no change to the
file beyond step 1.

## Test plan

No new test: `lib/api.ts` imports through the `@/` alias and calls `fetch`,
which the repo's `node --test` unit tests cannot load, and the change is three
identical one-token edits verified by `grep`. The existing Playwright specs
(`apps/web/e2e/delete-script.spec.ts`, the tutorial specs that create scripts)
cover the success paths; the operator runs them.

## Done criteria

- [ ] `grep -n "response.status === 500" apps/web/lib/api.ts` returns no match
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `cd apps/web && pnpm test` exits 0
- [ ] `git status` shows only `apps/web/lib/api.ts` (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The three excerpts don't match the live code.
- `pnpm typecheck` fails because a caller depended on the narrower condition.

## Maintenance notes

- New functions in `api.ts`: use `if (!response.ok)`.
- A 2xx response with a non-JSON body would still throw in `response.json()`;
  the callers catch it and show the message. Not changed here.
