# Project links

Status: written 2026-11-23 at `6081a7d` as a design plan; decisions 1 to 5
taken the same day, each as recommended. Being implemented as four PRs (see
"Shape"): PR 1 (#870) shipped. It
follows `spec/share-and-fork-scripts.md` (shipped as #867 and #868) and
replaces the project parts of `spec/account-files.md` (its PRs 3 and 4) for
the sharing use case.

## Why

The use case: someone writes a Miden project locally, often with a coding
agent and `cargo-miden`, and wants one link that shows it working in the
playground. The reader opens the link and gets the scripts and the deployed
accounts, ready to call.

Most of the parts exist. What is missing is the link for the whole.

- A script has a link (`/scripts/:id`, Share and Fork), and a fork brings its
  dependencies. But a project is several top-level scripts (an account
  component, a note, a transaction script), so today it is several links.
- An account has no link. The reader pastes its address into "Import
  account", after having forked the scripts, or the account's page doesn't
  list its components as theirs.
- The network isn't carried by anything: the reader has to be told.
- A local project gets in through "Import Project", a browser folder picker.
  An agent in a terminal can't drive it.

## What exists to build on

- `POST /scripts/import` creates and compiles a folder's packages, owned by
  the caller's token (`apps/api/lib/import.ts`). The folder rule is
  `findPackages` (`apps/web/lib/utils/project-files.ts`): each directory
  with a `miden-project.toml` and a `src/lib.rs`.
- The owner token accepts tooling: any URL-safe secret of 32 to 128
  characters (`apps/api/lib/owner.ts`).
- `POST /scripts/:id/fork` copies a script and its dependencies under new
  ids, with their compiled outputs, without compiling (`apps/api/lib/fork.ts`,
  bounded to `MAX_PACKAGES`, 16).
- `importAccountByAddress` (`apps/web/hooks/use-accounts.ts`) imports a
  public account and lists the workspace's compiled components whose
  procedures its code holds (`verifyAccountComponents`,
  `apps/web/lib/web-client.ts`). The match is by procedure digest, so a
  forked copy matches like the original.
- Launching an example is the same shape as opening a project: confirm the
  workspace switch, fetch scripts, switch network, push a new state, then do
  the on-chain part once the new client is ready (`hooks/use-examples.ts`,
  the deploy started from `components/lib/network-badge.tsx`).

## What the 2026-11-23 check found

One run against production, with the counter script exported earlier that
day (`counter-account`, one package):

| Step                                                            | Result                                    |
| --------------------------------------------------------------- | ----------------------------------------- |
| `POST /scripts/import` from Node, with a token made on the spot | 200 in 5.2 s, package `compiled`          |
| `GET /scripts/:id` with that token, then without                | `writable: true`, then `false`            |
| `DELETE /scripts/:id` with that token                           | 200, then `GET` answers 404               |
| The API's `masp` against the local `cargo miden build` one      | Same size (14 908 bytes), different bytes |

So the terminal path works today with no API change. The last row matters
for accounts deployed outside the playground: see decision 5.

Not checked: a folder of several packages from the terminal, the rate limit
(30 requests a minute per address; one import is one request), anything in
the browser.

## Decision 1: where the project's description lives

Decided: A, the URL fragment, with `v=1`.

A project link has to name the network, the scripts and the accounts.

- **A. In the URL** (recommended). `/open#v=1&n=mtst&t=<title>&s=<id>,<id>&a=<name>:<address>,…`.
  No table, no migration, no new write route, nothing to own or delete, and
  the terminal script prints it without another call. It sits in the
  fragment, so it never reaches the Worker or the analytics. Cost: a long
  link (about 40 characters per script and per account), and it can't be
  changed once shared: sharing again gives another link.
- **B. A stored row.** A `projects` table (name, network, script ids,
  accounts, owner hash) behind `/p/:id`. Short link, editable by its owner,
  room for a description. Cost: a migration, four routes, ownership rules,
  and rows nobody deletes.

A first, with `v=1` so a stored form can be added later without breaking
old links.

The scripts behind either link stay their owner's: the link shows their
later changes, until they are deleted, exactly as a script link does.

## Decision 2: what opening a link does

Decided: A, a new sandbox with the reader's own copies.

- **A. A new sandbox with the reader's own copies** (recommended). The page
  shows what the link holds and asks before replacing the workspace. On
  confirm: fork every script in one request, switch to the link's network,
  start a fresh sandbox with the copies, then import the accounts by
  address. The reader can call, edit and compile at once, and the accounts
  list the copies as their components.
- **B. A read-only view.** Scripts stay the author's and show as shared.
  Nothing is copied, but shared scripts aren't in the workspace, so imported
  accounts can't list them as components and Invoke has nothing to offer.
  Rejected for that reason.

A needs one API change. Forking the scripts one by one duplicates a
dependency two of them share (the bank example's notes all depend on
`bank-account`), and the copies of the notes would point at different
copies of the account. So: `POST /scripts/fork` with `{ ids }`, one deep
copy of the union, bounded to `MAX_PACKAGES`.

What the page must handle:

- The title and the account names come from the link: untrusted text, shown
  as text, bounded in length. Script names come from the API.
- A script that was deleted: listed as missing, the rest opens. No script
  left: nothing to open.
- An account that can't be imported (not on chain, a network reset since):
  a toast with Retry, as for an example's failed deploy. The others import.
- Opening imports public state only. Nothing is signed or sent.
- During a tutorial: the workspace switch saves the tutorial run, as for
  "Launch example".
- The result is an unsaved sandbox; "Save" works on it as on any other.

## Decision 3: which accounts a link made in the playground carries

Decided: as below, accounts ticked by default with a checkbox each.

"Share project" builds the link from the open workspace.

- Scripts: every script the API holds (UUID ids), drafts included with the
  share toast's existing warning. Built-ins are not listed: every browser
  has them.
- Accounts: the public ones that are on chain, ticked by default, each with
  a checkbox (recommended). Private accounts show disabled, with the reason:
  only the address would travel, and the reader's client can't fetch their
  state. The connected wallet is unticked by default.
- Networks: testnet, devnet and Mainnet. Not the MockChain sandbox: its
  chain lives in one browser.
- No keys, no account files, no notes.

## Decision 4: the terminal path

Decided: A, a single-file script, with its documentation page.

What an agent runs to turn a folder into a link.

- **A. A single-file script in this repository** (recommended), with no
  dependency, for Node 22 and later:
  `node share-project.mjs <folder> [--network mtst] [--title …] [--account <name>=<address>]…`.
  It finds the packages, posts them, and prints the link. A package that
  fails to compile prints the compiler's error and exits 1, which also
  makes it a remote build check for the agent.
- **B. An npm package** (`npx … share <folder>`). Easier to find and to
  run from another repository. More to maintain and to version with the API.
- **C. Documentation only**: the request body and the link format, and
  agents write their own call.

A, with C's documentation next to it, and B if people use it.

Details for A:

- The token is generated on first run and kept in the user's config
  directory, mode 600, so the scripts keep one owner across runs.
- The folder rule is a copy of `findPackages`. A unit test runs both on the
  same fixtures.
- Each run creates new packages and a new link. Updating the packages of an
  earlier run is a follow-up.
- Limits to print clearly when hit: 16 packages, 512 KB per source, 2 MB
  per request.

The shortest full path for an agent needs no account handling at all:
upload the scripts, open the link, deploy in the playground, then "Share
project" for the link that includes the accounts.

## Decision 5: accounts deployed outside the playground

Decided: compare the digests before PR 3; `--account` ships only if they
agree.

`--account` lets the terminal script add accounts the agent deployed itself.
Two things decide whether the reader sees them as built from the scripts:

- The playground matches components by procedure digest. The API's build
  and a local build of the same source gave different package bytes in the
  check above. Whether the digests still agree was not compared. One data
  point says they can: a local build's `get_count` ran against an account
  deployed from the API's build earlier the same day.
- Registry verification is separate and by package id. An account deployed
  from the playground is verified on deploy; one deployed elsewhere isn't
  until someone presses Verify.

Recommended: ship `--account` only after comparing the digests of both
builds for the counter and the bank example. If they differ, the script
says so and the documented path is "deploy in the playground".

## Shape, following the recommendations

### PR 1: fork several scripts at once (API)

- `POST /scripts/fork`, body `{ ids: string[] }` (1 to 16 UUIDs, duplicates
  merged): `getPackageForest` and `forkPackageForest` take several roots;
  the answer is `{ roots: { id, forkedId }[], packages }`, `forkedId` null
  for a root that doesn't exist (404 when none does). Web: `forkScripts` in
  `lib/api.ts`. `POST /scripts/:id/fork` stays, on the same code.
- Unit tests in `apps/api/lib/fork.test.ts`: a shared dependency is copied
  once, the bound counts the union.
- Deploy the API first.

### PR 2: open a link (web)

Shipped as built here: the link's accounts wait in `State.projectLinkAccounts`
(persisted) and are imported by `useImportProjectLinkAccounts`, which
`NetworkBadge` calls. The new sandbox holds the copies only, not a Mainnet
sandbox's starter scripts.

- `apps/web/lib/utils/project-link.ts`: build and parse the fragment, pure,
  unit-tested (bounds, bad ids, addresses of another network, unknown
  version).
- A `/open` route under the sidebar layout: the summary and its
  confirmation, then the flow of decision 2. The pending accounts go in the
  state, as `exampleId` does for an example's deploy, and are imported once
  the client is ready on the new network.
- Analytics: `open_project_link` with the network, the counts and the
  outcome. No id, name or address (`apps/web/lib/analytics-events.ts`,
  append only).
- Phone layout: run the `e2e/mobile` projects, down to 320 px.

### PR 3: the terminal script

- `scripts/share-project.mjs` and a short page of documentation: the
  command, the import request, the link format, the limits.
- Needs PR 1 and PR 2 only, so it can ship before PR 4.

### PR 4: Share project (web)

As built: "Share project…" sits with Save, Save as and Delete (sandboxes and
examples), disabled on MockChain. Its dialog (`share-project-dialog.tsx`,
rendered by `AppSidebar` like the Save dialog) edits the title and ticks the
accounts as `shareableAccounts` (`lib/utils/project-link.ts`) offers them;
the network's faucet isn't listed. Checkboxes are shadcn's stock `checkbox`.

- "Share project" in the Projects submenu, for sandboxes and examples, not
  tutorials: a dialog with the accounts' checkboxes (decision 3) and a copy
  button. The toast repeats what a script link's toast says.
- Analytics: `share_project` with the network and the counts.
- Grep `apps/web/components/tutorials` after adding the menu item.

## Tests

- Unit: the link format, the multi-root fork, the script's folder rule.
- `e2e/project-link.spec.ts`: launch the counter example, share the
  project, open the link in a second browser context, see the counter
  account with its component, increment it.
- The terminal script against a local API: a one-package and a
  several-package folder, a compile error, the printed link opened in the
  e2e above.
- Against production after deploy, since the example specs need the API.

## Out of scope

- Account files, private accounts, keys, notes (`spec/account-files.md`).
- Stored, short or editable links (decision 1, option B).
- Updating an uploaded project in place from the terminal.
- A gallery or listing of shared projects.

## Sizing (coarse)

PR 1: S. PR 2: M. PR 3: S. PR 4: S to M. The digest comparison of decision
5: an hour, before PR 3.
