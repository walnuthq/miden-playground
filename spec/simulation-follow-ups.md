# Simulation follow-ups

Status: **a backlog, not a plan** (2026-11-17). What the Simulate tab still can't do after #844 to #853, checked against `main` and `docs/claude/simulation.md` on that date. None of these is scheduled: each needs its own plan, and most should wait for a script that needs them.

## Done from this list

- **Foreign calls from a note or transaction script on the simulated account.** Each dependency of the simulated account has a "Foreign account" switch: marked, it's staged on the mock chain instead of being a component of the target, and a typed account field of the note's storage can name it. The package doesn't say which dependency is the foreign one (`callsForeign` is `null` for notes and transaction scripts), so the user does. `docs/claude/simulation.md` has the details.

## Open

### Wallet-held accounts as targets

An account whose key isn't in the Playground's keystore (Bread, Para, an imported wallet) can't be a simulation target: a single-sig account's auth procedure asks the keystore for a signature, and the run stops there (`executeTransaction` and `executeForSummary` both fail on the `miden::protocol::auth::request` event). The log says to pick a No Auth account or a wallet created here. The same limit makes the Create Note dialog's preview fail on a wallet-held recipient.

- Options, none tested, in `spec/editor-console-improvements.md` (item 11): disable those accounts in the target dropdown with the reason, simulate on a clone in the mock client with a throwaway key, let the wallet sign (Para only), or ask upstream for an executor mode that skips auth. Multisig accounts may already work through `executeForSummary`: only single-sig was tested.
- When: the simulated account covers most scripts. Worth it once a script must run against the state of a real wallet. Disabling them in the dropdown is the cheap first step.

### Argument types the form can't type

The arguments form (`components/procedures/procedure-arguments-form.tsx`) types `Felt`, `Word`, `AccountId` and `Asset`. Any other parameter (`NoteIdx`, a record, an option, a list) shows "arguments of type … aren't supported yet" and keeps the run disabled, in the Simulate tab and in the account page's Invoke dialog. The basic wallet's `move_asset_to_note(asset, note_idx)` is one.

- Needs: per type, the felts the compiler's ABI expects (`lib/utils/procedure-inputs.ts`), and a field for it. A `NoteIdx` is a felt, but it names an output note created earlier in the same transaction, so a lone call has nothing to point at: it needs a run of several calls, or stays out of reach.
- When: records and options with the first example whose exports take one. A raw felts fallback, as note storage has, would unblock every type at once.

### Foreign calls two levels deep

A staged foreign account's own `account-component` dependencies aren't staged, so a foreign procedure that itself makes a foreign call fails (or crashes the mock client, which recovers). The fix is a recursion over what exists: resolve the staged package's dependencies with `foreignDependencies`, stage them first with `stageForeignAccount`, and give each its storage editor.

- Cost: each level adds an account and a block per run after an edit (`STAGINGS_PER_CLIENT`), and the tab needs a way to show nested accounts and to name them in an argument.
- When: cheap, but no example calls through two accounts. Do it with the first script that does.

### A vault on staged foreign accounts

A staged account must be committed on the mock chain, and the vault's seed (`seedVault`) lives in the store only: `proveBlock` panics on a note that was never created on the chain. Minting the note from the faucet in the same block works (the assets spike, `spec/simulate-assets.md`): about 170 ms and a block per seed.

- When: once an example reads another account's balance through a foreign call (a pool's reserves, say). None does today.

### Advice inputs

Runs pass empty advice inputs (`new AdviceInputs()` in `lib/simulation/run.ts`), and the forms have no field for them. A procedure that reads the advice stack or the advice map (a signature check, a Merkle proof) can't be given its data.

- Needs: a design for entering a map of words to lists of felts, and a check of what `executeTransaction` and `executeProgram` accept on the mock client.
- When: with a real script that needs it. Components written with the Rust SDK rarely read advice directly.

### Naming a staged account from a transaction script or a raw-felt note

A typed account field takes a stand-in that the run resolves. A transaction script's argument is a word and a note without a storage schema takes raw felts: neither can hold a stand-in, since the account's id is known only once it's built. Today the run writes each staged account's id to the log, stable until its slots are edited or the client is reset, to copy by hand. The simulated account itself has the same limit in raw-felt note storage.

- A possible fix: show the ids in the tab before the run (build the accounts on demand), or let a felt field take a stand-in's prefix or suffix.
- When: notes without a schema are mostly the MASM built-ins, which have no Simulate tab. Low.

### Non-fungible assets

The vault, a note's assets and the `Asset` argument are fungible only, as everywhere in the Playground. This is a feature of the whole app, not of the simulation alone.

### Private foreign accounts

A foreign call to a private account needs the account's data supplied with the transaction, on a real network as well. Out of the simulation's reach until the Playground supports it for real transactions.

### Sandbox accounts as foreign accounts on the mock chain

Unchanged: the mock chain only serves accounts committed on it, so a sandbox account can't be a foreign account of a mock-client run. The tab disables them where it knows (`callsForeign: true` on an account component's export) and recovers from the crash elsewhere.
