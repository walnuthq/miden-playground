# Plan 018: Multisig actions share one client and load the right account

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/hooks/use-multisig.ts apps/web/lib/multisig-client.ts apps/web/lib/miden-client.ts`
> If any changed, compare the "Current state" excerpts against the live code
> before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (wallet signing and Miden Guardian in the loop)
- **Depends on**: none (plan 011 calls `loadMultisig` but doesn't change it)
- **Category**: bug / perf
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

`useMultisig()` keeps the loaded multisig in the calling component's own
`useState`, and the hook is called inside table row components. Each row's
first Sign, Execute or Consume therefore creates a brand-new Miden client
(WASM client, worker, store connection), which takes seconds and is never
terminated: acting on several rows piles up live clients. And `loadMultisig`
returns whatever multisig the instance loaded first, whatever account id it
is asked for: a component that serves two multisigs would act on the wrong
one.

## Current state

- `apps/web/hooks/use-multisig.ts:27-30`:

  ```ts
  const useMultisig = () => {
    const [multisig, setMultisig] = useState<Multisig | null>(null);
    const { networkId } = useNetwork();
  ```

- `apps/web/hooks/use-multisig.ts:113-138` — `loadMultisig`:

  ```ts
  const loadMultisig = async (accountId: string) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    if (!midenWalletSession.commitment || !midenWalletSession.scheme) {
      return;
    }
    if (multisig) {
      return multisig;
    }
    const { commitment, scheme } = midenWalletSession;
    const { multisigClient, signer } = await whileSubmitting(async () => {
      const midenClient = await createMidenClient(networkId);
      const { client: multisigClient } = await initMultisigClient({
        midenClient,
        networkId,
        guardianEndpoint: GUARDIAN_ENDPOINT_URL,
      });
      const signer = new MidenWalletSigner({ signBytes }, commitment, scheme);
      return { multisigClient, signer };
    });
    const loadedMultisig = await multisigClient.load(accountId, signer);
    setMultisig(loadedMultisig);
    return loadedMultisig;
  };
  ```

- `apps/web/hooks/use-multisig.ts:48-110` — `createMultisig` builds its own
  client the same way (`createMidenClient` + `initMultisigClient`, with a
  `scheme` argument and `guardianCommitment` / `guardianPublicKey` in the
  result), creates the multisig and calls `setMultisig(newMultisig)`.
  `importMultisig` (around lines 308-351) is a third place: read it before
  editing.

- `apps/web/lib/miden-client.ts:65-70`:

  ```ts
  const createMidenClient = (networkId: NetworkId) =>
    MidenClient.create({
      rpcUrl: networks[networkId],
      noteTransportUrl: noteTransportUrls[networkId],
      proverUrl: provers[networkId],
    });
  ```

- Callers of `useMultisig()`:
  `components/account/account-multisig-proposals-table.tsx:37` (a row cell:
  `loadMultisig`, `signProposal`, `executeProposal`) and `:105`,
  `components/account/account-notes-table.tsx:50` (a row cell),
  `components/transactions/create-transaction-dialog/create-transaction-configure-form.tsx:99`,
  `components/accounts/deploy-multisig-dialog.tsx:22`,
  `components/accounts/import-account-dialog.tsx:30`,
  `components/account/account.tsx:35`,
  `components/transactions/select-account-combobox.tsx:21`. After plan 011,
  `hooks/use-consume-notes.ts` too.

- How the repo terminates a client it created,
  `apps/web/components/providers/para-provider.tsx:37,48`:
  `createdParaClient.client.terminate();`
- The store a client opens is replaced on a workspace switch (opening a
  project, a tutorial, a new sandbox): `State.workspaceRun`, a number in the
  global state (`useGlobalContext()`), changes each time. A client created
  before a switch holds a connection to a store that was cleared.
- `docs/claude/saved-projects.md` describes workspace switches; the
  `signer-integration` and `chain-anchored-execution` project skills cover
  multisig proposals. Read them if available.

## Commands you will need

| Purpose       | Command                                                                                    | Expected on success |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                                                            | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                                                                 | exit 0              |
| Build         | `cd apps/web && pnpm build`                                                                | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write hooks/use-multisig.ts lib/multisig-cache.ts` | exit 0              |

## Scope

**In scope**:

- `apps/web/lib/multisig-cache.ts` (create)
- `apps/web/hooks/use-multisig.ts`

**Out of scope** (do NOT touch):

- `lib/multisig-client.ts`, `lib/miden-client.ts`.
- The components that call `useMultisig()`: its returned API must not
  change.
- Proposal logic (`signProposal`, `executeProposal`, `createP2idProposal`,
  `createConsumeNotesProposal`) beyond how they obtain the multisig.
- `whileSubmitting`.

## Git workflow

- Branch: `fix/shared-multisig-client` from `main`.
- Conventional commit, e.g. `fix(web): share one multisig client and key loaded multisigs by account`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Read the three client-creation sites

