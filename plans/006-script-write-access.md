# Plan 006: Only a script's owner can change or delete it (DEFERRED)

> **Executor instructions**: Do NOT execute this plan. It records a finding
> and a decision. The maintainer decided on 2026-11-10 that this will be
> handled later, when the playground introduces an **owner token**: scripts
> will be tied to the user's wallet address. Until that work is designed, there
> is nothing to implement. If you were dispatched on this file, stop and
> report that it is deferred.

## Status

- **Priority**: P2
- **Effort**: L (once designed)
- **Risk**: MED
- **Depends on**: the owner-token feature (not designed yet)
- **Category**: security
- **Planned at**: commit `301e950`, 2026-11-10
- **State**: DEFERRED by maintainer decision

## Why this matters

A script's id is the only thing needed to change it. The API
(`apps/api/routes/scripts.ts`) has no notion of an owner, so anyone who has a
script's id can recompile it with different source (`PATCH /scripts/:id`,
which overwrites the stored files) or delete it (`DELETE /scripts/:id`). The
web app shares scripts by that same id: `/scripts/:id` opens another user's
script (`apps/web/hooks/use-script.ts`: "fetched from the API when it isn't
there (another user's, a shared link)"), and the page shows the Compile
button for it. Sharing a link therefore hands out write access.

## Current state

- `apps/api/routes/scripts.ts:172-204` — the `PATCH /:id` and `DELETE /:id`
  handlers act on any id, with no check of who is asking.
- `apps/api/db/schema.ts:33` — the `packages` table has a `read_only` boolean
  column (default `false`). No route reads it to refuse a write.
- `apps/api/index.ts` — CORS restricts browser origins; it is not access
  control.
- Verification by package id (`apps/api/routes/verified.ts`) submits the
  stored files of a package, so an overwritten script changes what gets
  verified under that id.

## Decision

Handled later, with the owner token: a script will be tied to the wallet
address of the user who created it, and the API will refuse changes from
anyone else. No interim mitigation was requested.

## Notes for the future design

Questions the owner-token design has to answer for scripts (none are decided):

- How the API authenticates a wallet address (a signed challenge, a session
  token derived from one), and how long it lasts.
- Scripts created without a connected wallet: tutorials 1-2 and 6-7 create and
  compile scripts with no wallet at all.
- Existing rows, which have no owner.
- What opening someone else's script does: read-only view, or a copy the
  visitor owns ("fork on open").
- Tooling that calls the API without a wallet: `apps/api/scripts/check-templates.ts`
  creates, compiles and deletes scripts.
- A schema change ships with its Drizzle migration, and the old Worker keeps
  serving during a deploy, so the migration must stay compatible with it.

## Maintenance notes

- When the owner-token work starts, replace this file with a real plan (or
  mark it superseded in `plans/README.md`).
- Plan 003 validates input on these routes but adds no ownership check.
