# Share and fork scripts

Status: written 2026-11-19 at `7127b64` as a design plan. Decisions 1 to 4
were made on 2026-11-23 and are recorded in their sections; the checks were
run and PR 1 to 3 implemented and shipped the same day (#867; "What was
built" at the end says where it differs from the plan below). PR 4 is
implemented too, in its own PR. It replaces the
deferred `plans/006-script-write-access.md` once accepted: 006 recorded the
problem and the maintainer's intent (an owner token, scripts tied to the
wallet address); this is the design that was missing.

## Why

Half of sharing exists, and the half that exists is unsafe.

- `/scripts/:id` opens any script: `apps/web/hooks/use-script.ts` reads it
  from the local state, "or fetched from the API when it isn't there (another
  user's, a shared link)".
- The API has no owner. `PATCH /scripts/:id` recompiles and overwrites the
  stored files and `DELETE /scripts/:id` deletes them, for anyone who has the
  id (`apps/api/routes/scripts.ts`). The `packages` table has a `read_only`
  column that no route checks (`apps/api/db/schema.ts`). So a link shared
  today hands out write access, and verification by package id
  (`apps/api/routes/verified.ts`) submits whatever the files are at that
  moment.
- The app has no Share action and no way to keep a copy of someone else's
  script. A visitor's edits to a script that isn't in their state go nowhere
  useful: the reducers ignore items that aren't in the state (plan 008).

The feature: a **Share** action that copies the script's link, a read-only
view for whoever opens it, and **Fork** to get an editable copy. The security
fix (only the owner writes) is the part that makes the link safe to hand out.

## What exists to build on

- `GET /scripts/:id` returns the whole package (files, exports, metadata,
  dependencies as ids).
- `GET /scripts/:id/export` zips the script with its dependencies, resolved
  deep (`getDependenciesDeep`, `apps/api/db/packages.ts`).
- `POST /scripts/import` creates new packages from sources and compiles them
  (`importScriptsFromPackageSources`, `apps/api/lib/import.ts`): the Import
  project dialog uses it. A fork is close to "export, then import".
- The script page already has a read-only mode: `script.readOnly` hides
  Compile, makes the editor read-only and keeps Simulate when the script holds
  a package (`apps/web/components/script/script.tsx:171-173`, `:319`, `:382`).
  Built-in and verified scripts use it.
- The web app dispatches `IMPORT_SCRIPTS` to add compiled packages to the
  state (`apps/web/hooks/use-scripts.ts`, `importScriptsFromPackageSources`).
- Migrations: every schema change ships with one, additive first, drops in a
  second release (`docs/claude/database-migrations.md`). The API and the web
  app deploy separately, and old web bundles keep running in open tabs.

## Decision 1: what proves ownership

Plan 006 says "scripts tied to the user's wallet address". Three options:

- **A. Wallet signature.** The owner is an account id; a write carries a
  signature the API verifies. Fits the stated intent and follows the user
  across browsers. But most script work happens with no wallet connected:
  tutorials 6, 7, 10 and 12 have `requiresWallet: false`
  (`apps/web/components/tutorials/meta.ts`), sandboxes offer Bread only, and
  the API would need Falcon/ECDSA verification and a challenge scheme. A
  signature prompt on every compile is not acceptable, so it also needs a
  session token: this is the largest option.