Read all of `hooks/use-multisig.ts`. List, for `createMultisig`,
`loadMultisig` and `importMultisig`: the arguments passed to
`initMultisigClient`, and what each uses from its result.

**Verify**: you can state whether the three calls can share one
`initMultisigClient` result (same arguments apart from `scheme`). If
`createMultisig` needs a different client configuration than `loadMultisig`
(not just extra fields read from the result), STOP: see STOP conditions.

### Step 2: Add a module-level cache

`apps/web/lib/multisig-cache.ts` holds, outside React, one scope at a time:

```ts
// The multisig client and the multisigs loaded with it, shared by every
// useMultisig() caller. One scope at a time: a workspace, a network and a
// signer. Entering another scope terminates the previous client, whose store
// was replaced or belongs to another chain.
type Scope = {
  key: string;
  midenClient: { terminate: () => void };
  client: Promise<…>;        // what initMultisigClient resolves to
  multisigs: Map<string, Multisig>;   // by account id
};
let scope: Scope | null = null;

export const multisigScope = (key: string, create: () => …) => { … };
export const cachedMultisig = (key: string, accountId: string) => …;
export const cacheMultisig = (key: string, accountId: string, multisig: Multisig) => …;
```

Type it with the real types from `use-multisig.ts`'s imports (no `any`).
`multisigScope(key, create)`: when `scope?.key !== key`, call
`scope?.midenClient.terminate()` inside a `try/catch` that logs, then build a
new scope from `create()`; return the scope's client promise. If `create()`
rejects, reset `scope` to `null` so the next call retries.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.

### Step 3: Use it in the hook

In `use-multisig.ts`:

- Read `workspaceRun` from `useGlobalContext()`.
- Build the key where a signer session exists:
  `` `${workspaceRun}:${networkId}:${commitment}:${scheme}` ``.
- `loadMultisig(accountId)`: return `cachedMultisig(key, accountId)` when
  present; otherwise get the client through `multisigScope(key, …)` (the
  `createMidenClient` + `initMultisigClient` code moves into the `create`
  callback, still run inside `whileSubmitting`), `load(accountId, signer)`,
  `cacheMultisig(key, accountId, loaded)`, return it.
- `createMultisig` and `importMultisig`: obtain the client through
  `multisigScope` as well, and `cacheMultisig` the multisig they create or
  import under its account id.
- Remove the `useState<Multisig | null>` and every `setMultisig` call. If
  anything else in the hook read the `multisig` state variable, make it use
  `cachedMultisig(key, accountId)` with the account id it is working on.

**Verify**: `grep -n "useState<Multisig\|setMultisig\|createMidenClient(" apps/web/hooks/use-multisig.ts`
→ `createMidenClient(` appears once (inside the `create` callback), the
other two not at all. `cd apps/web && pnpm typecheck` → exit 0.

### Step 4: Checks

**Verify**: `cd apps/web && pnpm exec biome check --write hooks/use-multisig.ts lib/multisig-cache.ts`
→ exit 0; `pnpm test` → exit 0; `pnpm build` → exit 0.

## Test plan

- No unit test: everything here wraps the WASM client, the guardian service
  and a wallet session.
- E2E (operator, local: web :3000 + api :3001, Bread fixture): the multisig
  tutorial, `cd apps/web && pnpm test:e2e e2e/tutorial-5*.spec.ts` (create,
  propose, sign, execute), then `e2e/workspace-switch.spec.ts`. Report
  plainly if you could not run them: this plan is not done without the
  tutorial 5 run.
- Manual check for the operator: on a multisig with two pending proposals,
  sign both: the second Sign starts without the client start-up delay.

## Done criteria

- [ ] `cd apps/web && pnpm typecheck` and `pnpm build` exit 0
- [ ] `grep -c "createMidenClient(" apps/web/hooks/use-multisig.ts` prints `1`
- [ ] `grep -n "terminate()" apps/web/lib/multisig-cache.ts` → 1 match
- [ ] The object `useMultisig()` returns has the same keys as before (compare the `return {` block with `git diff`)
- [ ] The operator (or you) ran `e2e/tutorial-5*.spec.ts` green; say which
- [ ] `git status` shows only the two in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code.
- `createMultisig` and `loadMultisig` can't share a client (step 1).
- The object returned by `MidenClient.create` has no `terminate` method in
  the installed SDK types.
- A loaded `Multisig` turns out to be tied to the signer object in a way
  that breaks when another component's `signBytes` closure is used (a
  signature request fails after the first one): report, don't work around.
- Tutorial 5's spec fails after the change.

## Maintenance notes

- The shared client lives until the workspace, the network or the wallet
  session changes, then the next multisig action terminates it and builds a
  new one. It is not terminated when the last multisig page unmounts: one
  idle client is the accepted cost.
- A second wallet signing in the same session (another commitment) gets its
  own scope; the previous one is dropped.
- Reviewer: check that no code path reads a multisig cached under another
  account id, and that `whileSubmitting` still wraps the client creation
  (it pauses the sync while the wallet and the guardian are busy).
