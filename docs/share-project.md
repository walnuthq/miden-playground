# Share a project from the terminal

`scripts/share-project.mjs` turns a local Miden project into one playground
link. Whoever opens the link gets their own copies of its scripts in a new
sandbox, and the accounts it names imported from the chain, ready to call. It
is meant for coding agents and `cargo-miden` users: one command, no browser.

It needs Node 22 or later and nothing else. From this repository:

```sh
node scripts/share-project.mjs <folder> [--network mtst] [--title "…"] \
  [--account "<name>=<address>"]…
```

The script copies to any other repository as it is.

- `<folder>` is one package or a folder of packages. A package is a directory
  with a `miden-project.toml` and a `src/lib.rs`, the same rule "Import
  Project" uses. `target/`, `node_modules/` and hidden directories are
  skipped. Packages depend on each other through `path = "../<directory>"`.
- `--network` is `mtst` (testnet, the default), `mdev` (devnet) or `mm`
  (Mainnet). The MockChain sandbox lives in one browser, so it can't be linked.
- `--title` is shown when the link is opened. It is at most 80 characters.
- `--account` names a public account deployed on that network. Repeat it for
  up to 16 accounts. Each name is at most 40 characters.

The script prints each script's page on stderr and the link on stdout. It
exits with one of these codes:

- 0: the link was printed.
- 1: a package doesn't compile (the compiler's error is printed) or the
  playground refused the upload. This makes the script a remote build check
  too.
- 2: the command or the folder is wrong.

## What it sends

It sends one `POST https://miden-playground-api.walnut.dev/scripts/import`,
the same request "Import Project" sends:

```json
{
  "packageSources": {
    "<folder>/<directory>": { "midenProjectToml": "…", "rust": "…" }
  }
}
```

The key is each package's directory from the folder's parent. The API
resolves `path = "../<directory>"` dependencies against its last segment.

The request carries an owner token, `Authorization: Bearer <token>`: a random
URL-safe secret generated on the first run. It is kept in
`$XDG_CONFIG_HOME/miden-playground/token` (or `~/.config/…`), mode 600, so
every script uploaded from this machine has one owner. Anyone can read and
fork the scripts through their link. Only the token can change or delete
them.

Every run creates new scripts and a new link. Updating an earlier upload in
place isn't supported yet.

Limits, which the script checks before sending:

- 16 packages per project.
- 512 KB per source and 16 KB per manifest.
- 2 MB per request.
- 30 requests a minute per address. One run is one request.

## The link

```text
https://playground.miden.xyz/open#v=1&n=mtst&t=<title>&s=<id>,<id>&a=<name>:<address>,…
```

- Everything is in the fragment, so it never reaches the server.
- Each item is `encodeURIComponent`'d.
- `s` lists the scripts' ids, and `a` lists the accounts.
- `v=1` names the format.

`apps/web/lib/utils/project-link.ts` builds and reads it. A link can't be
changed once shared: sharing again gives another link. The scripts behind it
stay their owner's, so the link shows their later changes until they're
deleted.

## Accounts deployed outside the playground

The playground lists a script as an account's component when the account's
code holds the script's procedures, matched by digest. A local `cargo miden
build` gives the same procedure digests as the playground's build when it uses
the same dependency versions. This was checked on 2026-11-23, with cargo-miden
0.11.0, for the counter and the bank example's packages. The package files
still differ in their bytes.

The `Cargo.lock` of a script exported from the playground (Export on the script
page) pins those versions. With other versions an account may show no
components. In that case deploy it from the playground instead:

1. Run the script without `--account`.
2. Open the link.
3. Deploy the account there.
4. Use "Share project" in the Projects menu, which gives a link that holds the
   account.
