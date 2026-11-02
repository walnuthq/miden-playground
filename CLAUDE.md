# Agent skills

Skills are installed per project with the `skills` CLI (`pnpm dlx skills ...`) and committed: `.claude/skills/`, `.agents/skills/` and `skills-lock.json`. Only personal settings (`.claude/settings.local.json`) are git-ignored, and Biome ignores the skill files and the lock.
- `.claude/skills/` is the only directory Claude Code loads project skills from. It is a real directory; don't replace it with a symlink to another repo.
- Miden SDK skills ship inside the `@miden-sdk/*` npm packages and are symlinked, not copied: `.claude/skills/<name>` → `.agents/skills/<name>` → `apps/web/node_modules/@miden-sdk/*/skills/<name>`. They follow the installed SDK version, so they break until `pnpm install` has run. After an SDK bump that adds or removes skills, re-sync:

  ```bash
  pnpm dlx skills experimental_sync -r --agent claude-code --include '@miden-sdk/*' -y
  ```

- Third-party skills are copied in and recorded in `skills-lock.json`. Example: `shadcn` and `migrate-radix-to-base` from `pnpm dlx skills add shadcn/ui --skill '*' --agent claude-code -y`.
- `tutorials-qa` is a hand-written local skill in `.claude/skills/tutorials-qa/`, with no upstream source; don't delete it.
- Install skills at project level with `--agent claude-code`, not globally (`-g`), unless asked.

# Upgrading the Miden packages

When bumping `@miden-sdk/*`, also update `CLIENT_VERSION` in `apps/web/lib/utils/store.ts` to the new version. It stamps the stores the tutorials seed from `defaultStore`, and the SDK refuses to import a store stamped by a client newer than the running one. Bump the `@miden-sdk/*` pins in `pnpm-workspace.yaml` `overrides` too, and regenerate the examples' compiled snapshots (see "Examples"). If the new version is younger than pnpm's minimum release age, exempt exactly that version of each package in `minimumReleaseAgeExclude`, and remove the entries once it ages out.

# Examples

