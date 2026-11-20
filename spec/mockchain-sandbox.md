# MockChain sandbox (`mmck`) on an in-browser mock chain

Status: shipped. The spike was done on 2026-11-19 on `spike/mockchain-sandbox` (one commit marked "spike", not pushed); PRs A to E followed (table below) and the sandbox has been on in production since 2026-11-20. F isn't decided. `docs/claude/mockchain-sandbox.md` describes what was built and is the reference from here on. From "Verdict" on, the text is the spike's, as written, except for the notes marked "Since". SDK 0.17.10 (`@miden-sdk/miden-sdk`, `@miden-sdk/react`); Rust sources read in the local `web-sdk` checkout at v0.17.8 and `miden-client` 0.17.5.

## What shipped

| PR  | Number | Merged     | Content                                                                                                                                                                    |
| --- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | #857   | 2026-11-19 | The mock client as the app's client, its default store, the chain kept across reloads, crash recovery                                                                      |
| B   | #858   | 2026-11-19 | Block after each submit, account commit instead of funding, sync loop, notes, no verification, Import account hidden, the counter packages, the e2e spec                   |
| C   | #859   | 2026-11-19 | Saved projects carry their chain (`Project.mockChain`), `popState`'s fallback, reset paths, one tab at a time (a Web Lock)                                                 |
| D   | #860   | 2026-11-19 | The Simulate tab without a second mock client: no simulated account on `mmck`                                                                                              |
| E   | #861   | 2026-11-20 | Home card and switcher entry in every build, `mmck1…` addresses, Verify buttons, Guardian entries and the Network Account auth component hidden, a phone test              |
| -   | #862   |            | Spec only: the e2e helper waits for the badge to read `MockChain \| #N`. Against production it took Testnet's block number for the sandbox's and clicked before the switch |

Where the build differs from the plan below:

- One tab at a time is enforced by a Web Lock, which the plan didn't have (it only listed "two tabs" under C).
- D took the first option of answer 2 (no simulated account on `mmck`), not the sandbox's own client.
- Addresses: the app builds them itself on `mmck` (`accountAddress`, `NetworkId.custom("mmck")`), since the React SDK can't be told the prefix.
- The home grid kept two columns: the third card sits alone on its row.

Still open after E:

- `clientGetLatestBlockNum` and `clientGetNotesById` (`lib/web-client.ts`) still build an `RpcClient` for `localhost` on `mmck`. Nothing calls them there today (tutorial 3's mint button does, and tutorials don't run on `mmck`).
- A sandbox faucet's asset in a note and `clientGetAccounts` were listed below as ways to ask the chain for an account it doesn't hold. Neither was reproduced or ruled out; a crash restarts the client with a toast.
- A network account, a private send through the note transport and a foreign call from the account page were never tried on `mmck`. Network Account is hidden in the deploy dialog on the assumption that nothing consumes its notes there.
- A sandbox no tab has open while a tab on another network simulates: its store is emptied under the saved chain (in the guide).
- The built app was tested on port 3100, where the API's CORS refuses it: the counter deploy and the Simulate tests ran against the dev build and production only.
- The upstream gaps below aren't filed. Whether 0.18 changes any of them isn't checked.
- F (tutorials 1 and 2 on `mmck`).

## Verdict

Feasible without SDK changes. Every flow asked for runs in a browser on a mock client as the app's main client. Two things rest on workarounds an SDK change would remove: handing the client to `MidenProvider` (the spike replaces a static of the SDK), and the mock store's fixed name, which makes the Simulate tab delete the sandbox's store. No hard blocker was met, so all six questions are answered.

What "tested" means below: done by hand with agent-browser on the dev build (web on 3000, api on 3001), reading the page and the console. No Playwright spec was written or run. `pnpm --filter miden-playground-web build`, typecheck, lint and the unit tests (238) pass with the spike code.

## Answers

### 1. Can the main client be a mock client? Yes, by replacing `WasmWebClient.createClient` (tested)

