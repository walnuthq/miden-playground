# Plan 028: The API answers an upstream 4xx as a 4xx, and "already verified" as verified

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 707141d..HEAD -- apps/api/lib/errors.ts apps/api/lib/errors.test.ts apps/api/lib/upstream.ts apps/api/routes/verified.ts`
> If any of them changed, compare the "Current state" excerpts against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.
> (Plan 013 also edits `routes/verified.ts`, for size limits: if it landed
> first, its validation lines are expected and are not a mismatch.)

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 004 is deployed: the web app treats every non-OK
  answer as an error, whatever its status)
- **Category**: bug
- **Planned at**: commit `707141d`, 2026-11-10

## Why this matters

The API forwards compile and verify requests to two services, api-compile and
api-registry. When one of them refuses a request with a 4xx (a project that
doesn't build: 400; a resource that isn't on the network: 404; a component or
note already verified: 409), the API answers 500 with the service's message.
Two things follow:

1. The API's 5xx count includes requests that were refused for a normal
   reason, so a real failure is harder to see in the logs and in Cloudflare's
   metrics. Seen on 2026-11-10: four `500`s on
   `POST /verified-account-components/mtst` during a local run of tutorial 12,
   all of them the registry's `409 account component already verified`.
2. "Already verified" is reported to the user as a failure. The registry
   answers 409 only after the project compiled to the on-chain code, so the
   answer means "verified, and recorded before". In the "Verify Account
   Component" dialog it shows as the toast "Error while verifying Account
   Component." and the dialog stays open. In the background verification after
   a deploy, a 409 on the first package also stops the loop, so the account's
   other packages are never sent.

After this plan, an upstream 400, 404 or 409 keeps its status, and the two
verify routes answer `{ "verified": true }` when the registry says the code
or script is already verified.

## Current state

- `apps/api/lib/errors.ts:16-28` — every upstream error outside 502–504
  becomes a 500 that keeps the message:

  ```ts
  export const errorStatusAndMessage = (
    error: unknown,
  ): { status: number; message: string } => {
    if (error instanceof HttpError) {
      return { status: error.status, message: error.message };
    }
    if (error instanceof UpstreamError) {
      return { status: 500, message: error.message };
    }
    return { status: 500, message: "Error: Internal server error." };
  };
  ```

  and `:30-38`:

  ```ts
  export const errorResponse = (c: Context, error: unknown) => {
    console.error(error);
    const upstream = upstreamErrorResponse(error);
    if (upstream) {
      return upstream;
    }
    const { status, message } = errorStatusAndMessage(error);
    return c.text(message, status as 400 | 404 | 500);
  };
  ```

- `apps/api/lib/upstream.ts:5-13` — `UpstreamError` carries the upstream
  status (`readonly status: number`); `:35-41` throws it for any non-OK
  answer with the service's `error` text. `upstreamErrorResponse` (`:57-69`)
  passes 502, 503 and 504 through with `Retry-After`. Keep that as it is.
- `apps/api/lib/errors.test.ts:26-31` — the test that pins today's
  behaviour:

  ```ts
  test("an upstream error keeps its message", () => {
    assert.deepEqual(
      errorStatusAndMessage(new UpstreamError("bad manifest", 400)),
      { status: 500, message: "bad manifest" },
    );
  });
  ```

- `apps/api/routes/verified.ts` calls the registry in four places, all with
  the same shape (`:103-118`, `:130-144`, `:189-203`, `:209-222`):

  ```ts
  const { verified } =
    await fetchApiRegistry<VerifyAccountComponentResponse>(
      `/v1/${network}/verified-accounts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          files: packageSourceFiles(name, packageSource),
          entrypoint: name,
          source: "miden-playground",
        }),
        signal: c.req.raw.signal,
      },
    );
  return c.json<VerifyAccountComponentResponse>({ verified });
  ```

  The second one sits in a `for` loop over the stored packages and pushes
  `verified` into `verifiedList`; a thrown 409 leaves the loop.

- What the upstream services answer (read from the verification service's
  source on 2026-11-10; it lives in another repository, do not look for it
  here): 400 for a request that can never succeed, 404 for a missing
  resource, 409 with the message `account component already verified` or
  `note already verified`, thrown after the build matched the on-chain root;
  502–504 for outages. No other 4xx reaches these routes.
- The web app's callers (`apps/web/lib/api.ts`) return `{ error: text }` for
  any `!response.ok` and `{ verified }` otherwise. The dialogs show
  "…verified." for `verified === true`. No web code reads the status number.
- Two places describe today's behaviour in prose:
  - `docs/claude/mainnet-sandbox.md:14` — "The registry answers "already
    verified" (a 500 from the API) for a code or script root it already has,
    which the Playground ignores."
  - `apps/web/e2e/mainnet-network-counter.spec.ts:33-36` — a comment saying
    the same; its `expectVerified` helper (`:45-52`) accepts either a 200
    with `{ verified: true }` or a non-200 whose text matches
    `/already verified/`, so it passes before and after this plan.
- Conventions: the API's unit tests are plain `node --test` on
  `lib/**/*.test.ts` (`node:test`, `node:assert/strict`, relative imports
  with `.ts`). Routes import through `@/`; files under `lib/` that tests load
  import each other relatively (see `errors.ts` importing `./upstream.ts`).

## Commands you will need

| Purpose       | Command                                                                                                                                                          | Expected on success |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Unit tests    | `cd apps/api && pnpm test`                                                                                                                                       | exit 0, `fail 0`    |
| Typecheck     | `cd apps/api && pnpm typecheck`                                                                                                                                  | exit 0              |
| Lint + format | `pnpm exec biome check --write apps/api/lib apps/api/routes/verified.ts docs/claude/mainnet-sandbox.md apps/web/e2e/mainnet-network-counter.spec.ts` (repo root) | exit 0              |
| Full lint     | `pnpm lint` (repo root)                                                                                                                                          | exit 0              |

## Scope

**In scope**:

- `apps/api/lib/errors.ts`, `apps/api/lib/errors.test.ts`
- `apps/api/lib/upstream.ts` (one new exported function, nothing else)
- `apps/api/routes/verified.ts`
- `docs/claude/mainnet-sandbox.md` (one sentence)
- `apps/web/e2e/mainnet-network-counter.spec.ts` (the comment at `:33-36`
  only)

**Out of scope** (do NOT touch):

- `upstreamErrorResponse` and the 502–504 handling.
- `apps/api/routes/scripts.ts`: it already goes through `errorResponse`, so
  it gets the new statuses with no edit.
- `apps/web/lib/api.ts`, the dialogs, the hooks: they need no change.
- The `expectVerified` helper's code in the mainnet spec: its non-200 branch
  becomes unused for 409 but still covers other refusals; leave it.
- Upstream statuses other than 400, 404 and 409 (401, 403, 429, 500…): they
  stay a 500. A 401 or 403 from an upstream service is this API's
  misconfiguration, not the caller's fault.

## Git workflow

- Branch: `fix/api-upstream-client-errors` from `main`.
- Conventional commit, e.g. `fix(api): answer upstream client errors as 4xx`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Change the test first

In `apps/api/lib/errors.test.ts`, replace the test "an upstream error keeps
its message" with:

```ts
test("an upstream client error keeps its status and message", () => {
  for (const status of [400, 404, 409]) {
    assert.deepEqual(
      errorStatusAndMessage(new UpstreamError("bad manifest", status)),
      { status, message: "bad manifest" },
    );
  }
});

test("any other upstream error is a 500 with its message", () => {
  for (const status of [401, 403, 429, 500]) {
    assert.deepEqual(
      errorStatusAndMessage(new UpstreamError("refused", status)),
      { status: 500, message: "refused" },
    );
  }
});
```

**Verify**: `cd apps/api && pnpm test` → the first new test FAILS (it still
gets 500). That is expected here.

### Step 2: Keep the status of an upstream client error

In `apps/api/lib/errors.ts`, replace the `UpstreamError` branch of
`errorStatusAndMessage` and the comment above the function:

```ts
// What api-compile and api-registry refuse for a reason the caller can act
// on: a project that doesn't build, a resource that isn't there, a root
// already verified.
const UPSTREAM_CLIENT_ERRORS = new Set([400, 404, 409]);

// The status and text an error is answered with. An upstream refusal keeps
// its status; any other upstream error is a 500 with its message. Anything
// unexpected (a database error, a bug) is a 500 without its message: that
// goes to the logs.
export const errorStatusAndMessage = (
  error: unknown,
): { status: number; message: string } => {
  if (error instanceof HttpError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof UpstreamError) {
    return {
      status: UPSTREAM_CLIENT_ERRORS.has(error.status) ? error.status : 500,
      message: error.message,
    };
  }
  return { status: 500, message: "Error: Internal server error." };
};
```

In `errorResponse`, widen the cast on the last line:

```ts
return c.text(message, status as 400 | 404 | 409 | 500);
```

**Verify**: `cd apps/api && pnpm test` → exit 0, `fail 0`;
`pnpm typecheck` → exit 0.

### Step 3: Name the "already verified" answer

In `apps/api/lib/upstream.ts`, after the `UpstreamError` class, add:

```ts
// api-registry answers 409 once a project compiled to the resource's root
// and that verification is already recorded: verified, though not by this
// request.
export const isAlreadyVerified = (error: unknown) =>
  error instanceof UpstreamError && error.status === 409;
```

Add to `apps/api/lib/errors.test.ts` (import `isAlreadyVerified` next to
`UpstreamError` on the existing import line from `./upstream.ts`):

```ts
test("only a 409 from upstream means already verified", () => {
  assert.equal(isAlreadyVerified(new UpstreamError("…", 409)), true);
  assert.equal(isAlreadyVerified(new UpstreamError("…", 400)), false);
  assert.equal(isAlreadyVerified(new Error("409")), false);
});
```

**Verify**: `cd apps/api && pnpm test` → exit 0.

### Step 4: Answer "already verified" as verified

In `apps/api/routes/verified.ts`:

1. Change the import to
   `import { fetchApiRegistry, isAlreadyVerified } from "@/lib/upstream";`.
2. The two response types are identical: delete
   `VerifyAccountComponentResponse` and `VerifyNoteResponse` and add
   `type VerifyResponse = { verified: boolean };` in their place. Use it in
   the four `c.json<…>` calls.
3. Above `const verified = createApp()`, add one helper for the four calls:

   ```ts
   // Asks api-registry to verify a project against an account or a note.
   // "Already verified" is its 409: the project matched before, so it counts.
   const verifyWithRegistry = async (
     path: string,
     body: Record<string, unknown>,
     signal: AbortSignal,
   ) => {
     try {
       const { verified } = await fetchApiRegistry<VerifyResponse>(path, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(body),
         signal,
       });
       return verified;
     } catch (error) {
       if (isAlreadyVerified(error)) {
         return true;
       }
       throw error;
     }
   };
   ```

4. Replace each of the four `fetchApiRegistry<…>(…)` calls with the helper,
   keeping the path and the body's fields exactly as they are. The first one
   becomes:

   ```ts
   const verified = await verifyWithRegistry(
     `/v1/${network}/verified-accounts`,
     {
       accountId,
       files: packageSourceFiles(name, packageSource),
       entrypoint: name,
       source: "miden-playground",
     },
     c.req.raw.signal,
   );
   return c.json<VerifyResponse>({ verified });
   ```

   In the loop, `verifiedList.push(await verifyWithRegistry(…))`. Note which
   two bodies carry `source: "miden-playground"` (the `packageSource` ones)
   and which two don't (the stored-package ones): do not add or drop it.

**Verify**:

- `grep -c "fetchApiRegistry" apps/api/routes/verified.ts` → `2` (the import
  and the helper).
- `grep -c "verifyWithRegistry(" apps/api/routes/verified.ts` → `4`
  (the definition is written `verifyWithRegistry = async (`, so it doesn't
  count).
- `grep -c 'source: "miden-playground"' apps/api/routes/verified.ts` → `2`.
- `cd apps/api && pnpm typecheck` → exit 0; `pnpm test` → exit 0.

### Step 5: Update the two descriptions

- `docs/claude/mainnet-sandbox.md:14`: replace the last sentence ("The
  registry answers "already verified" (a 500 from the API) … which the
  Playground ignores.") with: "The registry answers 409 "already verified"
  for a code or script root it already has; the API answers that as
  `{ verified: true }`."
- `apps/web/e2e/mainnet-network-counter.spec.ts:33-36`: reword the end of
  the comment to say that after the first run the registry answers that the
  code is already verified, which the API reports as verified. Comment only.

**Verify**: the Lint + format command of the table → exit 0; `pnpm lint`
(root) → exit 0; `git status --short` shows only the six in-scope files.

## Test plan

- Unit: the three tests of steps 1 and 3 (`apps/api/lib/errors.test.ts`).
- By hand, only if the local stack is up (web on :3000, `apps/api` on :3001
  with its Docker services, see `apps/web/e2e/README.md`): in the mainnet or
  testnet sandbox, open an account whose custom component is already
  verified, use "Verify account component" with the same project folder
  again. Expected: the toast "Account Component verified." and the dialog
  closes; the API log shows no 500 for that request. Without the stack, say
  so in your report: the operator runs
  `cd apps/web && pnpm test:e2e e2e/tutorial-12-contract-verification.spec.ts`
  before merging.
- Never edit `apps/web` files while a Playwright run is in progress (Vite's
  reload breaks the pages under test).

## Done criteria

- [ ] `cd apps/api && pnpm test` exits 0, including the three new tests
- [ ] `cd apps/api && pnpm typecheck` exits 0
- [ ] `pnpm lint` (root) exits 0
- [ ] `grep -n "status: 500, message: error.message" apps/api/lib/errors.ts` prints nothing
- [ ] `grep -c "verifyWithRegistry(" apps/api/routes/verified.ts` prints `4`
- [ ] `grep -rn "a 500 from the API" docs apps/web/e2e` prints nothing
- [ ] `git status` shows only the six in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `errorStatusAndMessage` or `errorResponse` no longer look like the
  excerpts (someone reworked the error handling).
- `routes/verified.ts` has more or fewer than four `fetchApiRegistry` calls.
- A test or a spec other than the ones named here asserts a 500 for an
  upstream refusal (`grep -rn "500" apps/api/lib/*.test.ts apps/web/e2e`):
  report it instead of changing it.
- You find web code that branches on a status number from these routes.

## Maintenance notes

- A merge to `main` deploys the API. The web app needs no deploy for this:
  it already treats every non-OK answer alike.
- If an upstream service starts using another 4xx for a caller's mistake
  (422, 413), add it to `UPSTREAM_CLIENT_ERRORS` with a test line.
- Not explained by this plan: why one run of tutorial 12 sent four
  verifications that were all "already verified". The tutorial's script name
  is random per run and step 4 expects no verified component, so a first
  verification should succeed. Worth a look at the API log of a fresh run
  (a double submit, or a retry of the whole test against the same account);
  after this plan such repeats answer 200 and no longer stand out, so check
  before or right after it lands.
