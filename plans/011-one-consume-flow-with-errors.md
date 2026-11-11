# Plan 011: Consuming and sending have one code path each, and say why they fail

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/components/note/consume-note-button.tsx apps/web/components/notes/columns.tsx apps/web/components/account/account-notes-table.tsx apps/web/components/account/account-information.tsx apps/web/components/transactions/create-transaction-dialog/create-transaction-configure-form.tsx`
> If any changed, compare the "Current state" excerpts against the live code
> before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (user-facing transaction paths with wallet extensions)
- **Depends on**: none
- **Category**: bug / tech-debt
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

"Consume a note" is implemented three times (the note page button, the notes
list menu, the account's notes table), each choosing between four signers:
Para, Bread Wallet, a multisig proposal, or the Playground's own client. The
copies drifted: only the account table knows multisigs, so consuming a
multisig's note from the notes list takes the local path. Several branches
return or catch without telling the user: a Bread Wallet consume of a note
with no asset or from a faucet the workspace doesn't list does nothing, and
every wallet error is logged as a rejection. In the Send dialog, an account
the Playground holds itself (a No Auth contract on testnet) is sent through
Bread Wallet, which doesn't own it, and "Consume all notes" has no error
handling.

## Current state

All paths under `apps/web/`.

- `components/note/consume-note-button.tsx:44-103` — the reference copy:

  ```tsx
  onClick={async () => {
    try {
      if (isParaWallet(targetAccount)) {
        setLoading(true);
        await consumeWithPara({ noteIds: [inputNote.id] });
        setLoading(false);
      } else if (connectedWallet?.id === targetAccount.id) {
        if (!client) {
          throw new Error("MidenClient not ready");
        }
        const [fungibleAsset] = inputNote.fungibleAssets;
        const faucet = faucets.find(
          ({ id }) => id === fungibleAsset?.faucetId,
        );
        if (!wallet || !fungibleAsset || !faucet) {
          return;
        }
        const adapter = wallet.adapter as MidenWalletAdapter;
        try {
          if (inputNote.noteFileBytes) {
            await adapter.importPrivateNote(
              fromBase64(inputNote.noteFileBytes),
            );
          } else {
            const transaction = new ConsumeTransaction(
              faucet.identifier,
              inputNote.id,
              inputNote.type === "public" ? "public" : "private",
              Number(fungibleAsset.amount),
            );
            const txId = await adapter.requestConsume(transaction);
            console.info({ txId });
          }
        } catch (error) {
          // Rejected in Bread Wallet.
          console.error(error);
        }
      } else {
        setLoading(true);
        const { transactionRequest, transactionResult } =
          await newConsumeTransactionRequest({
            accountId: targetAccount.id,
            noteIds: [inputNote.id],
          });
        openCreateTransactionDialog({
          accountId: targetAccount.id,
          transactionType: "consume",
          step: "preview",
          transactionRequest,
          transactionResult,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Transaction failed.", {
        description: error instanceof Error ? error.message : String(error),
      });
      setLoading(false);
    }
  }}
  ```

  Hooks used (lines 26-34): `useMiden()` → `client`; `useWallet()` →
  `wallet`; `useAccounts()` → `faucets`, `connectedWallet`, `isParaWallet`;
  `useParaTransaction()` → `consumeWithPara`; `useTransactions()` →
  `openCreateTransactionDialog`, `newConsumeTransactionRequest`.

- `components/notes/columns.tsx:63-117` — `InputNoteActionsCell`: the same
  three branches, with `if (!client || !wallet || !fungibleAsset || !faucet) { return; }`.
- `components/account/account-notes-table.tsx:67-137` — `NoteActionsCell`:
  the same, plus, between the Bread branch and the local one:

  ```tsx
  } else if (account.multisig) {
    const multisig = await loadMultisig(account.id);
    if (!multisig) {
      return;
    }
    await createConsumeNotesProposal({
      multisig,
      noteIds: [inputNote.id],
    });
  } else {
  ```

  (`loadMultisig`, `createConsumeNotesProposal` from `useMultisig()`), and a
  `finally { setLoading(false); }`.

- `components/account/account-information.tsx:55-72` — "Consume all notes"
  (shown only in tutorials and on the mock chain), no `try`:

  ```tsx
  onClick={async () => {
    const { transactionRequest, transactionResult } =
      await newConsumeTransactionRequest({
        accountId: account.id,
        noteIds: account.consumableNoteIds,
      });
    openCreateTransactionDialog({ accountId: account.id, transactionType: "consume", step: "preview", transactionRequest, transactionResult });
  }}
  ```

- `components/transactions/create-transaction-dialog/create-transaction-configure-form.tsx`
  — the form's `onSubmit` wraps everything in
  `try { … } catch (error) { console.error(error); toast.error("Transaction failed.", { description: … }); } finally { setLoading(false); }`
  (lines 126-287). Inside:

  ```tsx
  // :147-169
  if (transactionType === "consume" && executingAccount) {
    // Accounts the Playground holds itself (e.g. No Auth contracts)
    // consume notes locally, connected wallets sign the transaction.
    if (
      isTutorial ||
      networkId === "mmck" ||
      !isConnectedWallet(executingAccount)
    ) {
      … newConsumeTransactionRequest … setStep("preview");
    } else if (isParaWallet(executingAccount)) {
      …
    }
  }
  ```

  ```tsx
  // :170-252, send
  if (isTutorial || networkId === "mmck") {
    … newSendTransactionRequest … setStep("preview");
  } else if (isParaWallet(executingAccount)) {
    … sendWithPara …
  } else {
    if (!wallet) {
      return;
    }
    if (executingAccount.multisig) {
      const multisig = await loadMultisig(executingAccount.id);
      if (!multisig) {
        return;
      }
      await createP2idProposal({ … });
      closeCreateTransactionDialog();
    } else {
      const transaction = new SendTransaction( … Number(parseAmount(…)) );
      const adapter = wallet.adapter as MidenWalletAdapter;
      try {
        const txId = await adapter.requestSend(transaction);
        console.info({ txId });
        closeCreateTransactionDialog();
      } catch (error) {
        console.error(error);
      }
    }
  }
  ```

- `hooks/use-accounts.ts:77-80`:

  ```ts
  const isParaWallet = (account: Account) =>
    !!paraWalletAccount && account.id === paraWalletAccount.id;
  const isConnectedWallet = (account: Account) =>
    account.id === breadWallet?.id || isParaWallet(account);
  ```

- `components/account/account.tsx:40-48` — outside tutorials, the "Create
  transaction" menu shows for connected wallets, accounts with the
  `auth-no-auth` or `auth-network-account` component, and multisigs the user
  signs for.
- Conventions: hooks live in `apps/web/hooks/use-*.ts`, default-export a
  function returning an object (see `hooks/use-compile-script.ts`). Errors
  reach the user with `toast.error("Transaction failed.", { description })`
  from `sonner`. Decided and not to change: a failed example deploy shows a
  Retry toast with no auto-retry; an account stays hidden after a failed
  funding.
- The app shell must not import `@miden-sdk/*` (CLAUDE.md). These components
  are below the lazy root, so a hook that imports the wallet adapter is fine
  as long as no `*View` module or `AppShell` imports it.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0              |
| Build guard   | `cd apps/web && pnpm build`                            | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**:

- `apps/web/hooks/use-consume-notes.ts` (create)
- `apps/web/components/note/consume-note-button.tsx`
- `apps/web/components/notes/columns.tsx` (`InputNoteActionsCell` only)
- `apps/web/components/account/account-notes-table.tsx` (`NoteActionsCell`
  only)
- `apps/web/components/account/account-information.tsx` (the button's
  `onClick`)
- `apps/web/components/transactions/create-transaction-dialog/create-transaction-configure-form.tsx`
  (the consume and send branches quoted above)

**Out of scope** (do NOT touch):

- `Number(...)` on amounts: plan 012 handles precision. Keep the casts as
  they are when moving code.
- `hooks/use-multisig.ts`, `hooks/use-para-transaction.tsx`,
  `hooks/use-transactions.ts`, `hooks/use-accounts.ts`.
- Button labels, menu item text, layout classes, tutorial copy.
- The mint and custom branches of the form.

## Git workflow

- Branch: `fix/one-consume-flow` from `main`.
- Conventional commits, e.g. `refactor(web): share the consume-note flow`,
  `fix(web): report failed sends and consumes`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `useConsumeNotes`

`apps/web/hooks/use-consume-notes.ts` default-exports a hook returning
`{ consumeNote }`:

```ts
// Consumes a note with the account that can: Para and Bread Wallet sign for
// their own account, a multisig gets a proposal, and an account the
// Playground holds itself goes through the transaction dialog's preview.
// Throws with a message for the user when it can't.
const consumeNote = async ({
  account,
  inputNote,
}: {
  account: Account;
  inputNote: InputNote;
}) => { … };
```

Body, in this order (the order of `account-notes-table.tsx`):

1. `isParaWallet(account)` → `await consumeWithPara({ noteIds: [inputNote.id] })`.
2. `connectedWallet?.id === account.id` → the Bread branch. Replace the
   silent returns with thrown errors:
   - no `client` → `throw new Error("MidenClient not ready")` (existing text);
   - no `wallet` → `throw new Error("Bread Wallet isn't connected.")`;
   - no `fungibleAsset` →
     `throw new Error("This note carries no asset: Bread Wallet can't consume it from the Playground.")`;
   - no `faucet` →
     `throw new Error("Import the note's faucet account first: its asset isn't known to this workspace.")`.
     Do not wrap `importPrivateNote` / `requestConsume` in an inner
     `try/catch`: let their errors propagate.
3. `account.multisig` → `loadMultisig(account.id)`; if it returns nothing
   `throw new Error("Connect the wallet that signs for this multisig.")`;
   then `createConsumeNotesProposal({ multisig, noteIds: [inputNote.id] })`.
4. Otherwise → `newConsumeTransactionRequest` + `openCreateTransactionDialog`
   exactly as in the excerpt.

The hook calls the same hooks the components call today (`useMiden`,
`useWallet`, `useAccounts`, `useParaTransaction`, `useTransactions`,
`useMultisig`).

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.

### Step 2: Use it in the three call sites

In each, the `onClick` becomes:

```tsx
onClick={async () => {
  setLoading(true); // where the component has a loading state
  try {
    await consumeNote({ account: targetAccount, inputNote });
  } catch (error) {
    console.error(error);
    toast.error("Transaction failed.", {
      description: error instanceof Error ? error.message : String(error),
    });
  } finally {
    setLoading(false); // see below for consume-note-button
  }
}}
```

- `consume-note-button.tsx`: it keeps `loading` true while the dialog is open
  on the local path (its `useEffect` on `createTransactionDialogOpen` resets
  it). Keep that: set `loading` false in the `catch` only, and after the
  await when the account is a Para, Bread or multisig account (i.e. when the
  dialog was not opened: `if (isParaWallet(targetAccount) || connectedWallet?.id === targetAccount.id || targetAccount.multisig) setLoading(false)`).
- `columns.tsx`: no loading state; `try/catch` only.
- `account-notes-table.tsx`: `try/catch/finally` as today.

Remove the imports each file no longer uses (`ConsumeTransaction`,
`MidenWalletAdapter`, `useWallet`, `useMiden`, `fromBase64`,
`useParaTransaction`, `useMultisig`, …): `pnpm typecheck` and Biome report
unused ones.

**Verify**: `grep -rn "new ConsumeTransaction" apps/web --include=*.tsx --include=*.ts --exclude-dir=node_modules`
→ exactly 1 match, in `hooks/use-consume-notes.ts`.
`cd apps/web && pnpm typecheck` → exit 0.

### Step 3: "Consume all notes"

Wrap the `onClick` body of `account-information.tsx` in
`try { … } catch (error) { console.error(error); toast.error("Transaction failed.", { description: error instanceof Error ? error.message : String(error) }); }`
(import `toast` from `sonner`). No routing change: the button only shows in
tutorials and on the mock chain, where accounts are local.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.

### Step 4: The Send and Consume dialog

In `create-transaction-configure-form.tsx`:

1. Send, first condition: change `if (isTutorial || networkId === "mmck") {`
   to

   ```tsx
   // Accounts the Playground holds itself (e.g. No Auth contracts) send
   // locally, like they consume; connected wallets and multisigs sign.
   if (
     isTutorial ||
     networkId === "mmck" ||
     (!isConnectedWallet(executingAccount) && !executingAccount.multisig)
   ) {
   ```

2. Send, wallet branch: replace `if (!wallet) { return; }` with
   `if (!wallet) { throw new Error("Bread Wallet isn't connected."); }`,
   replace `if (!multisig) { return; }` with
   `throw new Error("Connect the wallet that signs for this multisig.")`,
   and remove the inner `try/catch` around `adapter.requestSend` so its error
   reaches the form's `catch` (keep `closeCreateTransactionDialog()` after a
   successful `requestSend`).
3. Consume: add a multisig condition to the local branch's test
   (`!isConnectedWallet(executingAccount) && !executingAccount.multisig`
   in place of `!isConnectedWallet(executingAccount)`), and after the
   `else if (isParaWallet(executingAccount)) { … }` add:

   ```tsx
   } else {
     throw new Error(
       "Consume this note from the account's notes table: this dialog can't ask this account's signer.",
     );
   }
   ```

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write hooks/use-consume-notes.ts components/note components/notes components/account components/transactions`
→ exit 0; `pnpm test` → exit 0; `pnpm build` → exit 0 (the build fails if the
app shell's static graph reached the SDK).

## Test plan

- No unit test: every branch calls a wallet, the WASM client or React
  context, none of which the `node --test` setup can load.
- E2E (operator, local: web :3000 + api :3001, Bread fixture): at least
  `e2e/tutorial-1*`, `tutorial-2*`, `tutorial-3*` (Bread consume and send),
  `tutorial-4*` (Para), `tutorial-5*` (multisig proposals),
  `e2e/example-*.spec.ts`, and the `e2e/mobile` projects for the two tables.
  Report plainly if you could not run them.
- Manual check for the operator, Testnet sandbox: deploy a No Auth account,
  open Create transaction → Send: the preview step opens (before: nothing
  happened or Bread was asked).

## Done criteria

- [ ] `grep -rn "new ConsumeTransaction" apps/web --include=*.ts --include=*.tsx --exclude-dir=node_modules | wc -l` prints `1`
- [ ] `grep -n "Rejected in Bread Wallet" -r apps/web/components` → no match
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `cd apps/web && pnpm build` exits 0
- [ ] `pnpm lint` (root) exits 0
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code.
- `useMultisig()` inside the new hook makes `pnpm build` fail on the app
  shell guard (a `*View` module imports one of the three components).
- A tutorial's e2e spec relies on a Bread Wallet rejection being silent (a
  toast now appears and an assertion on "no toast" fails): report the spec,
  don't special-case the error.
- You find a fourth place that builds a `ConsumeTransaction`.

## Maintenance notes

- A cancelled Bread Wallet request now shows "Transaction failed." with the
  wallet's message. If that proves noisy, filter on the adapter's rejection
  error in `use-consume-notes.ts`, in one place.
- The new error strings name UI ("the account's notes table"): if that table
  is renamed, update them.
- Plan 012 (amount precision) edits the `Number(...)` casts left in
  `use-consume-notes.ts` and the configure form.
- Plan 018 changes how `loadMultisig` caches: this hook only calls it.