- The React SDK takes no client. `MidenProvider` builds its own with `WebClient.createClient(rpcUrl, …)` (`@miden-sdk/react/dist/index.mjs:759`, `WebClient` being `WasmWebClient`, line 386), `MidenConfig` has no client field (`index.d.ts:144`), and neither the context nor `useMidenStore` (whose `setClient` would do it, line 53) is exported.
- `MockWasmWebClient extends WasmWebClient` (`miden-sdk/dist/st/index.d.ts:245`), so the provider and every hook accept one. The spike gives `networks.mmck` a sentinel URL (`"mock"`, which `resolveRpcUrl` passes through) and replaces the static to return `MockWasmWebClient.createClient(chain, transport)` for it (`apps/web/lib/mock-chain.ts`). The app already writes to that class (`workerMode`, `lib/miden-client.ts:20`).
- `MidenClient.createMock()` is no help here: the provider wants the low-level client.
- `prover` must be unset on `mmck`. With `"local"` (`lib/miden-client.ts`, before the spike) the React SDK passes a local prover (`resolveProverTarget`, `index.mjs:474`) and the mock client generates a real proof: creating a wallet was still on "Creating…" after 30 s. Without a prover the mock client's own is used and a transaction takes well under a second.
- The app shell stays SDK-free: `lib/mock-chain.ts` is only imported from `lib/miden-client.ts`, which already imports the SDK. The build passes.

### 2. Store separation: no other store name, and the Simulate tab destroys the sandbox (tested)

- The name is fixed in Rust: `let store_name = "mock_client_db".to_owned();` (`web-sdk/crates/web-client/src/mock.rs:54`), and `createMockClient(seed, chain, transport)` takes no name (`miden-sdk/dist/st/crates/miden_client_web.d.ts:5769`). The JS wrapper's `MOCK_STORE_NAME` (`dist/st/index.js:4341`) only keys the store lock.
- What breaks: `simulationClient()` deletes `mock_client_db` before creating its client (`lib/simulation/simulation-client.ts:13-25`). On `mmck`, one Invoke in the Simulate tab logged "Another connection wants to delete database 'mock_client_db'. Closing db now", the simulation ran, and from then on every sync of the sandbox failed: "chain validation error … verify against the validator key at that position". The accounts the app still listed were gone from the store. Two mock chains never share a genesis (each has its own validator key), so two clients can't share the store either.
- Without an SDK change: on `mmck`, the Simulate tab must not create its client. Either hide its "Simulated account" and account-component runs there, or run them on the sandbox's own client and accept the throwaway accounts in the store (the reason the separate client exists, `docs/claude/simulation.md`).

### 3. Wallet, faucet, mint, consume, send (tested, all pass)

Run on a fresh `mmck` sandbox: two public wallets, a faucet, a public mint of 1,000 MDN to Wallet A, consume (Wallet A: nonce 2, 1,000 MDN), a public send of 250 to Wallet B (note Committed, sender shown). Also a private mint and its consume. What had to change:

