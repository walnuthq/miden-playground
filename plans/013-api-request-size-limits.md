# Plan 013: The API bounds the size and count of what a request can send

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/api/index.ts apps/api/lib/validation.ts apps/api/lib/import.ts apps/api/routes/scripts.ts apps/api/routes/verified.ts`
> If any changed, compare the "Current state" excerpts against the live code
> before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (a limit set too low rejects legitimate projects)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

`apps/api` is public and has no accounts. Its request validation checks
types, not sizes: one `POST /scripts/import` can carry any number of packages
of any size, and each one becomes a database row and a build on the compile
service, which builds one package at a time and answers 503 when its queue is
full. A single request can therefore block compiles for every user and fill
the database. This plan caps the body size, the number of packages or ids per
request and the length of each source. It does not add rate limiting (plan
027).

## Current state

All paths under `apps/api/`. Hono 4.13 on Cloudflare Workers.

- `index.ts:23-34` — the middleware chain:

  ```ts
  const app = createApp()
    .use(contextStorage())
    .use(
      cors({
        origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      }),
    )
    .route("/", root)
    .route("/scripts", scripts)
    .route("/", verified);
  ```

- `lib/validation.ts:10-20`:

  ```ts
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

- `routes/scripts.ts:133-150` (`POST /scripts/import`):

  ```ts
  if (
    typeof packageSources !== "object" ||
    packageSources === null ||
    !Object.values(packageSources).every(isPackageSource)
  ) {
    throw invalidBody();
  }
  const packages = await importScriptsFromPackageSources(
    packageSources,
    c.req.raw.signal,
  );
  ```

- `routes/scripts.ts:191-218` (`PATCH /scripts/:id`, the compile):

  ```ts
  const source = files?.["src/lib.rs"];
  if (typeof source !== "string") {
    throw invalidBody();
  }
  if (
    !isStringArray(dependencies) ||
    !dependencies.every(
      (dependency) =>
        isValidUUIDv4(dependency) ||
        Object.hasOwn(defaultDependenciesRecords, dependency),
    )
  ) {
    throw badRequest("Error: Invalid dependencies.");
  }
  ```

- `routes/verified.ts:89-100` (`POST /verified-account-components/:network`):

  ```ts
  if (typeof accountId !== "string" || accountId === "") {
    throw invalidBody();
  }
  if (packageSource !== undefined && !isPackageSource(packageSource)) {
    throw invalidBody();
  }
  if (
    packageIds !== undefined &&
    (!isStringArray(packageIds) || !packageIds.every(isValidUUIDv4))
  ) {
    throw invalidBody();
  }
  ```

  Each `packageIds` entry triggers one registry verification, in turn
  (`verified.ts:129-146`).

- `routes/verified.ts:165-176` (`POST /verified-notes/:network`):

  ```ts
  if (typeof noteId !== "string" || noteId === "") {
    throw invalidBody();
  }
  if (packageSource !== undefined && !isPackageSource(packageSource)) {
    throw invalidBody();
  }
  if (
    dependencies !== undefined &&
    (!Array.isArray(dependencies) || !dependencies.every(isPackageSource))
  ) {
    throw invalidBody();
  }
  ```

- `lib/import.ts:50-53`:

  ```ts
  const example = examples[exampleId];
  if (!example) {
    throw notFound("Error: Example not found.");
  }
  ```

  `examples` is a plain object (`examples/index.ts:46`), so an inherited
  property name such as `constructor` passes the guard and fails later with
  a 500.

- Errors: `lib/errors.ts` has `badRequest(message)` / `notFound(message)`
  (`HttpError`, status `400 | 404`), and routes use
  `const invalidBody = () => badRequest("Error: Invalid request body.");`
  and `return errorResponse(c, error);` in their `catch`. Messages are plain
  text starting with `Error: `.
- Tests: `lib/validation.test.ts` (`node:test`, relative imports with `.ts`,
  table-style loops). Run with `cd apps/api && pnpm test`
  (`node --test 'lib/**/*.test.ts'`). Routes have no tests: the Hono app
  needs a database and Wrangler's text-module rules to load.
- The largest legitimate import known: the `miden-bank` example, 4 packages.
  The web app's own form limits package names to 64 characters.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Unit tests    | `cd apps/api && pnpm test`                             | exit 0, `fail 0`    |
