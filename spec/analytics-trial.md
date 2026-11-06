# Analytics trial: Cloudflare next to Simple Analytics

Status: running since 2026-11-06 (PR #770). All three sources were verified on
production that day, and in Brave and in Chrome with uBlock Origin Lite `/ingest`
got through while the beacon was blocked.

Can Cloudflare replace Simple Analytics (SA)? Web Analytics, the free product,
has page views and visits but no custom events ("Not yet", in its FAQ), so events
would go to Workers Analytics Engine (AE) through our Worker. The trial runs all
of them side by side in production, then we decide: see the schedule below.

## What runs

| Source            | Measures                   | Route                                        | Blockable                    |
| ----------------- | -------------------------- | -------------------------------------------- | ---------------------------- |
| Simple Analytics  | page views, visits, events | `/proxy.js`, `/simple/*`, through the Worker | Not by the lists checked     |
| Cloudflare beacon | page views, visits         | `cloudflareinsights.com`, directly           | Yes: EasyPrivacy, Peter Lowe |
| AE                | page views, visits, events | `POST /ingest`, on the Worker                | Not by the lists checked     |

The beacon stays on Cloudflare's domain. It has an undocumented `send.to` setting,
but the FAQ says "We do not support custom integrations directly with the
endpoint", and `/cdn-cgi/rum` is blocked on any domain by EasyPrivacy anyway. Its
script isn't version-pinned, so a proxy could break silently, and forwarding
without the visitor's IP may skew the country data.

The route is named `/ingest` because `/events`, `/track`, `/collect`, `/pageview`
and `/stats` all have path rules in those lists. The lists change, so check it on
real blockers (below).

## What AE stores

The event's name, the route's pattern (`/scripts/:id`, never the path), and the
event's fields: `lib/analytics-events.ts` has the columns. No IP, user agent,
country, cookie or identifier, so it counts events, not people.

- `visit` follows SA's documented rule: the document's first view, not a reload
  or back/forward, with no referrer or another site's. Cloudflare's "Visits" is
  similar, but its docs don't say how it treats reloads.
- `automated` is `navigator.webdriver`: e2e, the status page's probe, QA. The
  report leaves it out of `people`. SA and the beacon may count that traffic, so
  a small gap on a quiet day can come from this.
- `/ingest` accepts only the configured site's `Origin`. That keeps other
  hostnames and preview URLs out, but it isn't authentication: a script can send
  any `Origin` and spam the route with valid events.

## Comparing

`pnpm analytics:report [days]` in `apps/web` prints AE's daily counts, in UTC. It
needs `ANALYTICS_ACCOUNT_ID` and `ANALYTICS_API_TOKEN` (Account Analytics Read) in
`apps/web/.env.local`. Read SA's and Web Analytics' figures from their dashboards,
over the same dates. Cloudflare's dashboard figures can be sampled.

## Schedule

2026-11-06 was a Friday, so the first three days are mostly a weekend, which may
not look like working days.

1. **Tuesday 2026-11-10, preliminary read.** Catches a broken pipeline and gives
   the beacon's gap so far, and how much event volume there is. Rarer events will
   be too few to judge, and nothing gets decided or removed.
2. **Friday 2026-11-13, possible early finish.** A final decision is reasonable if
   a full week has enough volume and the gaps have stayed stable.
3. **Friday 2026-11-20, otherwise.** If volume is low or the numbers are still
   moving.

Each read needs SA's page views, visitors and event counts and Web Analytics' page
views and visits, for the same dates. Keep all three sources running until the
final read: removing SA is the step that can't be undone, since it's the baseline.

## Decision

Page views are reported to management, so they have to be accurate. AE's page views
are the reporting source if they pass the checks below: the beacon can be blocked,
AE's route isn't on the lists checked. Compare totals over the whole trial, leaving
out `automated`. Under about 100 of an event is too few to
judge, not a failure.

1. **Events: AE within about 5% of SA.** Both go through our domain from the same
   `trackEvent` call, so a larger gap means a bug: fix it, and restart the
   comparison.
2. **Page views: AE within about 10% of SA.** Same reasoning, with SA as today's
   baseline. Passing both means AE can replace SA.
3. **Beacon page views: within about 10% of AE's** to keep it as a free dashboard
   with Web Vitals. It isn't the reporting source either way, and its gap also
   includes visitors who leave before it reports. Otherwise, remove it.

Failing 1 or 2 without a fix means staying on SA. These thresholds are judgement
calls, set before seeing any data.

AE counts page views and visits, not people, as SA does. A switch also means
building a report for management on the SQL API (no events dashboard) and a
scheduled export, since AE keeps data for three months.

## After the trial

**Staying on SA:** remove the beacon plugin, `/ingest`, the dataset binding, the
report and `lib/analytics-events.ts`.

**Moving to Cloudflare**, after exporting SA's history:

- the SA proxy in `worker/index.ts`, `SIMPLE_ANALYTICS_HOSTNAME` and `.dev.vars`;
- the client hints in `public/_headers`;
- the `simpleAnalytics` plugin in `vite.config.ts`;
- `/proxy.js`, `/auto-events.js` and `/simple/*` in `run_worker_first`;
- `sa_event` in `lib/analytics.ts` and `window.d.ts`;
- SA's paths in the probe's `IGNORED_REQUEST_PATHS`;
- the mentions in the README and `docs/claude/vite-build.md`.

## Testing locally

`vite build --mode development && wrangler dev --port 3000 --var ANALYTICS_HOSTNAME:miden-playground.walnut.dev`.
The hostname isn't a typo: `wrangler dev` rewrites a local `Origin` to the route in
`wrangler.jsonc`, so `localhost` gets a 403. Production doesn't do this. That build
has no beacon, whose token is only in `.env.production`.
