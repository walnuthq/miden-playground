# Plan 02: MASM templates and their hand-written schemas

> **Executor**: read `spec/remove-rust.md` (decision 3 in full) and `spec/remove-rust/README.md` first. Read `docs/claude/script-templates.md`, `simulation.md` and `mainnet-sandbox.md` (built-in note scripts and the wallets that consume them). Drift check: plan 01 is merged into `feat/masm-switch`; `git diff --stat 966084c..HEAD -- apps/api/templates apps/web/lib/types/default-scripts`.

- **Rollout step**: 4 (part of the switch)
- **Effort**: L
- **Risk**: MEDIUM (the templates are what every new user script starts from)
- **Depends on**: 01
- **Branch**: `masm/02-templates`, off `feat/masm-switch`

## Goal

The ten templates are real MASM, each one assembles and works on chain as its Rust version did, and the ones with storage or note inputs carry a hand-written schema that the API attaches as `metadata` and drops when it goes stale.

## The ten templates

`account-component`, `note`, `transaction-script` (blank starting points), `basic-wallet`, `p2id-note`, `auth-no-auth`, `counter-account`, `counter-note`, `counter-script`, `count-reader`.

- `basic-wallet`, `p2id-note` and `auth-no-auth` re-export or wrap the standard procedures, as the built-ins' MASM does (`apps/web/lib/types/default-scripts/`). A MASM P2ID note must call the standard wallet's own procedures, so a standard wallet, Bread and Para can consume it: that is what removes the embedded Rust basic wallet.
- The counter trio starts from the spike's projects (`spike/masm-assembly/projects` in the verifier repo, or its `examples/masm` after the verifier's plan 03) and from the MASM counter the built-ins had before commit `d980603` (`git show d980603^ -- apps/web/lib/types/default-scripts`), which was written against an older SDK.
- `count-reader` calls the counter through foreign procedure invocation (`tx::execute_foreign_procedure`).
- Write them to be read: tutorials 6 to 12 will quote them line by line, and MASM needs a comment per stack effect. Keep each Rust template's procedure names and behaviour, so the tutorials' story holds.

## Schemas

1. **Shape and place.** A schema has the shape `metadata.storage` and `metadata.noteStorage` have today (`apps/web/lib/types/default-scripts/storage-schemas.ts` is the model; `lib/package-metadata.ts` in the API has the types). Each template with storage ships its schema next to its `.masm`, in a module `lib/templates.ts` loads. `counter-account` gets `storage`; `p2id-note` and `counter-note` get `noteStorage` if they read inputs; the blank templates and `auth-no-auth` get none.
2. **Attach.** When the API creates a package from a template, it sets `metadata` from the template's schema. Fork and project links copy `metadata` with the package.
3. **Stale rule for account storage** (user, 2026-11-24). On each compile, in the one function plan 01 left for deciding `metadata`: read the slot names the source declares (its `word("…")` slot constants) and compare them with the schema's slot names. Same set: keep the schema. Different: drop `metadata.storage`, and the UI falls back to the raw form. A dropped schema doesn't come back by itself.
4. **Stale rule for notes** (user, 2026-11-24). A note's inputs have no names in MASM. A note keeps its `noteStorage` while its source is byte for byte the template's as shipped, and loses it on the first edit. Store what the comparison needs with the package (the template's name is enough, since the API holds the shipped source); don't add a column if `metadata` can carry it.
5. **`templates:check`** fails when a template as shipped disagrees with its own schema (rule 3 run on the template itself), and when a template doesn't compile.
6. **Not covered**, by decision: scripts written from the blank templates, imported scripts, and anything forked from a schemaless script. They have no schema.

## Steps

1. Write the ten templates and make each compile through the local API.
2. Write the schemas and the loader; implement rules 2 to 5 with unit tests: a renamed slot drops the schema, an added slot drops it, a comment-only edit of an account component keeps it, any edit of a note drops it, an unedited note keeps it.
3. Prove each template on MockChain or Testnet through the app once plan 03 is in, or, before that, through the web SDK in a script: deploy the counter, increment it with the note and with the script, read it with `count-reader`, send a P2ID note and consume it with a standard wallet. A Testnet deploy needs the user's go-ahead; MockChain doesn't.
4. Update `docs/claude/script-templates.md` for the parts this plan changes.

## Verification

- `pnpm --filter miden-playground-api test`, `templates:check`, `typecheck` and `pnpm lint` pass.
- Step 3's run, with what was deployed where.
- A package created from `counter-account` has `metadata.storage`; after renaming its slot and compiling, it has none.

## STOP conditions

- A MASM P2ID note built here can't be consumed by a standard wallet. The removal of the embedded wallet in plan 05 rests on this.
- The slot names can't be read reliably from the source. Report the cases; don't ship a regex that guesses.

## Out of scope

The web app's forms (plan 04), the tutorials' text (plan 07), the embedded packages (plan 05).
