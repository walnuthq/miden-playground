# Serving playground.miden.xyz from the Worker directly

Status: postponed, written 2026-11-02 (investigation 2026-10-27). Step 1 is
half done: the fallback DNS record exists, but Cloudflare for SaaS isn't
enabled on `walnut.dev` yet, which blocks everything after it (see
"Progress").

## Current setup (the hack)

- `playground.miden.xyz` is a record in the `miden.xyz` zone, which is on
  **Cloudflare DNS in Miden's account** (nameservers `dara/pete.ns.cloudflare.com`),
  not ours. The record is a CNAME to Vercel
  (`5176408c992b5e2b.vercel-dns-016.com`).
- On Vercel, <https://github.com/saimeunt/miden-playground-redirect> is a
  stock create-next-app whose only logic is a `beforeFiles` rewrite in
  `next.config.ts`: `/:path*` → `https://miden-playground.walnuthq.workers.dev/:path*`.
- The web Worker (`apps/web/wrangler.jsonc`, account Walnut
  `bc9b33d0085cd132a6a2f6b86235245f`) has the custom domain
  `miden-playground.walnut.dev`, and keeps `workers_dev: true` only so that
  Vercel can reach it.

Why it was done this way: Worker custom domains and routes only attach to
zones in the Worker's own account. A plain CNAME from `playground.miden.xyz`
to `miden-playground.walnut.dev` fails with Cloudflare error 1014 (CNAME
cross-user banned), because both zones are on Cloudflare under different
accounts.

Costs of the hack:

- two edge hops (Vercel, then Cloudflare) for every request, including the
  big WASM and asset downloads, which also count as Vercel bandwidth;
- two cache layers (responses carry both `x-vercel-cache` and `cf-cache-status`);
- the Worker sees Vercel's IPs instead of the client's (Simple Analytics proxy);
- a Next.js app to keep patched, and `workers_dev` must stay on;
- Vercel Attack Challenge Mode sits in front of the app, which is why
  `apps/status-page` has Vercel challenge handling.

## Options considered

1. **Cloudflare for SaaS custom hostname on `walnut.dev`.** Chosen.
   `playground.miden.xyz` becomes a custom hostname of our zone, Miden CNAMEs it
   to our fallback origin, and a Worker route on our zone catches its traffic.
   The Worker stays in our account, and deploys don't change. Miden touches DNS
   once and can revoke at any time by removing the CNAME. Free plan: 100 custom
   hostnames included (enabling it may ask for a payment method).
2. **Move the Worker into Miden's Cloudflare account** (scoped API token for
   Workers Scripts and Routes on `miden.xyz`, `account_id` in wrangler), then
   `{ "pattern": "playground.miden.xyz", "custom_domain": true }`. This is the
   cleanest technically, but deploys, logs and billing move to their account.
   It's an organizational decision.
3. **Membership in Miden's account** scoped to the zone and Workers: same as 2
   with personal logins.
4. Stopgaps, not real fixes: a proxy Worker in Miden's zone (still a double
   hop); a 301 to `miden-playground.walnut.dev` (the visible URL changes,
   Para allowed origins and `SIMPLE_ANALYTICS_HOSTNAME` need updating);
   subdomain zone delegation (Enterprise only).

