# Exporting a project to continue it locally

Status: explored 2026-11-06, not scheduled. The round trip below was verified
with the installed tools; nothing is implemented.

A saved project is the app state plus the client store (see
`docs/claude/saved-projects.md`). Scripts already leave the playground as a zip
per script (`GET /scripts/:id/export`, `apps/api/routes/scripts.ts`). The
question was whether the accounts, notes and transactions in the store can
follow, so that a project started in the playground continues with the
`miden-client` CLI, or any Rust or Node client.

Answer: yes for accounts and notes, through the account file (`.mac`) and note
file (`.mno`) formats the CLI already imports. No for the store dump itself,
and no for the transaction history.

## The store dump is not an interchange format

`exportStore()` (`@miden-sdk/miden-sdk`, `crates/idxdb-store/src/ts/export.ts`
in the web-sdk repo) walks the Dexie tables of the IndexedDB and returns them as
one JSON object: `accountCode`, `latestAccountHeaders`, `inputNotes`,
`transactions`, `settings`… (`apps/web/lib/types/store.ts` has the shape).
Values are camelCase records with hex strings for ids and roots and
`{ "__type": "Uint8Array", "data": "<base64>" }` for serialized objects. The
`accountAuth` table holds the secret keys in the clear, and `settings` carries
the `clientVersion` stamp.

Its only consumer is the web SDK's `forceImportStore`
(`crates/idxdb-store/src/ts/import.ts`): it clears the target database and
bulk-puts the rows, after refusing a dump stamped before 0.17.0 or by a client
newer than the running one. On the Rust side the `Store` trait has no import or
export, and the CLI's SQLite store differs in every respect that would matter
to a converter: snake_case tables with BLOB-serialized values instead of hex,
secret keys in a filesystem keystore (`keystore/<commitment>`, `key_index.json`)
instead of a table, and tables the IndexedDB schema doesn't have (`forest_*`).
A JSON-to-SQLite converter would reimplement both stores' encodings and break on
every SDK bump (see the migration notes in `apps/web/lib/utils/store.ts`).

The dump stays what it is: the playground-to-playground format behind Projects.

## The portable formats

Both are Protobuf messages defined in `miden-objects`
(`proto/account_file.proto`, `proto/note_file.proto`), which the web SDK and
the CLI share.