- A block must be proven after every submitted transaction, then a sync: nothing else produces blocks. `submitNewTransaction` (`hooks/use-transactions.ts:242`, where the commented-out block was) calls `proveBlock()` then `sync()`. The React SDK's `useTransaction` syncs before the block exists (`index.mjs:3857`), so its own sync isn't enough.
- Funding: `fundAccount` asks the faucet API and waits for a fee note (`hooks/use-fund-account.ts`). The mock chain has neither, and charges no fee (accounts with an empty vault transact). On `mmck` the spike submits an empty transaction instead, which puts the new account on chain (nonce 1), then proves a block. Every later step that assumes a committed account keeps working.
- The app's own sync loop was switched off on `mmck` (`components/lib/network-badge.tsx:43`): notes never showed. It's on in the spike.
- `clientGetAllInputNotes` fetches note metadata with a stateless `RpcClient` against `localhost` (`lib/web-client.ts:88`, `:140`). The mock chain is only reachable through the client; on `mmck` the notes keep their records' metadata, which was enough for the table (type, tag, sender).
- A fresh sandbox imports `defaultStore(networkId)`, which seeded testnet's genesis header and protocol config for `mmck` (`lib/utils/store.ts`): the first sync failed with "has 3 signatures but the validator set has 2 keys". The spike seeds neither, and re-creates the mock chain on the live client after the import (see 5), which writes the chain's own genesis.
- The MidenProvider's auto-sync (5 s) and `fetchPrivateNotes` (`hooks/use-app-state.ts:288`) run unchanged against the in-process chain and note transport, without errors. Each sync serializes the chain to the worker; the dump was 21 KB at block 4.
- Not needed on `mmck`: the remote prover, the faucet API. Explorer links were already hidden (`note-information-table.tsx:39`, `transaction-information-table.tsx:25`).
- Not tested: a private send between two wallets through the note transport (both are in one store, so the transport isn't what delivers it), sends to an address outside the sandbox, Consume all.

### 4. Deploy from the Counter Contract package and invoke (tested, passes)

The spike gives a `mmck` sandbox the counter example's packages, as a Mainnet sandbox gets (`sandboxStarter`, `hooks/use-app-state.ts:489`). Deploy account with `counter-account` and No Auth: listed at nonce 1. `increment_count` from the account page: preview, submit, `count_map` shows key 1, value 1. `get_count` returns 1; after a reload and a second increment, 2.

- The deploy posts to `/verified-account-components/mmck`, which the API refuses (400, `apps/api/lib/validation.ts:6`). Nothing shows in the UI; it must be skipped on `mmck`.
- Compiling needs the API as on any network; it doesn't depend on the chain.
- Not tested: the increment note, a network account, a foreign call from the account page.

### 5. Saved projects and reload: the chain is in memory, so it must be saved next to the store (tested)

- The store holds the client's view (accounts, notes, headers). The chain itself lives in the WASM client on the main thread and is copied to the worker on every sync and submit (`dist/st/index.js:6003-6030`, `workers/web-client-methods-worker.module.js:383`). `exportStore()` doesn't include it.
- Reload with nothing done about it: the store is ahead of a new, empty chain. The app stayed on "Loading Miden Playground… Syncing MockChain" with nothing in the console. After I cleared the store by hand, the app state still listed an account the chain didn't have, and the sync's `importAccountById` panicked in the worker (`miden-client-0.17.5/src/test_utils/mock.rs:748`), which kills the client until a reload.
- With the chain saved, both work. The spike writes `serializeMockChain()` and `serializeMockNoteTransportNode()` to an IndexedDB database (`PlaygroundMockChain`) after every block, and gives them back to `createClient` on load: a reload showed the same accounts, `get_count` read 1, and a new transaction went through.
- Projects: the spike wraps the snapshot's `store` string with the chain (`hooks/use-projects.ts:48`), and `popState` unwraps it, imports the store, then replaces the chain on the live client (`replaceMockChain`). Tested: save "Mock one" with Wallet A, create Wallet B, start a new `mmck` sandbox (empty, block 0), open "Mock one": Wallet A alone, and a new faucet commits at block 2.
- Replacing the chain in place uses an internal: `getWasmWebClient().createMockClient(…)` on the wrapper, which the worker does itself on each sync. It's needed because a new sandbox on the same network doesn't re-create the client.
- `clearMidenStorage()` doesn't delete `mock_client_db` (no "miden" in the name); the import overwrites it, which was enough.
- Not handled in the spike: `popState`'s fallback path, `resetLocalData` (doesn't delete the chain database), `isRestorable` (reads the wrapper as a store and passes by luck), and two tabs on `mmck` (each has its own chain in memory over one store; not tested, expected to corrupt it).

### 6. Tutorials (read only, none run on `mmck` in the spike)

None runs unchanged. Tutorials 1 and 2 start from a store snapshot taken on testnet (`components/tutorials/*/store.ts`), with a faucet deployed there: imported on a mock chain it fails as the default store did in 3.

| Tutorial                        | On `mmck`    | What stops it                                                                                                                                         |
| ------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Create and fund a wallet      | With changes | Testnet snapshot; needs the MDN faucet created at start (about a second) or a mock store and chain snapshot, regenerated on SDK bumps                 |
| 2 Transfer assets               | With changes | Same, and steps 3 to 5 teach the fee note from the testnet faucet (`use-wallet-b.ts`, `step4.tsx:42`): no fees on the mock chain, so the copy changes |
| 3, 4, 5, 8, 9, 11               | No           | `requiresWallet`: Bread, Para and Guardian sign for real networks                                                                                     |
| 6 Interact with the counter     | No           | Imports an account deployed on testnet; an unknown account panics the mock RPC                                                                        |
| 7 Deploy a counter              | Likely       | Same flow as 4 above; verification must be skipped                                                                                                    |
| 10 Foreign procedure invocation | Maybe        | Both accounts would be local and committed; not tried                                                                                                 |
| 12 Contract verification        | No           | The registry has no `mmck`                                                                                                                            |

`MockChainAlert` and `startBlockNum`'s `mmck` branch already exist (`tutorial-step.tsx:52`, `hooks/use-tutorials.ts:24`).

## Code paths that need an `mmck` branch

Done in the spike (all marked `SPIKE`):