Reference: <https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/worker-as-origin/>
(originless fallback record, then a Worker route; a route that matches
bypasses the hostname's `custom_origin_server`).

## Plan (option 1)

1. In `walnut.dev` (zone id `71ce19bbf7deb0bec1472596d5d4cf4b`, Free plan):
   - proxied `saas-fallback.walnut.dev AAAA 100::`, set as the fallback origin
     (`PUT /zones/:zone/custom_hostnames/fallback_origin`
     `{"origin":"saas-fallback.walnut.dev"}`), and wait until it is active;
   - custom hostname `playground.miden.xyz`, `ssl: { method: "txt", type: "dv" }`
     (`POST /zones/:zone/custom_hostnames`). TXT validation lets the
     certificate issue before any traffic moves. The response (or a later GET)
     gives two TXT records: hostname pre-validation
     (`_cf-custom-hostname.playground.miden.xyz`) and certificate validation
     (`_acme-challenge.playground.miden.xyz`).
2. Miden adds both TXT records. Nothing changes for users yet.
3. Merge the repo change below once the custom hostname exists, since the
   route deploy likely fails before that. Merging `main` deploys. Check that
   the route appears under the zone's Workers Routes.
4. Once the hostname and certificate are active, Miden replaces the
   `playground` CNAME with `CNAME playground saas-fallback.walnut.dev`,
   **DNS only (grey cloud)**. If it's proxied, orange-to-orange applies:
   it still works, but Miden's zone settings run first.
5. Verify `https://playground.miden.xyz`: `server: cloudflare`, no
   `x-vercel-*` headers, COOP/COEP still present, Para login works, Bread
   tutorials work (e2e against prod).
6. Follow-up PR: drop `workers_dev: true` and its comment; remove the Vercel
   challenge handling in `apps/status-page` (`scripts/probe.ts`,
   `scripts/notify.ts`, the README section on Attack Challenge Mode). Then
   delete the Vercel project and archive `miden-playground-redirect`.

### Repo change

Already written on local branch `chore/saas-custom-hostname` (commit
`930b6b9`, not pushed, based on 2026-10-27 `main`, so rebase it or redo it by
hand). In `apps/web/wrangler.jsonc`:

```jsonc
  // Until miden.xyz's playground CNAME moves off Vercel, Vercel proxies
  // playground.miden.xyz to the workers.dev URL, which wrangler disables when
  // routes are declared unless this is set. Drop it once the CNAME points to
  // walnut.dev.
  "workers_dev": true,
  // Deploys attach the routes and custom domains listed here and detach any
  // other.
  "routes": [
    { "pattern": "miden-playground.walnut.dev", "custom_domain": true },
    // miden.xyz is in Miden's Cloudflare account, where this Worker can't take
    // a custom domain. It is a Cloudflare for SaaS custom hostname of the
    // walnut.dev zone instead: Miden CNAMEs it to the zone's fallback origin
    // (saas-fallback.walnut.dev), and this route sends its traffic here. The
    // custom hostname must exist in walnut.dev before this deploys.
    { "pattern": "playground.miden.xyz/*", "zone_name": "walnut.dev" },
  ],
```

In `apps/api/index.ts`, the CORS comment above `https://miden-playground.walnut.dev`
becomes "The web Worker's own domain; WEB_URL is the miden.xyz one." The
allowed origins don't change: the public domain stays `playground.miden.xyz`.

`wrangler deploy --dry-run` and Biome pass on it. The dry run doesn't call
the API, so it doesn't prove the route attaches.

## Progress

- Done (2026-10-27): `saas-fallback.walnut.dev AAAA 100::`, proxied, record id
  `2f0e48881f6e36edcc1ddb5cd7a14776`, with a comment saying what it's for.
- Blocked: the fallback origin and custom hostname APIs answer
  `1456 … This feature is available with SSL for SaaS` and
  `1404 No quota has been allocated for this zone`. Cloudflare for SaaS must
  be enabled by hand (billing step) at
  <https://dash.cloudflare.com/bc9b33d0085cd132a6a2f6b86235245f/walnut.dev/ssl-tls/custom-hostnames>
  ("Enable Cloudflare for SaaS"; don't fill in the fallback or hostnames there,
  the API calls above do it).
- Not started: everything from the fallback origin on, the message to Miden,
  the merge.

## Credentials

- The Wrangler OAuth login is **not enough**: it lacks DNS and custom hostname
  access (`10000 Authentication error`) despite its `ssl_certs (write)` scope.
- A user API token with Zone → DNS: Edit and Zone → SSL and Certificates: Edit
  on `walnut.dev` was saved to `~/.cf-saas-token` (mode 600) and expires
  2027-10-27. Use it as `Authorization: Bearer $(cat ~/.cf-saas-token)`, and
  check it first with `GET /user/tokens/verify`. Delete the token in the
  dashboard and the file when the migration is done. To make a new one, use
  this prefilled link, then set Zone Resources to the walnut.dev zone only:
  <https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22dns%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22ssl_and_certificates%22%2C%22type%22%3A%22edit%22%7D%5D&accountId=bc9b33d0085cd132a6a2f6b86235245f&zoneId=all&name=miden%20playground%20SaaS%20hostname>
- `!` shell commands get no interactive input (`read -s` fails at EOF). To save a
  token without pasting it into the chat:
  `! pbpaste | tr -d '[:space:]' > ~/.cf-saas-token && chmod 600 ~/.cf-saas-token`.

## Message to Miden (draft, fill in the TXT values)

> Hi! We're moving playground.miden.xyz off the Vercel proxy and serving it
> straight from our Cloudflare Worker, using Cloudflare for SaaS. This needs two
> steps on the `miden.xyz` zone:
>
> **Step 1 (now, no impact on traffic):** add these TXT records so the
> certificate can be issued ahead of time:
>
> ```
> TXT  _cf-custom-hostname.playground  <value>
> TXT  _acme-challenge.playground  <value>
> ```
>
> **Step 2 (when we confirm the certificate is active):** replace the current
> `playground` CNAME (`…vercel-dns-016.com`) with this record, **DNS only
> (grey cloud)**:
>
> ```
> CNAME  playground  saas-fallback.walnut.dev
> ```
>
> The switch should cause no downtime. We'll keep the Vercel proxy running
> until DNS has propagated and remove it after that. You can take the hostname
> back at any time by removing the CNAME. Thanks!