| Typecheck     | `cd apps/api && pnpm typecheck`                        | exit 0              |
| Build         | `cd apps/api && pnpm build`                            | exit 0 (dry-run)    |
| Lint + format | `cd apps/api && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**: `apps/api/index.ts`, `lib/validation.ts`,
`lib/validation.test.ts`, `lib/import.ts`, `routes/scripts.ts`,
`routes/verified.ts`.

**Out of scope** (do NOT touch):

- Rate limiting and `wrangler.jsonc` (plan 027).
- `apps/api/db/**`, `lib/upstream.ts`, `lib/errors.ts`.
- Who may update or delete a script: deferred by the maintainer (plan 006).
- `apps/web/**`: the web app already shows the text of any non-OK response.

## Git workflow

- Branch: `fix/api-request-limits` from `main`.
- Conventional commit, e.g. `fix(api): bound request sizes`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Limits and validators, with tests

In `lib/validation.ts`, add (exported):

```ts
// What a request may carry. Generous for real projects (the largest example
// has 4 packages), small enough that one request can't queue hours of builds
// or store megabytes.
export const MAX_PACKAGES = 16;
export const MAX_SOURCE_LENGTH = 512_000;
export const MAX_MANIFEST_LENGTH = 16_384;
export const MAX_ID_LENGTH = 128;
// The whole body, in bytes: MAX_PACKAGES sources don't all reach their limit.
export const MAX_BODY_SIZE = 2 * 1024 * 1024;

export const isSource = (value: unknown): value is string =>
  typeof value === "string" && value.length <= MAX_SOURCE_LENGTH;

// An account or note id, as the registry takes it: its format is the
// registry's to check, its length is bounded here.
export const isId = (value: unknown): value is string =>
  typeof value === "string" && value !== "" && value.length <= MAX_ID_LENGTH;

export const isBoundedArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length <= MAX_PACKAGES;
```

Change `isPackageSource` so `rust` must satisfy `isSource` and
`midenProjectToml` must be a string of at most `MAX_MANIFEST_LENGTH`
characters. Add:

```ts
// The packages of an import, keyed by directory.
export const isPackageSources = (
  value: unknown,
): value is Record<string, { midenProjectToml: string; rust: string }> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length <= MAX_PACKAGES &&
  Object.keys(value).every((key) => key.length <= MAX_ID_LENGTH) &&
  Object.values(value).every(isPackageSource);
```

In `lib/validation.test.ts`, add tests in the file's style: `isSource` at
the limit and one over; `isId` (`""`, a 128-character string, 129, a
number); `isBoundedArray` (16 items, 17, not an array); `isPackageSource`
with an over-long `rust` and an over-long `midenProjectToml`;
`isPackageSources` (`null`, an array, 16 entries, 17 entries, an over-long
key, one invalid entry).

**Verify**: `cd apps/api && pnpm test` → exit 0 with the new tests.

### Step 2: Apply them in the routes

- `routes/scripts.ts`, `/import`: replace the three-line condition with
  `if (!isPackageSources(packageSources)) { throw invalidBody(); }`.
- `routes/scripts.ts`, `PATCH /:id`: `typeof source !== "string"` →
  `!isSource(source)`; add `!isBoundedArray(dependencies) ||` in front of
  `!isStringArray(dependencies)`.
- `routes/verified.ts`, account components:
  `typeof accountId !== "string" || accountId === ""` → `!isId(accountId)`;
  add `!isBoundedArray(packageIds) ||` in front of
  `!isStringArray(packageIds)`.
- `routes/verified.ts`, notes: `noteId` → `!isId(noteId)`;
  `!Array.isArray(dependencies)` → `!isBoundedArray(dependencies)`.

Update the imports from `@/lib/validation`.

**Verify**: `cd apps/api && pnpm typecheck` → exit 0.

### Step 3: `Object.hasOwn` for examples

In `lib/import.ts`, replace

```ts
const example = examples[exampleId];
if (!example) {
```

with

```ts
const example = Object.hasOwn(examples, exampleId)
  ? examples[exampleId]
  : undefined;
if (!example) {
```

**Verify**: `cd apps/api && pnpm typecheck` → exit 0.

### Step 4: Body size limit

In `index.ts`, import `bodyLimit` from `"hono/body-limit"` and
`MAX_BODY_SIZE` from `@/lib/validation`, and add after the `cors` middleware:

```ts
.use(
  bodyLimit({
    maxSize: MAX_BODY_SIZE,
    onError: (c) => c.text("Error: Request body too large.", 413),
  }),
)
```

**Verify**: `ls apps/api/node_modules/hono/dist/middleware/body-limit` →
exists. `cd apps/api && pnpm typecheck` → exit 0; `pnpm build` → exit 0.

### Step 5: Format and check

**Verify**: `cd apps/api && pnpm exec biome check --write index.ts lib routes`
→ exit 0; `pnpm test` → exit 0; `pnpm typecheck` → exit 0; from the repo
root `pnpm lint` → exit 0.

If you can run the API locally (`docker compose -f apps/api/docker-compose.yml up -d`,
then `cd apps/api && pnpm dev`), also check:

```sh
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3001/scripts/import \
  -H 'Content-Type: application/json' \
  -d "{\"packageSources\":{$(for i in $(seq 1 17); do printf '"p%s":{"midenProjectToml":"","rust":""},' $i; done | sed 's/,$//')}}"
```

→ `400`. Say in your report whether you ran it.

## Test plan

- Unit: the `validation.test.ts` cases of step 1.
- E2E (operator, local: web :3000 + api :3001):
  `cd apps/web && pnpm test:e2e e2e/example-*.spec.ts e2e/script-*.spec.ts`
  (imports the 4-package bank example, compiles scripts). Report plainly if
  you could not run them.

## Done criteria

- [ ] `cd apps/api && pnpm test` exits 0 with the new cases
- [ ] `cd apps/api && pnpm typecheck` and `pnpm build` exit 0
- [ ] `grep -n "bodyLimit" apps/api/index.ts` → 2 matches (import and use)
- [ ] `grep -n "Object.hasOwn(examples" apps/api/lib/import.ts` → 1 match
- [ ] `grep -n "isPackageSources" apps/api/routes/scripts.ts` → at least 2 matches
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code.
- `hono/body-limit` is missing from the installed Hono.
- A committed example or template is larger than a limit (check with
  `wc -c apps/api/examples/*/*/src/lib.rs apps/api/templates/*.rs | sort -n | tail -3`:
  the largest must be well under 512,000 bytes; if not, report instead of
  raising the limit yourself).
- An e2e import or compile starts answering 400 or 413.

## Maintenance notes

- The limits are constants in `lib/validation.ts`: raise them there when a
  real project needs it. They are a first guess, not measured from
  production traffic.
- `MAX_BODY_SIZE` only stops bodies that declare or exceed their size at the
  API; Cloudflare's own request limit (100 MB on the free plan) is far above
  it.
- Plan 027 adds the per-client rate limit this plan leaves out.
- A route added later must validate with these helpers: nothing enforces it
  centrally.
