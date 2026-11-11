# Plan 019: The web app ships a Content-Security-Policy in report-only mode

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/public/_headers apps/web/index.html apps/web/vite.config.ts apps/web/worker/index.ts`
> If any changed, compare the "Current state" excerpts against the live code
> before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW in report-only mode (this plan); MED when enforced (a later decision)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

The Playground's origin holds account secret keys (the SDK's IndexedDB store
and saved projects) and can ask Para or Bread Wallet for signatures,
including on Mainnet. The page also runs two third-party analytics scripts.
No Content-Security-Policy is set, so nothing limits where scripts may load
from or where the page may send data if any script is compromised or
something is injected. Enforcing a policy blindly would break WASM, the Para
iframe or the prover, so this plan ships the policy as
`Content-Security-Policy-Report-Only`: browsers log violations to the console
without blocking anything. Turning it into an enforced policy is a separate,
later decision for the maintainer, once the log is clean.

## Current state

- `apps/web/public/_headers` — the whole file (Cloudflare static-assets
  header rules; served by the Worker's assets binding):

  ```
  /assets/*
    Cache-Control: public,max-age=31536000,immutable

  # Accept-CH: client hints for Simple Analytics, which the Worker's proxy forwards
  # (what @simpleanalytics/next added). No Vary on them: no response depends on
  # them, and a web worker's fetches don't send them, so Chromium would revalidate
  # every asset a worker reuses from the page.
  /*
    Accept-CH: Sec-CH-Viewport-Width, Sec-CH-Viewport-Height, Viewport-Width, Sec-CH-Lang, Lang
    Vary: Accept-Encoding
  ```

- `apps/web/index.html:35-55` — one inline `<script>` in `<head>` that
  applies the theme before first paint; `:59` —
  `<script type="module" src="/main.tsx"></script>`.
- `apps/web/vite.config.ts:74-108` — production builds inject two scripts:
  `<script async src="/proxy.js">` (Simple Analytics, served first-party by
  the Worker) and, when `VITE_CF_BEACON_TOKEN` is set,
  `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='…'>`.
- `apps/web/wrangler.jsonc` — the Worker runs first only for `/proxy.js`,
  `/auto-events.js`, `/simple/*`, `/ingest` and `/assets/*.wasm`; everything
  else, `index.html` included, comes straight from the assets with the
  `_headers` rules.
- Production is `https://playground.miden.xyz`, a Vercel rewrite in front of
  the Worker (`https://miden-playground.walnut.dev`); response headers pass
  through.
- Hosts the app talks to are constants, not user input:
  `apps/web/lib/constants.ts` (API URL, registry URL, guardian endpoint,
  explorers), `apps/web/lib/types/network.ts` (per-network RPC, prover and
  note-transport URLs), `apps/web/lib/miden-faucet.ts` (faucet), Para's SDK
  (`@getpara/*`: an iframe/popup and its API hosts), the Monaco editor
  (web workers), the Miden SDK (WASM, a web worker).
- Docs to read first: `docs/claude/vite-build.md` (build plugins, testing
  the built app) and `docs/claude/phone-layout.md` only if you touch
  `index.html` (you shouldn't need to).
- `pnpm preview` in `apps/web` builds and serves the real Worker locally
  (`vite build && wrangler dev`), with `_headers` applied.

## Commands you will need

| Purpose      | Command                                                         | Expected on success       |
| ------------ | --------------------------------------------------------------- | ------------------------- |
| Build        | `cd apps/web && pnpm build`                                     | exit 0                    |
| Serve built  | `cd apps/web && pnpm preview`                                   | serves on wrangler's port |
| Header check | `curl -sI http://localhost:<port>/ \| grep -i content-security` | the header line           |
| Lint         | `pnpm lint` (repo root)                                         | exit 0                    |

## Scope

**In scope**:

- `apps/web/public/_headers`
- `docs/claude/vite-build.md` (a short paragraph, step 4)

**Out of scope** (do NOT touch):

- An enforcing `Content-Security-Policy` header: report-only ONLY.
- `apps/web/index.html`, `vite.config.ts`, `worker/index.ts`: no nonces, no
  script changes, no report endpoint.
- COOP/COEP or other headers.
- `apps/api/**`.

## Git workflow

- Branch: `chore/csp-report-only` from `main`.
- Conventional commit, e.g. `chore(web): add a report-only Content-Security-Policy`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Inventory the hosts

List every origin the built app loads from or connects to. Sources:

```sh
grep -rhoE "https?://[a-zA-Z0-9.-]+" apps/web/lib/constants.ts apps/web/lib/types/network.ts apps/web/lib/miden-faucet.ts apps/web/lib/miden-client.ts apps/web/.env.production | sort -u
grep -rhoE "https://[a-zA-Z0-9.-]+" apps/web/node_modules/@getpara/*/dist --include=*.js | sort | uniq -c | sort -rn | head -40
```

Sort them into: scripts, connections (`fetch`/XHR/WebSocket), frames,
images, fonts, styles. Do not copy any key or token value from
`.env.production` into the plan, the header or your report: hosts only.

**Verify**: a written list (in your report) of hosts per directive.

### Step 2: Write the report-only policy

Add to the `/*` block of `_headers` one line (a `_headers` value must be on
a single line, at most 2,000 characters):

```
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-<hash of the inline theme script>' https://static.cloudflareinsights.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' <the connection hosts of step 1>; frame-src <Para's frame hosts>; object-src 'none'; base-uri 'self'; form-action 'self'
```

Compute the inline script's hash from the built file, not by hand:

```sh
cd apps/web && pnpm build && node -e '
const html = require("fs").readFileSync("dist/index.html", "utf8");
for (const [, body] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  console.log("sha256-" + require("crypto").createHash("sha256").update(body).digest("base64"));
}'
```

One hash per inline script printed; include each. Add a comment above the
header line saying it is report-only, where the hash comes from (the
command), and that an edit to the inline theme script in `index.html`
changes it.

**Verify**: `cd apps/web && pnpm build` → exit 0;
`grep -c "Content-Security-Policy-Report-Only" apps/web/dist/_headers` → `1`;
`grep -c "^  Content-Security-Policy:" apps/web/dist/_headers` → `0`.

### Step 3: Collect violations locally

Run `cd apps/web && pnpm preview`, open the served URL in a browser with the
console open (the `agent-browser` project skill can do this; otherwise ask
the operator), and exercise: the home page, a Testnet sandbox (create a
wallet, fund it), the script page (compile, the MASM tab), connecting Para up
to its login screen, connecting Bread Wallet if available. Each
`[Report Only]` console line names a directive and a blocked URL.

For each violation, either add the host or keyword to the right directive
(when the load is legitimate) or record it in your report (when it isn't
expected). Repeat until a pass over those flows logs no `[Report Only]`
line. Do not add `'unsafe-eval'` or `'unsafe-inline'` to `script-src`, or
`*` anywhere: if a flow needs one, record it instead.

**Verify**: `curl -sI http://localhost:<port>/ | grep -ic "content-security-policy-report-only"`
→ `1`. State in your report which flows you exercised and the remaining
violations, if any.

### Step 4: Document it

Add to `docs/claude/vite-build.md` a short paragraph: the policy lives in
`apps/web/public/_headers`, it is report-only, how the inline-script hash is
computed, and that a new external host (an RPC endpoint, an analytics
script, a signer) must be added there. Run
`pnpm exec biome check --write docs/claude/vite-build.md` (Biome formats
Markdown in this repo).

**Verify**: `pnpm lint` (root) → exit 0.

## Test plan

- No automated test: the policy is data. The verification is step 3's
  console pass, and after a deploy, the same pass on production by the
  operator (the Para and Bread flows behave differently there).
- E2E is unaffected in report-only mode, but the specs run against
  `pnpm dev` (no `_headers`), so they prove nothing about the policy.

## Done criteria

- [ ] `grep -c "Content-Security-Policy-Report-Only" apps/web/public/_headers` prints `1`
- [ ] `grep -c "^  Content-Security-Policy:" apps/web/public/_headers` prints `0`
- [ ] The header line is under 2,000 characters (`awk 'length > 2000' apps/web/public/_headers` prints nothing)
- [ ] `cd apps/web && pnpm build` exits 0
- [ ] `pnpm lint` (root) exits 0
- [ ] Your report lists the flows exercised and any violation left
- [ ] `git status` shows only the two in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The policy can't fit in 2,000 characters without wildcards (Para's host
  list is too long): report the list; a Worker-set header is a different
  design.
- A legitimate flow needs `'unsafe-eval'` in `script-src` (not
  `'wasm-unsafe-eval'`).
- `pnpm preview` doesn't apply `_headers` (the header is missing from the
  response): report, don't move the header into the Worker.
- You are tempted to switch the header to enforcing: don't.

## Maintenance notes

- Next step, for the maintainer: after a week or two of clean consoles on
  production, rename the header to `Content-Security-Policy`. That is when
  the risk becomes real: test Para login, Bread Wallet, proving and the
  script page on a preview deploy first.
- Report-only without a `report-to` endpoint only logs in each visitor's
  console; nobody is notified. A reporting endpoint (the Worker's `/ingest`
  could take it) is a possible follow-up.
- The inline theme script's hash must be recomputed whenever that script
  changes, or the enforced policy would block it and dark-mode users would
  see a flash.
- `style-src 'unsafe-inline'` stays: Monaco and the UI library set inline
  styles.