The examples launched from the home page (`apps/web/lib/examples`) get their packages from `apps/api/examples/<dir>`. That is a copy of each upstream project's `miden-project.toml` and `src/lib.rs`, the only files the API reads, plus `compiled.json`, their initial compile output. `POST /scripts/examples/:exampleId` inserts those packages already compiled, without calling api-compile. Later edits recompile through `PATCH /scripts/:id` as usual.
- Edit the sources in place. They may drift from upstream on purpose (e.g. the counter's map key).
- Regenerate the snapshots with `pnpm examples:compile` in `apps/api`, with the local API (`pnpm dev`) and api-compile running. Do it after editing an example, and after bumping the SDK, the api-compile image or `templates/project-template`.
- `compiled.json` stores a hash of the sources. When they don't match, the API logs a warning and compiles live, so a forgotten regeneration after an edit is only slow. A compiler bump leaves the hash unchanged, though: regenerate by hand, or launching an example serves stale packages.
- Register a new example in `apps/api/examples/index.ts`, keyed by the web app's example id.

# Vite build (`apps/web`)

`apps/web` is a Vite SPA with React Router, served by a Cloudflare Worker (static assets with SPA fallback, plus the Simple Analytics proxy in `worker/`). Before changing `apps/web/vite.config.ts`, read the `vite-wasm-setup`, `frontend-pitfalls` (FP3, FP8, FP17, FP18) and `para-signer` ("Bundler setup") skills.
- `vite.config.ts` replicates the Miden and Para Vite plugins inline. Re-check it on every Para or SDK bump: the list of stubbed optional Para packages (a new optional connector fails to resolve; `@opentelemetry/context-zone` must stay stubbed or zone.js breaks the store's Dexie transactions), and the `@miden-sdk/react` externalization in dev pre-bundling (without it the signer providers can't see `MidenProvider`).
- The app imports the eager entries (`@miden-sdk/miden-sdk`, `@miden-sdk/react`), like its dependencies. Don't import `/lazy`: two entries mean two WASM instances (`WASM_CLASS_MISMATCH`).
- Keep `WasmWebClient.workerMode = "module"` in `apps/web/lib/miden-client.ts`: `auto` breaks the client on Safari (the comment there says why).
- `@miden-sdk/vite-plugin` is a devDependency only for the `vite-wasm-setup` skill it ships, and is not registered: it peers on Vite ≤ 6 and forces `resolve.preserveSymlinks`, which breaks pnpm. Bump it with the SDK, but look up its own latest version: it is versioned separately. Once it supports Vite 8 and drops `preserveSymlinks`, register it and remove its `peerDependencyRules` entry in `pnpm-workspace.yaml`.
- `paraVitePlugin` (`@miden-sdk/para-react/vite`) isn't registered either. Vite 8 isn't what blocks it: it stubs only 12 of the 21 packages in `stubPackages`. On a Para or `@miden-sdk/para-react` bump, compare its list (`dist/paraVitePlugin.mjs`) with ours. Once it covers all of them, including `@opentelemetry/context-zone`, register it and drop the local stub plugin and the `nodePolyfills` entry, which it also adds.
- Tailwind goes through `@tailwindcss/vite`, not PostCSS.
- Dev pre-bundling and the production build can diverge, and merging to `main` deploys. After a bump of Vite, Para or the SDK, test the built app: `vite build --mode development && wrangler dev --port 3000` in `apps/web` (port 3000 and the BETA Para key, which Para's production key would reject on localhost), then the e2e suite against it.

# Node and tooling

Node 26 (`engines.node`, `node-version` in the three deploy workflows), with `@types/node` on the same major. Node only runs tooling: the apps run on Workers and in the browser.
- TypeScript scripts run with plain `node` (built-in type stripping, no `tsx`), e.g. `apps/status-page/scripts/*.ts`. They need `.ts` extensions on relative imports and `import type` for types, and can't use enums, namespaces, parameter properties or tsconfig path aliases. `tsc --noEmit` stays the only type checker: Node strips types without checking them.
- Env files are loaded with `process.loadEnvFile` (no `dotenv`), behind an `existsSync` guard because it throws when the file is missing (CI has no `.env.local`). It never overwrites a variable that's already set, so load the most specific file first.
- In `turbo.json`, a `<package>#<task>` entry replaces the generic task instead of extending it: repeat what it needs, like `"inputs": ["$TURBO_DEFAULT$", ".env*"]`, or git-ignored `.env*.local` edits won't invalidate the cache.
- After `pnpm remove`, run `pnpm install --frozen-lockfile --force` if a build can't resolve a package the lockfile still lists: pnpm can prune a package directory that's still needed. To check a lockfile change the way CI does, run a clean frozen install and build in a temporary `git worktree`.

# Environment variables

Vite and Wrangler conventions: `.env` and `.env.[mode]` hold committed defaults, and `.env*.local` (git-ignored) holds personal overrides. The shell wins over both. Each app documents its variables in `.env.example`, and the README has the full table.
- `apps/api`: `DATABASE_URL` in the committed `.env` (the docker-compose database) is the one local database setting. drizzle-kit reads it, and so does `wrangler dev`, through `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=${DATABASE_URL}` in the same file, which overrides the Hyperdrive binding locally (there is no `localConnectionString` in `wrangler.jsonc`). Override it in `.env.local` or the shell. A remote `DATABASE_URL` exported in the shell (e.g. for `db:push`) also redirects a `wrangler dev` started from that shell. Production connects through the Hyperdrive `id` and never reads these files.
- Don't add a `.dev.vars` to `apps/api`: Wrangler ignores `.env` files when one exists. `apps/web/.dev.vars` exists on purpose, to keep the `VITE_*` files out of the Worker's local env.

# No lodash or uuid

Use built-ins (`Object.groupBy`, with `lib` at `ES2024` in the api and web tsconfigs; `new Set`, `Object.fromEntries`, `crypto.randomUUID`), not `lodash` or `uuid`.
- `apps/api/lib/case.ts` (`kebabCase`) and `apps/web/lib/utils/case.ts` (`snakeCase`) port lodash's word splitting, quirks included (`P2IDNote` → `p-2-id-note`). They build names the Miden compiler checks (the component namespace in `lib/toml.ts`, storage slot names in `storageSlotName`), so keep them identical to lodash and to each other. Don't swap them for a simpler regex.
- `kebabCase` in `apps/web/lib/utils` is a different helper, for script names and ids.

# UI components

`packages/ui/src/components` holds stock shadcn components (style `base-vega`, Base UI primitives, `cn` from the `cn` package). Keep them byte-identical to the CLI output so they can be refreshed with `pnpm dlx shadcn@latest add <name> --overwrite` (run in `packages/ui`); Biome ignores that directory on purpose. They need `@import "shadcn/tailwind.css"` in `globals.css` for their `data-*` custom variants.
- Never edit those files. Put layout tweaks in `className` at the call site, and anything global in `packages/ui/src/styles/globals.css`.
- No z-index overrides on overlays: Base UI portals popups to body in open order, so the stock `z-50` stacks correctly.
- Non-modal dialogs (`modal={false}`) also pass `disablePointerDismissal` to `Dialog` and `data-modal="false"` to `DialogContent`; a rule in `globals.css` hides their backdrop, which Base UI renders even for non-modal dialogs.
- Base UI APIs: `render={<X />}` instead of `asChild` (plus `nativeButton={false}` when `X` isn't a button), `Select` needs `items` for `SelectValue` to show labels, and `onValueChange` can receive `null`.
