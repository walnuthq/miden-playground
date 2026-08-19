# status-page

Public status page for the two deployed services — `web` and `api`. Published to
GitHub Pages at **https://walnuthq.github.io/miden-playground/**.

## How it works

Two phases, both at build time:

1. `scripts/probe.ts` runs every check and writes the results to
   `public/status.json`.
2. Vite builds the React app, copying that snapshot into `dist/` alongside
   `index.html`. The page fetches it at runtime (same-origin, no CORS).

Probing happens on the CI runner rather than in the browser: the web app sends no
CORS headers, and a client-side check would be measuring the viewer's network
rather than the services.

## The checks

| Service | Check                | Asserts                                                                                |
| ------- | -------------------- | -------------------------------------------------------------------------------------- |
| web     | `page loads`         | a document titled "Miden Playground" comes back                                        |
| web     | `playground renders` | hydrated sidebar navigation **and** the home page's `Tutorials` heading are in the DOM |
| web     | `no client errors`   | no uncaught exceptions, no failed same-origin requests                                 |
| api     | `GET /`              | 200 + JSON — the card shows the payload in full                                        |

### Why the web checks need a browser

`playground.miden.xyz` runs behind **Vercel's Attack Challenge Mode**. Every
plain HTTP request — `/` and the `/api/*` routes alike — is answered with
`HTTP 429` and a `Vercel Security Checkpoint` JS challenge:

```
$ curl -sI https://playground.miden.xyz/
HTTP/2 429
server: Vercel
x-vercel-mitigated: challenge
```

Only a real browser gets through, so a `fetch`-based check would be permanently
red. Headless Chromium solves the challenge and reloads in about a second; the
probe therefore reports the status of the **last** main-frame document response,
not the first one, and calls the challenge out by name if it never clears.

`playground renders` is the check that actually matters. Its two selectors sit
behind `useIsClient()` in `apps/web/components/lib/app-sidebar.tsx`, which is
false during SSR _and_ on the first client render, and below `MidenProvider`
(`apps/web/components/providers/miden-provider.tsx`), which shows a loading state
until the WASM client is ready. One selector therefore proves the bundle
downloaded, executed, hydrated and painted. It does **not** wait for the testnet
sync badge, so a Miden testnet outage will not turn the card red.

Two details that are easy to get wrong and hard to debug:

- **The viewport must be desktop-sized.** At Chrome's default 800×600
  `useIsMobile` swaps the sidebar for a closed `Sheet` and the nav links are
  absent from the DOM entirely.
- **Aborted requests and the analytics proxy are ignored** by the third check.
  Aborts are routine (React cleanup, the Miden client tearing down streams) and
  `/proxy.js` is a third party behind a same-origin path.

### When the challenge wins: `blocked`, not `unhealthy`

Attack Mode was on when this page first shipped, and it produced a false outage.
The same probe, same Playwright build, same browser binary:

| From                               | Result                                   |
| ---------------------------------- | ---------------------------------------- |
| A laptop on a residential IP       | clears the challenge in ~1.8s, 3/3 green |
| A GitHub Actions runner (Azure IP) | never clears it, times out at 30s        |

Only the network differed, so this is **IP reputation, not browser
fingerprinting** — and Vercel documents it: _"non-recognized automated services
may not be able to pass challenges and could be blocked."_ Chasing it with
stealth flags or a spoofed user agent would be an arms race the probe loses
silently.

So a challenge is reported as its own outcome, `blocked`, which propagates to the
whole service. The probe cannot distinguish "the site is down" from "we were
turned away at the door", and claiming the former costs the page its credibility
— and pages someone at 3am for a firewall setting. When the load is blocked,
`playground renders` and `no client errors` are marked blocked too: the SPA never
got a chance to render, and "no uncaught exceptions" would only be saying the
challenge page itself did not throw.

Detection prefers the `x-vercel-mitigated: challenge` response header over
sniffing the page title. Note that this header appears on the _first_ response
even in the success case, so it only means "blocked" when the load also never
completed.

`blocked` is colourless in the UI and grey in Slack, and its message says
outright that it is not a confirmed outage. If you ever need the probe let
through with Attack Mode on, add a Vercel WAF Custom Rule matching a secret
header with the **Bypass** action — `vercel.json` route rules cannot express
`bypass`, so it has to be created in the dashboard.