- `lib/miden-client.ts`: `networks.mmck` (sentinel), `provers.mmck` (none).
- `lib/mock-chain.ts` (new): client factory, chain persistence, `proveMockBlock`, `replaceMockChain`.
- `lib/utils/store.ts`: no genesis header or protocol config in `defaultStore("mmck")`.
- `hooks/use-transactions.ts`: block and sync after a submit.
- `hooks/use-fund-account.ts`: commit the account instead of funding it.
- `hooks/use-app-state.ts`: `popState` (chain with the store), `sandboxStarter`, no USDCx Faucet entry in a fresh state.
- `hooks/use-projects.ts`: the chain in the snapshot.
- `lib/web-client.ts`: no `RpcClient` in `clientGetAllInputNotes`.
- `components/lib/network-badge.tsx`: the sync loop.
- `home-view.tsx`, `project-switcher.tsx`: the entries.

Still to do (Since: all done in PRs A to E except the three `RpcClient` helpers, see "What shipped"):

- `lib/simulation/simulation-client.ts` and the Simulate tab: see 2. The worst one: it deletes the sandbox.
- Anything that asks the chain for an account it doesn't hold panics the worker: Import account (`hooks/use-accounts.ts:162`), `clientGetAccounts` (`lib/web-client.ts:177`), a sandbox faucet's asset in a note. Hide Import account on `mmck`, and recover from a dead worker as `withSimulationClient` does.
- `hooks/use-accounts.ts:327`: skip verification. Also the verify dialogs (`verify-account-component-dialog.tsx`, `verify-note-script-dialog.tsx`).
- `lib/web-client.ts`: `clientGetLatestBlockNum`, `clientNetworkNoteFee` and `clientGetNotesById` build an `RpcClient` for `localhost`.
- Addresses: the React SDK's `normalizeAccountId` picks the prefix from the RPC URL, so account pages and URLs read `mtst1…` while the tables print `mmck…` (`lib/web-client.ts:683`).
- `walletAdapterNetworks.mmck` is Localnet; the wallet button is already hidden (`header.tsx:22`). Guardian and network accounts in the deploy dialog should be hidden.
- `resetLocalData`, `deleteMidenStores`, `popState`'s fallback, `isRestorable`, the Projects type (a `mockChain` field instead of the wrapper).
- Layout: the home grid gets a third card; run the `e2e/mobile` projects.
- Tutorial copy: nothing names the MockChain today; grep after naming the menu entry.

## Upstream gaps worth filing

1. `@miden-sdk/react`: `MidenProvider` can't take a client or a factory. A `createClient` option in `MidenConfig` would replace the patched static.
2. `createMockClient`: a store name parameter (`mock.rs:54`). Removes the clash in 2 and lets the Simulate tab stay as it is.
3. `MockRpcApi` panics on an account it doesn't hold (`mock.rs:748`, `committed_account(...).unwrap()`), and the worker call never settles. Already hit by the Simulate tab; an error would do.
4. No public way to load or reset the chain of a live mock client, and `exportStore`/`importStore` leave the chain out. A store and chain that disagree hang initialization with no error.
5. Typings: `usesMockChain`, `proveBlock` and `serializeMockChain` aren't on the `WasmWebClient` the React SDK returns.
6. Bech32 prefix from the RPC URL: already in `spec/upstream-sdk-issues.md`; the mock chain is one more case.

Not checked: whether 0.18 changes any of these.

## Proposed PRs

Since: A to E merged as #857 to #861, with the sizes below exceeded by the tests each one added.

| PR  | Content                                                                                                                                                                          | Size                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| A   | Mock client as the main client: factory, prover, default store, chain persistence across reloads, dead-worker recovery. Unit tests. Entries still hidden                         | about 350 lines                  |
| B   | Transactions and accounts: block after submit, account commit instead of funding, sync loop, notes, no verification, Import account hidden. An e2e spec for the flows in 3 and 4 | about 300 lines, plus 200 of e2e |
| C   | Saved projects: `mockChain` in `Project`, `popState` with its fallback, reset paths, two tabs. `saved-projects.md`                                                               | about 250 lines                  |
| D   | Simulate tab on `mmck`: no second mock client (or its own store once gap 2 is fixed). `simulation.md`                                                                            | about 150 lines                  |
| E   | Turn it on: home card, switcher entry, copy, address prefix, phone layout, a `docs/claude` guide                                                                                 | about 150 lines                  |
| F   | Optional, its own decision: tutorials 1 and 2 on `mmck` (state built at start, tutorial 2's fee steps rewritten)                                                                 | about 400 lines                  |

A to D can merge with the entries hidden; E is the switch. The order A, B, C, D matters only for A first.