- **Account file, `.mac`.** The whole account (code, storage, vault, nonce, the
  seed while it's new) plus the secret keys the keystore holds for it. SDK:
  `client.accounts.export(id)` returns an `AccountFile`; `serialize()` gives
  the bytes, `authSecretKeyCount()` says how many keys it carries. CLI:
  `miden-client import <file>.mac`, `miden-client export --account <id>`
  (`--no-keys` leaves the keys out). Importing a basic wallet makes it the
  default account when none is set.
- **Note file, `.mno`.** Three variants: the note id alone (a public note the
  client fetches), the details with a sync hint (metadata recovered from the
  chain by tag; the private-friendly one), or the committed note with its
  inclusion proof. SDK: `client.notes.export(noteId, { format })` with
  `NoteExportFormat.Id | Full | Details`, for output notes;
  `NoteFile.fromInputNote(note)` for input notes (committed with proof when
  known, details otherwise). The playground imports `.mno` files already
  (`components/notes/import-note-dialog.tsx`); the export helpers are the
  commented-out `clientExportNoteFile` block in `apps/web/lib/web-client.ts`.
- The CLI's `import` takes any mix of both and tells them apart by decoding
  (`miden-client-cli`, `src/commands/import.rs`). A note import fetches the
  genesis header first, so it needs the network; an account import doesn't.

## Verified round trip (2026-11-06)

Setup: the Node build of `@miden-sdk/miden-sdk` 0.17.8 (the package's `node`
entry, napi binding, in-memory mock chain), and `miden-client` 0.17.3 from the
midenup toolchain, initialized in a scratch directory with
`miden-client init --local --network testnet`. The SDK pins `miden-client`
0.17.5 and `miden-objects` 0.17.1.

| File               | Content                                    | CLI result                                    |
| ------------------ | ------------------------------------------ | --------------------------------------------- |
| `wallet.mac`       | private wallet, new (nonce 0), 1 key       | listed `New`, key in keystore, set as default |
| `faucet.mac`       | public fungible faucet after a mint, 1 key | listed `Tracked`, nonce 1, key in keystore    |
| `note-full.mno`    | the minted note, committed with proof      | input note `Unverified (with commit block 1)` |
| `note-details.mno` | the same note, details and sync hint       | same record (matched by details commitment)   |

The note came from the mock chain, so its proof can't verify against testnet;
a note from a real network verifies on the next sync. `account_file.proto` and
`note_file.proto` are byte-identical between `miden-objects` 0.17.1 and 0.18.0,
so the 0.18 CLI should read these files too (not tested).

The export side, reduced to what matters:

```js
// node export.mjs <outDir>, next to a project that installs @miden-sdk/miden-sdk
import { MidenClient, getWrappedSdk } from "@miden-sdk/miden-sdk";
const wasm = getWrappedSdk();
const client = await MidenClient.createMock();
const wallet = await client.accounts.create({ storage: "private" });
const faucet = await client.accounts.create({
  type: "FungibleFaucet",
  symbol: "TST",
  decimals: 6,
  maxSupply: 1_000_000_000n,
});
await client.transactions.mint({
  account: faucet.id(),
  to: wallet.id(),
  amount: 1000,
  type: "public",
});
await client.proveBlock();
await client.sync();
const [note] = await client.notes.listSent();
write("wallet.mac", (await client.accounts.export(wallet.id())).serialize());
write(
  "note-full.mno",
  (
    await client.notes.export(note.id(), { format: wasm.NoteExportFormat.Full })
  ).serialize(),
);
```

```sh
miden-client init --local --network testnet
miden-client import wallet.mac faucet.mac note-full.mno
miden-client account && miden-client keys && miden-client notes
```

## What doesn't carry over

- **Transaction history.** The client has no import for transaction records.
  Account and note state come back through sync; the list of past transactions
  stays in the playground. It could ship as an informational JSON.
- **Para and Bread Wallet accounts.** Their keys never reach the SDK, so their
  `.mac` carries the state and zero keys. The CLI can track such an account but
  not sign for it. Public ones can be imported from the node by id anyway.
- **Mock-chain (`mmck`) and local (`mlcl`) projects.** Nothing to continue
  against. Testnet, mainnet and devnet projects work, and the CLI must be
  initialized on the same network (`--network testnet|mainnet|devnet`).
- **Private notes not exported.** A private note's details exist only in the
  store, so an unconsumed private input note that isn't in the export is lost
  to the local client. Public notes and consumed notes don't need exporting.
- **Playground metadata.** Account and script names, an example's `exampleId`,
  tutorial progress, multisig proposals: nothing in the files. A manifest in
  the archive carries what's worth keeping.

## Proposed shape

An **Export…** entry in the Projects submenu (sandboxes and examples, and each
saved project in the list) that downloads `<project name>.zip`, built in the
browser: the api must never see the secret keys. `fflate` is already a
dependency of `apps/api`; the web app would add it.

```
README.md                    the commands below, the network, the SDK version
project.json                 manifest: name, networkId, savedAt, accounts
                             (id, name, address, kind, key count), notes, scripts
scripts/<package>/…          what GET /scripts/:id/export produces, per script
accounts/<account id>.mac    every account of State.accounts
notes/<note id>.mno          unconsumed input notes (fromInputNote) and output
                             notes (Full when committed, Details otherwise)
playground/state.json        the Projects snapshot, so the zip also re-imports
playground/store.json        into the playground (optional, phase 2)
```

- The README names the SDK version (`CLIENT_VERSION` in
  `apps/web/lib/utils/store.ts`) and says to install a matching CLI
  (`cargo install miden-client-cli --version 0.17.x`, or midenup), then:
  `miden-client init --network <network>`, `miden-client import accounts/*.mac
  notes/*.mno`, `miden-client sync`.
- A confirmation dialog before the download says the archive holds secret keys
  in the clear, and lists the accounts exported without keys (Para, Bread).
- Importing the zip back into the playground reuses the Projects path:
  `pushState` with `playground/store.json` as `nextStore`. Importing a single
  `.mac` into the playground needs `client.accounts.import({ file })` wired
  into `import-account-dialog.tsx`, which today imports by address and multisig
  only. Both are optional follow-ups.

## Open questions

- Export consumed notes and transactions as a readable JSON, for the record?
- One zip for the whole project, or also per-account `.mac` downloads from the
  accounts table (a cheaper first step that covers most of the use)?
- Mainnet projects: the sandbox's funding warning applies to anything the local
  client then does; the README should say so.