**A failing check never fails the build.** Every check is caught individually and
the script always exits 0. A service is green when all its checks pass, amber
("degraded") when only some do, red when none do — the page can load while the
SPA fails to render, and that must not read the same as the service being down.
A fourth state, grey ("unknown"), means the probe was [blocked before it could
measure](#when-the-challenge-wins-blocked-not-unhealthy) and outranks the other
three, since none of them measured anything.

## Configuration

| Variable            | Default                   | Used by                        |
| ------------------- | ------------------------- | ------------------------------ |
| `WEB_URL`           | `http://localhost:3000`   | probe                          |
| `API_URL`           | `http://localhost:3001`   | probe                          |
| `STATUS_PAGE_URL`   | derived from the repo     | probe (previous state), notify |
| `SLACK_WEBHOOK_URL` | unset — notify is a no-op | notify                         |
| `STATUS_PAGE_BASE`  | `/miden-playground/`      | Vite's `base`                  |

In CI `WEB_URL` and `API_URL` come from **repository variables of the same
name**, and both are required: an undefined variable reaches the build as an
empty string, the probe falls back to the localhost defaults above, and the
published page is a wall of connection failures. `SLACK_WEBHOOK_URL` is a
**secret**, not a variable. Locally, copy `.env.example` to `.env`.

## Slack notifications

`scripts/notify.ts` posts to a Slack channel when a service's health changes.

**The design goal is silence.** The probe runs every 30 minutes, so a naive
implementation would post 48 identical "web is down" messages a day and the
channel would be muted within a week. It therefore speaks only on a transition,
plus a reminder every 6 hours while an outage continues:

| Previous               | Current             | Message                                               |
| ---------------------- | ------------------- | ----------------------------------------------------- |
| none                   | not healthy         | 🔴/🟡 the current state — new to the channel          |
| healthy                | degraded/unhealthy  | 🟡 `web` is degraded / 🔴 `web` is down               |
| degraded ↔ unhealthy   | changed             | the new state, so escalations are visible             |
| not healthy            | healthy             | ✅ `web` recovered — after 1h 30m down                |
| healthy                | blocked             | 🚧 `web` is unmeasurable — explicitly _not_ an outage |
| blocked                | healthy             | ✅ `web` is measurable again                          |
| unchanged, not healthy | 6h boundary crossed | 🔴 `web` is still down (6h)                           |
| anything else          |                     | **silence**                                           |

`blocked` deliberately keeps the same transition and reminder cadence as the
other states — a monitor that has been blind for six hours is worth saying out
loud — but it is grey, captioned "not a confirmed outage", and never uses the
word "down".

Each message leads with a link to the service that is down, lists the failing
checks with the probe's one-line diagnosis, and links to the status page and the
workflow run. Two services failing together produce one message with two
coloured attachments, so it is a single ping.

### How it remembers, without a state store

`notify.ts` writes nothing and keeps no database. Everything it needs is in the
snapshot, because `scripts/probe.ts` fetches the **previously published**
`status.json` from the Pages URL before writing the new one and carries three
fields forward:

```jsonc
{
  "checkedAt": "2026-08-10T12:00:00.000Z",
  "previousCheckedAt": "2026-08-10T11:30:00.000Z",
  "services": [
    { "health": "unhealthy", "previousHealth": "healthy", "since": "…" },
  ],
}
```

Reminders are then _derived_ rather than stored — a reminder is due when this
run is the first past a 6-hour multiple of `since`:

```ts
Math.floor((checkedAt - since) / SIX_HOURS) >
  Math.floor((previousCheckedAt - since) / SIX_HOURS);
```

That is worth the paragraph it takes to explain, because it means nothing can
desynchronise: a failed deploy or a lost snapshot cannot double-fire or silence
the cadence, since the next run recomputes it from the same two timestamps. A
delayed cron that skips eight hours produces one reminder, not sixteen.

`since` also feeds the page itself — a service that is not healthy shows "Down
since 10 Aug 2026, 09:12 UTC" rather than only the time of the last check.

### Setting it up

1. **Slack** — https://api.slack.com/apps → _Create New App_ → _From scratch_ →
   name it and pick the workspace → _Incoming Webhooks_ → toggle **On** → _Add
   New Webhook to Workspace_ → choose the channel → copy the
   `https://hooks.slack.com/services/…` URL. Some workspaces require an admin to
   approve the app.
2. **GitHub** — Settings → Secrets and variables → Actions → **Secrets** → new
   repository secret named `SLACK_WEBHOOK_URL`. A secret rather than a variable:
   anyone holding that URL can post to the channel, and secrets are masked in
   logs.

Without the secret the notify step logs `SLACK_WEBHOOK_URL is not set` and exits
0, so forks and local builds stay silent and nothing breaks.

### Testing it without an outage

`notify.ts` is a pure function of `public/status.json`, so every branch can be
driven from a hand-edited file:

```sh
# Print the payload instead of posting it
pnpm --filter status-page notify --dry-run

# Manufacture an outage, then see what would be posted
WEB_URL=http://localhost:9999 pnpm --filter status-page probe
pnpm --filter status-page notify --dry-run
```

Edit `health`, `previousHealth`, `since` and `previousCheckedAt` in
`public/status.json` to reach the recovery and reminder branches. To post for
real from your machine, put the webhook in `apps/status-page/.env` and drop
`--dry-run`.

### Limits

- **The memory is the last successful deploy.** If a deploy fails, the next run
  sees no previous state and may repeat an "is down" message. It can repeat
  itself, never miss an outage.
- **One channel**, fixed when the webhook is created. Per-service routing would
  need a bot token instead.
- **No threading or editing** for the same reason: recovery is a new message,
  not a reply under the outage. Moving to a bot token later is additive — store
  the message `ts` in the snapshot the same way `since` is stored.
- **A 30-minute floor on detection.** An outage that starts and ends between two
  probes is never seen.

## Build & preview

The probe drives a real browser, and Playwright is deliberately kept out of
`allowBuilds` in `pnpm-workspace.yaml` so that `pnpm install` never downloads a
~150 MB Chromium for the whole team. Install it once, here:

```sh
pnpm --filter status-page exec playwright install chromium
```

```sh
# Probe, typecheck, build into dist/
pnpm --filter status-page build

# Probe against production and preview from the root path
WEB_URL=https://playground.miden.xyz \
API_URL=https://miden-playground-api.walnut.dev \
STATUS_PAGE_BASE=/ \
  pnpm --filter status-page build

pnpm --filter status-page preview
```

`status-page#build` is marked `"cache": false` in `turbo.json`: the probe has to
re-run on every build, and a cached build would republish a stale snapshot.

## Deployment

`.github/workflows/deploy-status-page.yml` builds this app and publishes it as
the repository's Pages site. That workflow is the only one allowed to deploy
Pages: a repository has exactly one Pages deployment, and a second workflow would
overwrite the first on every run.

It runs every 30 minutes on a cron, on the hour and the half hour, and can be
re-run on demand from **Actions → Deploy status page → Run workflow**.

### Configuring GitHub Pages

One-time repository setup, all under **Settings**:

1. **Pages → Build and deployment → Source: `GitHub Actions`.** Not "Deploy from
   a branch" — the workflow uploads an artifact, and under the branch source it
   would never appear.
2. **Environments → `github-pages`** — the deployment branch rule has to allow
   `main`, otherwise the deploy job waits for approval on its first run.
3. **Secrets and variables → Actions → Variables** — add `WEB_URL` =
   `https://playground.miden.xyz` and `API_URL` =
   `https://miden-playground-api.walnut.dev`. Use _Variables_, not _Secrets_:
   these URLs are public, and secrets would be masked in the logs. **Both are
   required** — without them the probe falls back to localhost and every check
   goes red.
4. **Actions → General** — Actions must be enabled. Workflow permissions can stay
   read-only, because the workflow declares its own `permissions:` block.
5. Tick **Enforce HTTPS** under Pages once the first deploy has succeeded.

The site lands at `https://<owner>.github.io/miden-playground/`, which is why
`base` is `/miden-playground/` — the path depends on the repository name, not the
owner, so a fork publishes correctly with no config change.

Scheduled runs only fire on the repository's **default branch**, GitHub
**disables schedules after 60 days of repository inactivity**, and cron times are
best effort — use the manual trigger when you need a refresh now.

To move the page to a custom domain later (say `status.playground.miden.xyz`):
set it under **Pages → Custom domain**, add a `public/CNAME` file, and set
`STATUS_PAGE_BASE=/` in the workflow's build step.

## UI

Everything visual comes from `packages/ui`, the same design system `web` uses.

### Theming

The page follows the reader's system preference and offers a light/dark/system
override from the header — unlike `web`, which pins itself to light with
`forcedTheme="light"`. `next-themes` owns the state (`attribute="class"`,
`defaultTheme="system"`), storing the choice under the `theme` key in
`localStorage`.

Two things are worth knowing before touching it:

- **The no-flash script lives in `index.html`, not in React.** `next-themes`
  renders an equivalent script, but it arrives through
  `dangerouslySetInnerHTML` and browsers never execute scripts inserted that
  way — in a client-rendered app it simply does not run, and a dark-mode reader
  gets a full flash of the light page. The inline script applies the class
  before first paint instead. Its storage key and values have to stay in step
  with the provider in `src/main.tsx`.
- **Error text uses `dark:text-destructive-foreground`.** In dark mode
  `--destructive` is a deep red intended for fills, so red-on-black check
  failures — the state the page exists to show — sit near the edge of legible.
  `--destructive-foreground` is the design system's brighter counterpart, and
  the two tokens are identical in light mode, so overriding costs nothing
  there. The destructive `Alert` needs the override twice, once for itself and
  once through `*:data-[slot=alert-description]`, because the variant colours
  its description with a child selector a plain class would lose to.

The mode toggle swaps its sun/moon icons with the `dark:` variant rather than
React state, so it is correct on the first paint and needs no mounted guard.
