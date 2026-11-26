# Plan 06: The Counter Contract example in MASM

> **Executor**: read `spec/remove-rust.md` and `spec/remove-rust/README.md` first. Read `docs/claude/examples.md` and `mockchain-sandbox.md`. Drift check: the switch is merged to `main` and deployed (ask the user), and plan 02's `counter-account` and `counter-note` templates exist.

- **Rollout step**: 5
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 05, released
- **Branch**: `feat/masm-counter-example`, off `main`

## Goal

The home page's Counter Contract example launches again, built from MASM: a counter account component and the note that increments it. Tutorial 9 starts from this example's packages, so its shape is settled here.

## Current state

- `apps/api/examples/counter-contract`: two Rust packages copied from the upstream Rust project, with a `compiled.json` snapshot (about 560 KB of base64 per note package), a source hash (`examples/hash.ts`) and `pnpm examples:compile` (`scripts/compile-examples.ts`). After plan 05 the example's card is hidden by the `hidden` flag on its `ExampleMeta` (`lib/examples/meta.tsx`): remove the flag when the MASM example ships, and lift `test.fixme` from `e2e/example-counter-contract.spec.ts`. Miden Bank keeps its flag (decision 9).
- `apps/web/lib/examples/counter-contract` and `meta.tsx` describe it; `e2e/example-counter-contract.spec.ts` and `e2e/example.ts` drive it (`test.fixme` since plan 05).
- The example specs launch an example through `apps/api`: run it on port 3001 next to the web app on 3000.

## Steps

1. Write the two packages as MASM, from plan 02's `counter-account` and `counter-note` templates, the note depending on the account by path. Give the account its hand-written `metadata.storage` and the note its `noteStorage` if it reads inputs, attached by the API as plan 02 does for templates.
2. Snapshots. A MASM build takes milliseconds, so try compiling on launch and deleting `compiled.json`, the source hash, `examples:compile` and the "regenerate after a bump" rule. Measure a launch after the api-compile container has slept. If the launch is noticeably slower than today's, keep a snapshot: it is now about 1 KB per package without debug info, but the stored package is the dev one, so check its size first.
3. Web: the example's description, steps and any copy that names Rust or `lib.rs`. Make the card available again.
4. `e2e/example-counter-contract.spec.ts`: remove `test.fixme`, update it, run it on desktop and the mobile projects.
5. Check `mainnet-network-counter.spec.ts` and the Mainnet sandbox's counter, if they use this example's packages.
6. `docs/claude/examples.md`: rewrite for what you built.

## Verification

- `pnpm lint`, `pnpm typecheck`, unit tests.
- Local e2e: the example spec, `mockchain-sandbox.spec.ts`, and the mobile projects for the home page and the example.
- By hand: launch on MockChain and on Testnet, increment, read the count. The Testnet launch deploys from the user's own browser session as any user would; it needs no special go-ahead beyond the e2e the repo already runs.
- Report the launch time and the Worker bundle size before and after.

## STOP conditions

- The dev package's size makes the launch or the stored state heavy (hundreds of KB per package): report sizes and options, since decision 5 flagged this ("a client that only deploys may want the release bytes").

## Out of scope

Tutorial 9 itself (plan 07), bringing Miden Bank back.
