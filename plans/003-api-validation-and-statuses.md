# Plan 003: The API validates its input and answers client errors with 4xx

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 301e950..HEAD -- apps/api/routes apps/api/lib apps/api/db/packages.ts`
> Plans 001 and 002 are expected to have changed some of these files (001:
> `lib/package-sources.ts` exists, `lib/import.ts` imports it; 002:
> `lib/package-files.ts` exists, the export handler is shorter). Any other
> difference from the "Current state" excerpts is a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW-MED (changes status codes the web app reads; see "Deploy order")
- **Depends on**: plans/001-api-unit-tests.md; land plans/004-web-api-response-ok.md first
- **Category**: security
- **Planned at**: commit `301e950`, 2026-11-10; re-checked at `d4be8c2`
  (drift = plans 001/002 only; step 1 amended for `UpstreamError`)

## Why this matters

Every route of `apps/api` wraps its body in `try/catch` and answers
`c.text(message, 500)` with the raw error message. Bad input is therefore a
500, and internal errors leak: a script id that is not a UUID reaches Postgres
and the client receives Drizzle's `Failed query: <SQL> params: …` text. "Not
found" is also a 500, an unknown dependency id is a `TypeError`, and the
`:network` path parameter is interpolated unchecked into the URL of an
upstream service. After this plan, invalid input gets a 400 with a clear
message, missing packages a 404, and unexpected errors a generic 500 whose
detail stays in the logs.

## Current state

`apps/api` is a Hono app. Routes: `apps/api/routes/scripts.ts`
(`POST /scripts`, `POST /scripts/import`, `POST /scripts/examples/:exampleId`,
`GET|PATCH|DELETE /scripts/:id`, `GET /scripts/:id/export`) and
`apps/api/routes/verified.ts` (`POST /verified-account-components/:network`,
`POST /verified-notes/:network`).

- The catch block every handler repeats:

  ```ts
  // apps/api/routes/scripts.ts (e.g. the PATCH handler)
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return upstreamErrorResponse(error) ?? c.text(message, 500);
  }
  ```

  Some handlers omit `upstreamErrorResponse(error) ??`. The export handler
  answers `c.text("Error exporting script", 500)`. The examples handler
  answers 404 for `ExampleNotFoundError`.
- `apps/api/lib/upstream.ts` — `UpstreamError` (has `status`) and
  `upstreamErrorResponse(error)`, which returns a `Response` for upstream
  statuses 502-504 and `undefined` otherwise. An `UpstreamError` with another
  status (e.g. the compile service's 400 with a useful message) currently
  falls through to `c.text(message, 500)`. Keep that.
- Unvalidated input:
  - `POST /scripts` (`scripts.ts:79-111`): `name` goes into file paths and
    TOML (`name = "${name}"`); `example` indexes `scriptsDependencies` and
    `templates`. Only `type` is checked (400).
  - `GET|PATCH|DELETE /:id`, `/:id/export`: `id` goes to a `uuid` column
    without a format check. Not found throws
    `new Error("Error: Package not found.")` → 500.
  - `PATCH /:id`: `dependencies` is passed to `getDependencies`
    (`apps/api/db/packages.ts:66-93`), where an id that is neither a UUID nor
    a default dependency name maps to `undefined` and crashes the caller.
  - `verified.ts`: `network` is used as `/v1/${network}/verified-accounts`;
    `packageSource` fields are assumed to be strings; `packageIds` an array.
  - Import: package names come from the user's `miden-project.toml` in
    `resolvePackageSources` (`apps/api/lib/package-sources.ts` after plan
    001), which throws plain `Error`s with user-facing messages such as
    `Error: <path>: miden-project.toml has no [package] name.` These messages
    are shown to the user and must keep reaching them, as 400s.
- `apps/api/lib/uuid.ts` exports `isValidUUIDv4`.
  `apps/api/lib/default-dependencies.ts:60-63` exports
  `defaultDependenciesRecords` (keys `basic-wallet`, `counter-account`).
- The web app's script-name field allows `[a-zA-Z][a-zA-Z0-9_\-]{0,63}`, at
  least 2 characters, and sends the kebab-cased value
  (`apps/web/components/scripts/create-script-dialog.tsx:107-109`). Imported
  names are Cargo-style and may hold upper case and `_`.
- How the web app reads errors (`apps/web/lib/api.ts`): `await
  response.text()` shown in a toast when the response is not OK. Messages
  conventionally start with `Error: `.
- Test conventions: `node --test`, relative `.ts` imports, `import type` for
  types, no `@/` at runtime in a module under test (see
  `apps/api/lib/package-sources.test.ts`).

## Deploy order

Plan 004 makes three web functions treat every non-OK response as an error
(today they only handle status 500). Merge and deploy plan 004 before this
plan so the web app shows the new 400/404 messages instead of a JSON parse
error.

## Commands you will need

Run from `apps/api` unless noted.

| Purpose       | Command                           | Expected on success |
| ------------- | --------------------------------- | ------------------- |
| Tests         | `pnpm test`                       | exit 0, `fail 0`    |
| Typecheck     | `pnpm typecheck`                  | exit 0              |
| Bundle check  | `pnpm build`                      | exit 0              |
| Lint + format | `pnpm exec biome check --write .` | exit 0              |
| Lint, repo    | `pnpm lint` (repo root)           | exit 0              |

## Scope

**In scope**:

- `apps/api/lib/errors.ts` (create), `apps/api/lib/errors.test.ts` (create)
- `apps/api/lib/validation.ts` (create), `apps/api/lib/validation.test.ts`
  (create)
- `apps/api/lib/package-sources.ts` and its test (errors become `HttpError`,
  names validated)
- `apps/api/routes/scripts.ts`, `apps/api/routes/verified.ts`
- `apps/api/db/packages.ts` (`getDependencies`: skip unknown default names)
- `apps/api/lib/utils.ts` (only the `throw new Error("Error: Package not found")`
  in `compilePackage`)
- `apps/api/lib/import.ts` (only if a thrown `Error` there is a client error)
- `apps/api/lib/upstream.ts` (only the two step 1 changes: the constants
  import and the `UpstreamError` fields)

**Out of scope** (do NOT touch):

- Authentication, ownership or rate limiting — a separate, deferred decision
  (plan 006).
- Response bodies of successful requests, and build failures (a failed
  compile stays a 200 with `status: "error"`).
- `apps/api/lib/upstream.ts` behaviour for 502-504 (only the step 1 loadability
  changes are allowed there).
- `apps/web/**` (plan 004).
- Adding a validation library (no zod, no valibot): plain functions.
- CORS configuration in `apps/api/index.ts`.

## Git workflow

- Branch: `fix/api-validation` from `main`.
- Conventional commits, e.g. `fix(api): validate input and answer 4xx`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Errors module

Create `apps/api/lib/errors.ts` (relative imports only):

```ts
import { UpstreamError } from "./upstream.ts";

// A request the client got wrong: answered with its status and message.
export class HttpError extends Error {
  readonly status: 400 | 404;
  constructor(status: 400 | 404, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message: string) => new HttpError(404, message);

// The status and text an error is answered with. Anything unexpected (a
// database error, a bug) is a 500 without its message: that goes to the logs.
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

Note: no parameter properties in the class (`node` type stripping rejects
them). `apps/api/lib/upstream.ts` must become loadable by `node --test`, which
takes two changes there and nothing else:

1. It imports `@/lib/constants` at runtime; change that import to
   `"./constants.ts"` (`apps/api/lib/constants.ts` has no imports).
2. `UpstreamError` uses parameter properties
   (`constructor(message: string, readonly status: number, readonly retryAfter?: string)`),
   which node rejects with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` (verified on
   node 26.13 at 478b5d0). Rewrite it with declared fields, same behaviour
   and signature:

   ```ts
   export class UpstreamError extends Error {
     readonly status: number;
     readonly retryAfter?: string;
     constructor(message: string, status: number, retryAfter?: string) {
       super(message);
       this.status = status;
       this.retryAfter = retryAfter;
     }
   }
   ```

Check: `node -e 'import("./lib/upstream.ts").then(() => console.log("ok"))'`
(from `apps/api`) prints `ok`.

Then add to `errors.ts` a helper used by every handler:

```ts
import type { Context } from "hono";
import { upstreamErrorResponse } from "./upstream.ts";

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

`errors.test.ts`: `errorStatusAndMessage` returns 400/404 with the message
for `badRequest`/`notFound`; `{ 500, "Error: Internal server error." }` for
`new Error("Failed query: select …")` and for a non-Error value; 500 with the
upstream message for `new UpstreamError("bad manifest", 400)`.

**Verify**: `pnpm test` → exit 0; `pnpm typecheck` → exit 0.

### Step 2: Validation module

Create `apps/api/lib/validation.ts` (no imports needed):

```ts
// A package name: what Cargo accepts, as the web app's form does. It becomes
// a directory name and a TOML string.
export const isValidPackageName = (name: unknown): name is string =>
  typeof name === "string" && /^[A-Za-z][A-Za-z0-9_-]{1,63}$/.test(name);

// A network id as the registry's paths take it ("mtst", "mdev", "mm").
export const isValidNetwork = (network: string) =>
  /^[a-z0-9-]{1,32}$/.test(network);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const isPackageSource = (
  value: unknown,
): value is { midenProjectToml: string; rust: string } =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { midenProjectToml?: unknown }).midenProjectToml ===
    "string" &&
  typeof (value as { rust?: unknown }).rust === "string";
```

`validation.test.ts`: names `"ab"`, `"counter-note"`, `"My_Lib2"` valid;
`"a"`, `""`, `"2ab"`, `"a/b"`, `"../x"`, `'a"b'`, `"a b"`, a 65-character
name, `undefined` and `42` invalid. Networks `"mtst"`, `"mm"` valid; `""`,
`"../x"`, `"a/b"`, `"MTST"` invalid. `isStringArray`: `[]` and `["a"]` true;
`"a"`, `[1]`, `undefined` false. `isPackageSource`: a full object true;
`null`, `{}`, `{ rust: "x" }`, `{ rust: 1, midenProjectToml: "" }` false.

**Verify**: `pnpm test` → exit 0.

### Step 3: Client errors in `resolvePackageSources`

In `apps/api/lib/package-sources.ts`, import `badRequest` from
`"./errors.ts"` and replace every `throw new Error(…)` (including the one
inside `fail`) with `throw badRequest(…)`, messages unchanged. After the
`if (!name)` check add:

```ts
if (!isValidPackageName(name)) {
  return fail(
    `[package] name "${name}" isn't a valid package name (letters, digits, - and _, starting with a letter, 2 to 64 characters).`,
  );
}
```

In `package-sources.test.ts`: the existing `assert.throws` patterns still
pass; add a test that a package named `../evil` throws
`/isn't a valid package name/`, and that the thrown error is an `HttpError`
with `status === 400`.

**Verify**: `pnpm test` → exit 0.

### Step 4: Route handlers in `scripts.ts`

Replace the body of every `catch (error) { … }` in
`apps/api/routes/scripts.ts` with `return errorResponse(c, error);` (the
examples handler keeps its `ExampleNotFoundError` → 404 branch before it, or
make `importExample` throw `notFound(…)` in `lib/import.ts` and drop the
branch; either is fine, keep the message `Error: Example not found.`). Then
add validation at the top of each `try`:

- A shared helper in the file: `const packageId = (id: string) => { if
  (!isValidUUIDv4(id)) { throw notFound("Error: Package not found."); } return
  id; };` — use it for `c.req.param("id")` in GET, PATCH, DELETE and export.
- Reading the JSON body: wrap as
  `await c.req.json<T>().catch(() => { throw badRequest("Error: Invalid request body."); })`
  in every handler that reads one.
- `POST /`: keep the existing type check (it already answers 400). Add:
  `if (!isValidPackageName(name)) throw badRequest("Error: Invalid script name.");`
  and
  `if (!Object.hasOwn(scriptsDependencies, example)) throw badRequest("Error: Invalid script example.");`
- `POST /import`: `packageSources` must be a non-null object whose values all
  pass `isPackageSource`, else `badRequest("Error: Invalid request body.")`.
- `GET /:id` and export: replace `throw new Error("Error: Package not found…")`
  with `throw notFound("Error: Package not found.")`.
- `PATCH /:id`: `source === undefined` → `badRequest("Error: Invalid request
  body.")`; `dependencies` must pass `isStringArray` and every entry must be
  `isValidUUIDv4(entry) || Object.hasOwn(defaultDependenciesRecords, entry)`,
  else `badRequest("Error: Invalid dependencies.")`. Import
  `defaultDependenciesRecords` from `@/lib/default-dependencies`.
- In `apps/api/lib/utils.ts` `compilePackage`, change
  `throw new Error("Error: Package not found")` to
  `throw notFound("Error: Package not found.")`.
- In `apps/api/db/packages.ts` `getDependencies`, keep only known default
  names: add `&& Object.hasOwn(defaultDependenciesRecords, dependency)` to the
  first `.filter`.

**Verify**: `pnpm typecheck` → exit 0;
`grep -n "c.text(message, 500)\|as { message: string }" routes/scripts.ts` → no match.

### Step 5: Route handlers in `verified.ts`

Same catch replacement. At the top of both handlers:
`if (!isValidNetwork(network)) throw badRequest("Error: Invalid network.");`
Read the body with the `.catch` wrapper from step 4. Validate before use:
`accountId` / `noteId` are non-empty strings; a present `packageSource` passes
`isPackageSource`; `packageIds` passes `isStringArray` and each is a valid
UUIDv4; `packageId` is a valid UUIDv4; `dependencies` (notes) is an array of
`isPackageSource`. Failures → `badRequest("Error: Invalid request body.")`.
The two existing `throw new Error("Error: Invalid request body.")` become
`badRequest`, and `throw new Error(\`Package with ID ${packageId} not found.\`)`becomes`notFound`. Package names parsed from `packageSource.midenProjectToml`
(`parseMidenProjectToml(...).package.name`) must pass `isValidPackageName`,
else `badRequest("Error: Invalid miden-project.toml.")`; wrap the parse so a
TOML syntax error is the same 400.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0;
`pnpm exec biome check --write .` → exit 0; `pnpm test` → exit 0;
`grep -rn "c.text(message, 500)" routes` → no match.

### Step 6: Smoke test against a local API (only if the operator has it running on port 3001)

If `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` does not
print `200`, skip this step and say so in your report.

| Command                                                                                                                                                               | Expected status |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/scripts/not-a-uuid`                                                                                     | `404`           |
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/scripts/3f2b8c1e-9d4a-4f6b-8a1c-0e5d7b9c2a4f`                                                           | `404`           |
| `curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"name":"a/b","type":"note","example":"none"}' http://localhost:3001/scripts` | `400`           |
| `curl -s -o /dev/null -w "%{http_code}" -X POST -d '{}' http://localhost:3001/verified-notes/UPPER`                                                                   | `400`           |

## Test plan

- `errors.test.ts`, `validation.test.ts`, additions to
  `package-sources.test.ts`, as listed in steps 1-3.
- The handlers themselves need the database; they are covered by typecheck,
  the step 6 smoke test, `pnpm templates:check` (needs the running stack; run
  it if available: it creates, compiles and deletes every template through
  the API and must still pass), and the operator's Playwright run.

## Done criteria

- [ ] `cd apps/api && pnpm test` exits 0 with the new tests
- [ ] `pnpm typecheck` and `pnpm lint` (repo root) exit 0
- [ ] `cd apps/api && pnpm build` exits 0
- [ ] `grep -rn "c.text(message, 500)" apps/api/routes` returns no match
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code beyond what plans 001/002 explain.
- A template or tutorial in the repo creates a script whose name fails
  `isValidPackageName` (check:
  `grep -rn "name:" apps/api/scripts/check-templates.ts apps/web/components/tutorials | head -40`
  and the directory names under `apps/api/examples/*/`). Report the name; do
  not loosen the rule on your own.
- The web app or an e2e spec matches on an error text this plan changes
  (`grep -rn "Package not found\|Invalid request body\|Error exporting script" apps/web`).
- Changing `upstream.ts`'s import breaks `pnpm build`.

## Maintenance notes

- New routes: throw `badRequest` / `notFound`, end with
  `return errorResponse(c, error)`.
- Web clients loaded before the deploy only treat 500 as an error in three
  calls (fixed by plan 004); for them a new 404 on a missing script still ends
  as "not found" in the UI because the failed JSON parse rejects the query.
- Reviewer: check that user-facing import errors (`Error: <path>: …`) still
  reach the toast, and that a compile-service 400 message is still shown.
- Deferred: request body size limits and rate limiting on the compile route.
