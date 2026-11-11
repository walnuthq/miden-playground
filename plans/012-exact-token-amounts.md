# Plan 012: Token amounts are never rounded through `Number`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/lib/utils/asset.ts apps/web/components/transactions/create-transaction-dialog/create-transaction-configure-form.tsx apps/web/hooks/use-consume-notes.ts`
> Plan 011 creates `hooks/use-consume-notes.ts` and edits the form:
> expected. On a mismatch with the excerpts below beyond that, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/011-one-consume-flow-with-errors.md
- **Category**: bug
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Miden amounts are unsigned 64-bit integers in base units. Three places turn
them into a JavaScript `number`, which is exact only up to 2^53 − 1
(9,007,199,254,740,991): the amount handed to Bread Wallet for a send, the
amount handed to it for a consume, and every amount the app displays. Above
that, the value is silently rounded: the wallet is asked for a different
amount than the user typed, and a displayed balance can be off. With 12
decimals that is anything above about 9,007 tokens.

## Current state

- `apps/web/lib/utils/asset.ts:7-21`:

  ```ts
  export const formatAmount = ({
    amount,
    decimals = FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
    signDisplay = "auto",
  }: { … }) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
      signDisplay,
    }).format(Number(formatAssetAmount(BigInt(amount), decimals)));
  ```

  `formatAssetAmount` (from `@miden-sdk/react`) is typed
  `(amount: bigint | number, decimals?: number) => string`.
  `Intl.NumberFormat.prototype.format` accepts a decimal string and formats
  it exactly (ES2023; the web tsconfig's `lib` is `ES2024`). Its TypeScript
  parameter type is `number | bigint | Intl.StringNumericLiteral`.

- `apps/web/components/transactions/create-transaction-dialog/create-transaction-configure-form.tsx`
  (send through Bread Wallet):

  ```tsx
  const transaction = new SendTransaction(
    executingAccount.address,
    normalizeAccountId(targetAccountId),
    faucetAccount.address,
    formData.getAll("is-public").includes("on") ? "public" : "private",
    Number(
      parseAmount(formData.get("amount")?.toString() ?? "0", decimals),
    ),
  );
  ```

- `apps/web/hooks/use-consume-notes.ts` (after plan 011; before it, the same
  code sits in three components):

  ```ts
  const transaction = new ConsumeTransaction(
    faucet.identifier,
    inputNote.id,
    inputNote.type === "public" ? "public" : "private",
    Number(fungibleAsset.amount),
  );
  ```

- `SendTransaction` and `ConsumeTransaction` come from
  `@miden-sdk/miden-wallet-adapter`. Their constructor's amount parameter
  type was not confirmed when this plan was written: step 1 checks it.
- `apps/web/lib/utils/asset.ts` imports `@miden-sdk/react`, so it can't be
  loaded by the `node --test` unit tests. A helper that must be unit-tested
  goes in a module with no SDK import.
- Convention for errors shown to the user: thrown `Error` with a full
  sentence, caught by the caller's
  `toast.error("Transaction failed.", { description })`.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0, `fail 0`    |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**:

- `apps/web/lib/utils/safe-amount.ts`, `safe-amount.test.ts` (create)
- `apps/web/lib/utils/asset.ts` (`formatAmount` only)
- `apps/web/hooks/use-consume-notes.ts` and
  `apps/web/components/transactions/create-transaction-dialog/create-transaction-configure-form.tsx`
  (the two `Number(...)` casts only)

**Out of scope** (do NOT touch):

- `parseAmount`, the Para paths (they pass a `bigint` already), the local
  transaction requests.
- `Number(...)` on things that are not token amounts (block numbers,
  decimals, timestamps).
- The amount input's `max` / `step` attributes.

## Git workflow

- Branch: `fix/exact-token-amounts` from `main`.
- Conventional commit, e.g. `fix(web): keep token amounts exact`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Check what the wallet adapter accepts

Run
`grep -n "amount" apps/web/node_modules/@miden-sdk/miden-wallet-adapter/dist/index.d.ts | head -40`
and find the constructor parameters of `SendTransaction` and
`ConsumeTransaction`.

- If the amount parameter is `number` only → continue with step 2 as written.
- If it accepts `bigint` or `string` → in step 3, pass the `bigint`
  (`parseAmount(...)`, `BigInt(fungibleAsset.amount)`) or the string directly
  instead of `toSafeNumber(...)`, and say so in your report.

**Verify**: you can state the parameter type in one line.

### Step 2: Add the guarded conversion

`apps/web/lib/utils/safe-amount.ts`:

```ts
// A base-unit amount as a number, for APIs that take one (Bread Wallet's
// adapter). Amounts are u64: above 2^53 - 1 a number would round them, so
// those are refused rather than sent wrong.
export const toSafeNumber = (amount: bigint) => {
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      "This amount is too large to send through Bread Wallet from the Playground.",
    );
  }
  return Number(amount);
};
```

`safe-amount.test.ts` (model: `lib/utils/tutorial-status.test.ts`): `0n` → `0`;
`9007199254740991n` → `9007199254740991`; `9007199254740992n` throws.

**Verify**: `cd apps/web && pnpm test` → exit 0 with the new test.

### Step 3: Use it at the two call sites

- Form: `Number(parseAmount(…))` → `toSafeNumber(parseAmount(…))`.
- `use-consume-notes.ts`: `Number(fungibleAsset.amount)` →
  `toSafeNumber(BigInt(fungibleAsset.amount))`.

Both sit inside a `try` whose `catch` shows the toast.

**Verify**: `grep -rn "Number(parseAmount\|Number(fungibleAsset.amount" apps/web --include=*.ts --include=*.tsx --exclude-dir=node_modules`
→ no match. `cd apps/web && pnpm typecheck` → exit 0.

### Step 4: Format display amounts from the string

In `asset.ts`, change the last line of `formatAmount` to:

```ts
  }).format(
    // The decimal string as it is: a number would round large amounts.
    formatAssetAmount(BigInt(amount), decimals) as Intl.StringNumericLiteral,
  );
```

**Verify**: `cd apps/web && pnpm typecheck` → exit 0. Then check the
formatter's output in node (no repo file involved):

```sh
node -e 'console.log(new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format("12345678901234567890.123456"))'
```

→ `12,345,678,901,234,567,890.123456`.

### Step 5: Checks

**Verify**: `cd apps/web && pnpm exec biome check --write lib/utils/safe-amount.ts lib/utils/safe-amount.test.ts lib/utils/asset.ts hooks/use-consume-notes.ts components/transactions`
→ exit 0; `pnpm typecheck` → exit 0; `pnpm test` → exit 0.

## Test plan

- Unit: `safe-amount.test.ts` (three cases).
- E2E (operator, local): `e2e/tutorial-1*`, `tutorial-2*`, `tutorial-3*`:
  their assertions read formatted balances (e.g. "100"), which must not
  change. Report plainly if you could not run them.

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0 including `safe-amount.test.ts`
- [ ] `grep -n "Number(formatAssetAmount" apps/web/lib/utils/asset.ts` → no match
- [ ] `grep -rn "Number(parseAmount\|Number(fungibleAsset.amount" apps/web --include=*.ts --include=*.tsx --exclude-dir=node_modules` → no match
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `formatAssetAmount` returns something other than a plain decimal string
  (grouping separators, a unit, exponent notation): check with a unit-free
  reading of its source in
  `apps/web/node_modules/@miden-sdk/react/dist/index.js`; if so, do not do
  step 4 and report.
- An e2e balance assertion changes its text after step 4.
- `pnpm typecheck` rejects `Intl.StringNumericLiteral` (the `lib` setting
  changed).

## Maintenance notes

- When the wallet adapter accepts `bigint` amounts, delete `toSafeNumber`
  and pass them through.
- New code: keep amounts as `bigint` or decimal strings; `Number()` on an
  amount is a bug.