- **B. A local secret.** The browser generates a random token once
  (`crypto.randomUUID()` twice, or 32 random bytes), keeps it in
  `localStorage`, and sends it as `Authorization: Bearer <token>` (the header
  is already allowed by the API's CORS, `apps/api/index.ts`). The API stores
  a SHA-256 of it on the package at creation and compares on write. No
  wallet, no prompt, a few lines on each side. Cleared site data loses
  ownership: the user forks their own script, which is cheap.
- **C. B now, A later.** B's column is "owner key hash"; a later release lets
  a connected wallet claim the scripts of the local token, so they follow the
  user. Nothing in B has to be undone.

**Decided 2026-11-23: C**, building only B now. It closes the hole and keeps
the wallet intent reachable. The later wallet link is optional and costs one
signature, once, to recover ownership in another browser; a signature prompt
before saving a script is ruled out.

Rejected: using the connected wallet's address as the token. An address is
public, and the comparison with the connected wallet happens in the browser,
so the API can't tell the caller from anyone who sends the same header. It
would also require a wallet where none exists today (tutorials 6, 7, 10 and
12, the MockChain sandbox) and split ownership across Bread testnet, Bread
mainnet and Para addresses.

## Decision 2: scripts that have no owner today

Every existing row, and every row created by a web bundle that predates the
change.

- **Claim on first write** (recommended): a write with a token to a package
  whose owner is null sets the owner. Existing users claim their scripts the
  next time they compile. Someone holding a link could claim first: the same
  exposure as today, once, instead of forever.
- **Stay open**: ownerless packages remain writable by anyone. Simple, but the
  hole stays for everything already shared.
- **Freeze**: ownerless packages become read-only. Safe, but every existing
  user must fork all their scripts, and saved projects and tutorial runs
  reference script ids (`docs/claude/saved-projects.md`).

A write **without** a token to an ownerless package must keep working until
old web bundles are gone (one release), then be refused.

**Decided 2026-11-23: claim on first write**, as is. Claiming every local
script when the new bundle first loads was offered and declined: the window
it closes doesn't justify another route.

## Decision 3: what a fork copies

A script's dependencies are other packages' ids, owned by the same author and
still editable by them.

- **Deep copy** (recommended): the fork gets its own copies of every
  dependency that isn't a built-in, so it keeps compiling whatever the author
  does next. It is what export-then-import does today.
- **By reference**: cheaper, but the fork's next compile picks up the author's
  later edits, or breaks when they delete.

And for the shared view itself: a shared script's dependencies must be
readable too (they are, `GET /scripts/:id`), which means sharing one script
shares its dependencies' sources. Say so in the Share dialog.

**Decided 2026-11-23: deep copy.**

## Decision 4: delete

Deleting a script that others forked is harmless with deep copies. Deleting
one that others have open is a 404 for them, as today. Deleting a dependency
of your own other scripts is already possible today.

**Decided 2026-11-23: no change.**

## Shape, following the decisions above

### PR 1: owners in the API (no visible change)

- `packages.owner_key_hash`: nullable `varchar(64)`. Migration generated with
  `pnpm db:generate --name add_package_owner_key_hash` in `apps/api`.
- Web: `apps/web/lib/owner-token.ts` (create on first use, `localStorage`,
  SDK-free), sent by every call in `apps/web/lib/api.ts` that creates or
  changes a package: create, compile, delete, import, example import. One key
  for the browser, not per workspace or per saved project: projects and
  tutorial runs share scripts by id.
- API: `POST /scripts`, `/scripts/import`, `/scripts/examples/:exampleId`
  store the hash when a token is sent. `PATCH` and `DELETE` on a package with
  an owner require the matching token: **403** otherwise. On an ownerless
  package: with a token, claim it; without, allow (this release only).
  Compare hashes in constant time. `GET` stays public and never returns the
  hash; it returns `writable: boolean` for the caller's token instead (false
  only for another owner's package: an ownerless one is writable, since a
  write would claim it).
- `plans/006-script-write-access.md` lists the routes and the tests it
  wanted; reuse its test list.
- Unit tests in `apps/api` for the decision function (owner/no owner ×
  token/no token/wrong token), which is pure; `apps/api` has no route-level
  tests (`plans/README.md`, "considered and rejected").
- The embedded and example packages (`read_only`, built-ins) are not created
  through these routes: confirm they can't be claimed.

### PR 2: the shared view and Fork

- `use-script.ts`: a script fetched from the API that the caller doesn't own
  is shown with `readOnly: true`, so the page's existing read-only mode
  applies. A banner above the editor: "You're viewing a shared script." with
  a **Fork** button.
- `POST /scripts/:id/fork`: server-side deep copy (`getDependenciesDeep`,
  then the same creation path as import, reusing the stored compiled outputs
  rather than recompiling when the sources are unchanged). Returns the new
  packages; the web dispatches `IMPORT_SCRIPTS` and navigates to the copy.
  Rate-limited like the other writes.
- A script the caller owns but that isn't in the current workspace (opened
  from a link in another sandbox). **Decided 2026-11-23: no "Add to this
  sandbox"**: it gets the shared view and Fork like any other, at the cost of
  a duplicate. Add the button later if someone asks.
- Tutorials: a fork inside a tutorial would add scripts the steps don't
  expect. **Decided 2026-11-23: no Fork while a tutorial is active**, the
  banner says to leave the tutorial first.

### PR 3: Share

- A **Share** item where "Export script" is offered
  (`apps/web/components/scripts/columns.tsx`) and in the script page's
  header: copies `https://<host>/scripts/<id>` and toasts. First use shows
  what a link gives: read access to this script and its dependencies, at
  their current and future contents, until the script is deleted.
- Drafts: the link shows what the API last stored, which is the last compile,
  not the editor's unsaved text. Say it in the toast when the script is a
  draft ("Compile to share your latest changes.").
- Tutorial copy: grep `apps/web/components/tutorials` for the menu's items
  after adding one.

### PR 4 (next release): refuse tokenless writes

Once the web bundle that sends the token has been live for a release, writes
without a token are refused, including on ownerless packages.

