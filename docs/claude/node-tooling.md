# Node and tooling

Node 26 (`engines.node`, `node-version` in the three deploy workflows), with `@types/node` on the same major. Node only runs tooling: the apps run on Workers and in the browser.
- TypeScript scripts run with plain `node` (built-in type stripping, no `tsx`), e.g. `apps/status-page/scripts/*.ts`. They need `.ts` extensions on relative imports and `import type` for types, and can't use enums, namespaces, parameter properties or tsconfig path aliases. `tsc --noEmit` stays the only type checker: Node strips types without checking them.
- Env files are loaded with `process.loadEnvFile` (no `dotenv`), behind an `existsSync` guard because it throws when the file is missing (CI has no `.env.local`). It never overwrites a variable that's already set, so load the most specific file first. `environment-variables.md` says which file holds what.
- In `turbo.json`, a `<package>#<task>` entry replaces the generic task instead of extending it: repeat what it needs, like `"inputs": ["$TURBO_DEFAULT$", ".env*"]`, or git-ignored `.env*.local` edits won't invalidate the cache.
- After `pnpm remove`, run `pnpm install --frozen-lockfile --force` if a build can't resolve a package the lockfile still lists: pnpm can prune a package directory that's still needed. To check a lockfile change the way CI does, run a clean frozen install and build in a temporary `git worktree`.
