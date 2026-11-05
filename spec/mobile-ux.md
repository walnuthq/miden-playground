# Mobile UX

Status: first pass shipped in PR #760 (merged and deployed 2026-11-05).
Left: four items, described in "Left out". The first two are the remaining
gains for a phone's first visit.

The playground was built for desktop. A pass at iPhone 14 size (390 px) on
2026-11-04 listed fixes, scored by priority and effort. This document records
what #760 implemented and what it left out, with the context needed to pick
the open items up again. The conventions the work set are in
`docs/claude/phone-layout.md`, `docs/claude/tutorial-copy.md` and
`docs/claude/script-editor.md`.

## Implemented in #760

Delegated proving was already in place everywhere it matters. The app client
(`MidenProvider`'s `prover`), the Para client and the multisig client prove
on the network's remote prover (testnet, devnet, mainnet). Only the Local
network proves in the browser.

| Item | What shipped |
|---|---|
| Sidebar | The phone sidebar (a sheet) closes after navigating. |
| Header | Fits down to 320 px: the GitHub button and the badge's block height hide, and the breadcrumb truncates first. |
| Tables | Secondary columns hide below `md` (CSS only), so row actions stay on screen. Nested tables (account components) go under their label. Below `sm`, account names wrap and IDs give way, and the digest's copy button hides. |
| Script editor | A files menu replaces the file tree. The console starts collapsed, and the minimap is off by default. The tabs row wraps under ~380 px. |
| Tutorial panel | A bottom panel instead of a full-screen takeover. It reopens by itself when a step's action is done, and toasts move to the top. |
| App shell | While the Miden client (then Para) initializes, the real layout renders from the app state with actions disabled, instead of a blank loader. Built from view/container splits of the real components. See the caveat in "Left out". |
| Background sync | Auto-sync and the app's own sync pause while the tab is hidden. That's 0 requests a minute instead of ~92 to the node and the note transport. |
| Phone e2e | `e2e/mobile` runs in `mobile-safari` (iPhone 14, WebKit), `mobile-chrome` (Pixel 7) and `mobile-small` (Galaxy S9+, 320 px). The specs found and fixed: a transaction preview's Submit pushed off-screen, icon buttons without an accessible name, and three 320 px overflows. |
| Read-only editor on phones | Monaco is read-only below 768 px. Tutorials 7, 8 and 12, the only steps that ask for typed code, have "Add to my script" buttons that insert it. Desktop users can type or use them. |
| Tutorial copy | One wording for both layouts. Icon-only buttons are named with their icon (`ButtonName`), with no sidebar references; "click" stays. |

## Left out

### 1. App shell before the WASM loads (first visits)

The shell only paints once the client WASM is downloaded. Measured on
production after the deploy, on three fresh visits: DOMContentLoaded comes at
~1.6 s and the shell at 3.0–6.6 s, right after the WASM, then the app ~1.5 s
later. On a reload, with the WASM cached, the shell paints at ~0.6 s. The
SDK's eager entry (`@miden-sdk/miden-sdk`, which `@miden-sdk/react` uses) awaits
the WASM when its module loads, so no app module, the shell included, runs
before it. Local measurements hid this: localhost serves the 21 MB WASM almost
instantly.

To revisit:
- **A first entry that imports nothing from `@miden-sdk`.** It would paint a
  static shell at once, then load the app (`import()`), which pulls in the SDK
  and the WASM. The shell's views (`AppSidebarView`, `HeaderView`, the home
  cards' `*View`) are SDK-free but import from modules that aren't. The static
  shell needs SDK-free modules, or a copy kept in step.
- **The `/lazy` entry is not the answer.** It's the entry that defers the
  WASM, but CLAUDE.md forbids it: two entries mean two WASM instances
  (`WASM_CLASS_MISMATCH`).
- **Measure on production** (a fresh browser context per visit), not localhost.

### 2. Precompressed WASM

The client WASM is 21.6 MB raw. Cloudflare compresses it on the fly to 5.8 MB
of brotli; at brotli level 11 it would be 4.0 MB (−32%). On a phone's first
visit that download is the largest part of the wait (see item 1). Workers
static assets don't serve prebuilt `.br` files, so this needs Worker code
(`apps/web/worker`). For the matching request, it would return the
precompressed file with `Content-Encoding: br`, an immutable cache header and
the WASM content type. It must also not break the SDK's streaming compile.

### 3. Para in parallel with the Miden client

Para's provider is mounted inside `MidenProvider`. As an ancestor it would
become the Miden client's external keystore. So Para starts initializing only
once the Miden client is ready, and the app becomes usable ~280 ms later
than it could. The shell now covers that wait: it's Para's `fallback`, which
fixed a flash. Para's provider accepts a prebuilt client, so creating it
early, outside `MidenProvider`, could overlap the two. But
`@miden-sdk/para-react`'s `ParaSignerProvider` builds the client config itself,
and its types don't allow passing one. That needs an override, or an SDK
option. Measure first how much of the ~280 ms a prebuilt client saves; some of
it is Para's mount-time work.

### 4. Faucet proof of work in Web Workers

Creating a wallet took ~28 s on a desktop CPU: the faucet's proof of work
(`lib/faucet-pow.ts`), a funding transaction, then waiting for the commit. The
proof of work runs on the main thread in ~30 ms batches, at ~1.4 M
attempts/s on desktop. A phone hashes several times slower, and the faucet
rejects a challenge 30 s after issuing it (the playground gives up on a
challenge after 20 s). Under load, a phone could fail to get funds. Splitting
the search across `navigator.hardwareConcurrency` workers would speed it up on
multi-core phones and keep the UI responsive. Not picked in the first pass.

### Dropped: submitting the previewed transaction

Each transaction runs the VM twice: once for the preview, then again on
Submit (`useTransaction().execute`). Measured on production, desktop: the
second execution costs 84–254 ms, about 5% of a ~3 s Submit. The rest is
network and remote proving. Scaled to a phone, that's roughly 0.3–1 s. Not
worth it: it needs a staleness check (the account's nonce) and a copy of the
WASM result (`applyTransaction` consumes it). Chrome can't throttle Web
Workers, so a real phone measurement would be the only reason to reopen it.

### Not done: touch editing

Editing code on a phone isn't supported, on purpose: the editor is read-only
below 768 px (see "Read-only editor on phones" above). Reconsider only if
tutorials start asking for free-form code.