Implemented on 2026-11-23, the day PR 1 to 3 shipped (#867): every route that
creates or changes a package answers a request without a token with a 401
("This page is out of date. Reload it, then try again."), which is what a
tab still running a bundle from before #867 gets. `GET` and the export stay
public. What it buys is that no new package is created without an owner; an
ownerless package from before #867 can still be claimed by whoever writes to
it first with a token (Decision 2). Merge it once tabs opened before #867
are unlikely to be around.

## Things to verify before estimating

Checked on 2026-11-23; the answers are under each item's number in "What was
built".

1. Whether the script page really lets a visitor trigger `PATCH` on a script
   that isn't in their state today (plan 006 said the Compile button shows;
   it was written at `301e950`, before plans 008 and 009 changed the
   reducers). This sets how urgent PR 1 is.
2. What `POST /verified-account-components/:network` accepts by package id,
   and whether verification should require ownership too.
3. Whether tutorials' starter scripts (`Tutorial.starter`) and examples are
   created per user (then they are claimed like any other) or shared rows
   (then they must be read-only server-side).
4. The rate limiter never refuses in production (plan 027's outcome), so Fork
   is an unauthenticated write amplifier: a deep copy of a large dependency
   tree per request. Bound the tree size (plan 013's limits) before shipping
   PR 2.
5. Saved projects restore scripts by id. A project saved before PR 1 and
   opened in another browser would hold scripts that browser doesn't own:
   read-only, with Fork. Check that this reads acceptably, or carry the
   token inside the project export (it is a secret: probably not).

## Out of scope

- Wallet-bound ownership (option A's signature scheme), accounts, profiles,
  a public gallery or listing of shared scripts.
- Immutable snapshots (a link pinned to one version). Worth considering if
  verification by package id needs it.
- Collaboration, comments, version history.

## Sizing (coarse)

PR 1: M, API and web, one migration, needs the deploy order "api first".
PR 2: M. PR 3: S. PR 4: S. A wallet-signature design instead of PR 1: L.

## What was built (2026-11-23)

The checks:

1. Yes, a visitor could overwrite a shared script. A script fetched from the
   API came with the row's `read_only` (false), so the page showed Compile,
   and `compileScript` sent the `PATCH` whatever the local state held; only
   the result was dropped (`SCRIPT_COMPILED` ignores a script that isn't in
   the state). Deleting needed a direct request.
2. Verification by package id reads the stored files and asks the registry to
   compare them with an account or a note on chain. It changes nothing and
   reveals nothing the public `GET` doesn't, so it needs no ownership. What
   mattered was that the files under an id can't be swapped by a stranger
   anymore.
3. Examples and tutorial starters are created per user
   (`POST /scripts/examples/:exampleId` inserts new rows on each call), so
   they get the caller's owner like any script. The built-ins and the
   packages embedded for the tutorials aren't rows (their ids aren't UUIDs),
   and no route sets `read_only`: nothing shared can be claimed.
4. A fork is bounded to `MAX_PACKAGES` (16) packages, the script included,
   and refused beyond (400). It compiles nothing.
5. Saved projects live in the browser that saved them, with the token: there
   is no project export yet (`spec/project-export.md`). If one ships, its
   scripts will open as shared in another browser, with Fork. The same
   happens after clearing the site's data when a state survives it: a script
   in the local state that the API says isn't writable shows read-only with
   the banner, and deleting it only removes it from the workspace.

Where the code differs from the plan above:

- `GET /scripts/:id` returns `writable`, not `owned` (see PR 1), and its
  `dependencies` as `{ id, name, type, commitment }` objects, as the web's
  `Script` type always expected: it returned bare ids, so a shared script's
  dependencies table was empty of names.
- A fork copies the stored rows (sources, compiled outputs, status) under new
  ids and points the copies at each other: it doesn't go through the import
  path and never compiles. A dependency that was deleted is dropped from the
  copy. `POST /scripts/:id/fork` answers `{ package: { id }, packages }`.
- A malformed `Authorization` header is a 400, not a tokenless request.
- Share has no first-use dialog: every "Link copied." toast says what the
  link gives, plus the draft sentence when the script is a draft.
- Share is offered for the API's scripts (UUID ids), on the script page (an
  icon button before the editor settings, on shared scripts too) and in the
  scripts table's menu.
- No analytics events for Share and Fork yet: the allowlist
  (`apps/web/lib/analytics-events.ts`) is append-only, so they deserve their
  own decision.
- `apps/api/scripts/check-templates.ts` sends a token of its own for the run,
  and so does `compile-examples.ts` since PR 4.

Code: `apps/api/lib/owner.ts` (the token, its hash, the decision function)
and `lib/fork.ts`, both unit-tested; `apps/web/lib/owner-token.ts`,
`hooks/use-script.ts` (`shared`), `components/script/shared-script-banner.tsx`
and `share-script-button.tsx`, `lib/utils/share-script.ts`;
`e2e/share-and-fork.spec.ts`.

Deploy: the API first (its deploy runs the migration). A web bundle ahead of
the API only loses Fork (404, with a toast) until the API is live.
