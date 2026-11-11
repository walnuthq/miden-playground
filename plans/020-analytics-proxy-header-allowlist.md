# Plan 020: The analytics proxy forwards a fixed list of headers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/worker/index.ts apps/web/lib/analytics-events.ts`
> If either changed, compare the "Current state" excerpts against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (worst case: Simple Analytics loses a dimension until a header is added back)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

The web Worker proxies Simple Analytics through the Playground's own domain.
Its comment promises that visitor IPs never reach Simple Analytics, but the
code copies every request header and removes six named ones. Any other header
carrying the visitor's IP or location goes through: production sits behind a
Vercel rewrite, which can add its own forwarding headers, and Cloudflare adds
`cf-ipcountry` and others. Forwarding only the headers the analytics script
needs makes the promise true whatever the hops add.

## Current state

- `apps/web/worker/index.ts:9-31`:

  ```ts
  // Visitor IPs never reach Simple Analytics (as in SA's own proxy configs), and
  // neither do our cookies.
  const droppedHeaders = [
    "cookie",
    "cf-connecting-ip",
    "cf-connecting-ipv6",
    "x-forwarded-for",
    "x-real-ip",
    "true-client-ip",
  ];

  const proxy = (request: Request, target: string) => {
    const headers = new Headers(request.headers);
    for (const header of droppedHeaders) {
      headers.delete(header);
    }
    return fetch(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    });
  };
  ```

- `apps/web/worker/index.ts:33-43` — the three fixed targets: `/proxy.js`
  and `/auto-events.js` (scripts, GET) and `/simple/*` (events, forwarded to
  `queue.simpleanalyticscdn.com`).
- `apps/web/worker/index.ts:1` imports `../lib/analytics-events`: the Worker
  already shares a pure module with the app, and that module has a unit test
  (`apps/web/lib/analytics-events.test.ts`, `node:test`, relative imports
  with `.ts`).
- `apps/web/public/_headers` asks browsers for these client hints, "for
  Simple Analytics, which the Worker's proxy forwards":
  `Sec-CH-Viewport-Width, Sec-CH-Viewport-Height, Viewport-Width, Sec-CH-Lang, Lang`.
- Typecheck covers the Worker: `cd apps/web && pnpm typecheck` runs
  `tsc -p worker --noEmit` too.
- `spec/analytics-trial.md` describes the analytics setup (Simple Analytics
  next to Cloudflare Web Analytics and Analytics Engine).

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0, `fail 0`    |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**:

- `apps/web/lib/analytics-proxy.ts`, `analytics-proxy.test.ts` (create)
- `apps/web/worker/index.ts` (`droppedHeaders` and `proxy` only)

**Out of scope** (do NOT touch):

- The targets, `/ingest`, `serveWasm`, `wrangler.jsonc`, `_headers`.
- `lib/analytics.ts`, `lib/analytics-events.ts`.

## Git workflow

- Branch: `fix/analytics-proxy-allowlist` from `main`.
- Conventional commit, e.g. `fix(web): forward only an allowlist of headers to Simple Analytics`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: The allowlist, with its test

`apps/web/lib/analytics-proxy.ts`:

```ts
// The request headers the Worker forwards to Simple Analytics: what its
// script and event endpoint read (browser, language, page, viewport hints),
// and nothing that names the visitor (IP and location headers, cookies),
// whatever the hops in front of the Worker add.
const forwardedHeaders = [
  "accept",
  "accept-language",
  "content-type",
  "lang",
  "origin",
  "referer",
  "sec-ch-lang",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-ch-viewport-height",
  "sec-ch-viewport-width",
  "user-agent",
  "viewport-width",
];

export const proxyHeaders = (headers: Headers) => {
  const forwarded = new Headers();
  for (const name of forwardedHeaders) {
    const value = headers.get(name);
    if (value !== null) {
      forwarded.set(name, value);
    }
  }
  return forwarded;
};
```

`analytics-proxy.test.ts`: given a `Headers` with `user-agent`, `referer`,
`sec-ch-viewport-width`, `cookie`, `cf-connecting-ip`, `x-forwarded-for`,
`x-real-ip`, `true-client-ip`, `cf-ipcountry`, `x-vercel-forwarded-for`,
`x-vercel-ip-country`, `forwarded` and `authorization`, the result has
exactly the first three (assert on `[...result.keys()].sort()`).

**Verify**: `cd apps/web && pnpm test` → exit 0 with the new test.

### Step 2: Use it in the Worker

In `worker/index.ts`: import `{ proxyHeaders }` from
`"../lib/analytics-proxy"`, delete `droppedHeaders`, and make `proxy` pass
`headers: proxyHeaders(request.headers)`. Rewrite the comment above to say
that only the headers listed in `lib/analytics-proxy.ts` are forwarded, so
neither visitor IPs nor cookies reach Simple Analytics.

**Verify**: `grep -n "droppedHeaders" apps/web/worker/index.ts` → no match;
`cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write worker/index.ts lib/analytics-proxy.ts lib/analytics-proxy.test.ts`
→ exit 0.

## Test plan

- Unit: `analytics-proxy.test.ts`.
- After a deploy (operator): open the production site, check in the Simple
  Analytics dashboard that a pageview arrives with its browser, device type,
  language and referrer still filled. If a dimension went empty, add the
  missing header to `forwardedHeaders` (Simple Analytics' proxy
  documentation lists what it reads) and note it in the plan's row.

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0 including `analytics-proxy.test.ts`
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `grep -n "new Headers(request.headers)" apps/web/worker/index.ts` → at most the match inside `serveWasm`
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `proxy` doesn't match the excerpt, or is called for a target other than
  Simple Analytics' three.
- `tsc -p worker` can't resolve `../lib/analytics-proxy` (the Worker's
  tsconfig excludes it): report instead of duplicating the list in the
  Worker.

## Maintenance notes

- The list is a first version: the headers Simple Analytics needs were
  inferred from what the app already requests (`Accept-CH` in `_headers`)
  and from general practice, not confirmed against their documentation.
  The post-deploy check in the test plan is what confirms it.
- A new analytics proxy target must go through `proxyHeaders` too.
- Whether a forwarding header actually reaches the Worker in production was
  not observed; this change is the defensive answer either way.
