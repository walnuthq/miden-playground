# Area guides

Before working in one of these areas, read its file in `docs/claude/`. Their rules aren't loaded otherwise.

| Working on                                                                                                  | Read                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Skills (`.claude/skills`, `.agents/skills`, `skills-lock.json`)                                             | `skills.md`                                                                             |
| Bumping `@miden-sdk/*`                                                                                      | `upgrading-miden.md`, then `examples.md`, `script-templates.md`, `masm-highlighting.md` |
| Saved projects, resumable tutorials, `PlaygroundProjects`, network resets                                   | `saved-projects.md`                                                                     |
| Mainnet sandbox (`mm`), Bread Wallet, fees, network notes, built-in note scripts, note verification         | `mainnet-sandbox.md`                                                                    |
| Home-page examples, `compiled.json`, `pnpm examples:compile`                                                | `examples.md`                                                                           |
| Read-only procedures, the Invoke button                                                                     | `read-only-procedures.md`                                                               |
| `apps/api/templates/*.rs`, `pnpm templates:check`                                                           | `script-templates.md`                                                                   |
| `templates/project-template/Cargo.lock`, `pnpm lockfile:check`/`sync`, api-compile image bumps              | `project-template-lockfile.md`                                                          |
| Script page (`/scripts/:id`): editor, console, diagnostics, tabs, shortcuts, its e2e specs                  | `script-editor.md`                                                                      |
| Tutorial steps (`apps/web/components/tutorials`), adding a tutorial                                         | `tutorial-copy.md`                                                                      |
| Layout, responsive classes, dialogs, the app shell and its SDK-free entry, anything that renders on a phone | `phone-layout.md`                                                                       |
| MASM tab highlighting, `pnpm masm:sync`                                                                     | `masm-highlighting.md`                                                                  |
| `apps/web/vite.config.ts` and its build plugins, Vite/Para/SDK bumps, testing the built app                 | `vite-build.md`                                                                         |
| `apps/api/db/schema.ts`, Drizzle migrations, `drizzle-kit` bumps                                            | `database-migrations.md`                                                                |
| `.env*` files, `DATABASE_URL`, `.dev.vars`                                                                  | `environment-variables.md`                                                              |

# UI changes and e2e specs

These bite in tasks that don't look like script-page or tutorial work.
- Tutorial steps name buttons, tabs, files and the console, and say where they sit. After renaming or moving any of them, grep `apps/web/components/tutorials`: no test catches stale copy.
- The script page's console header bar stays one text node, not a button: `getByRole("button", { name: "Compile" })` is a case-insensitive substring match, and a second match fails the specs.
- The Explorer tab and the `src/lib.rs` editor stay mounted when hidden (first in `monaco.editor.getEditors()`): scope e2e locators to the visible tab. Specs wait for a compile with `COMPILED` from `e2e/editor.ts`, not the console's text.
- Tutorials outside the list in `apps/web/lib/api.ts` (`createScript`) use the mock API, where compiling always succeeds. Run tutorials 6, 7 and 8 after changing the script page.
- The example and sandbox specs launch an example through `apps/api`: run it on port 3001 next to the web app on 3000, or "Launch example" never navigates.
- Below 768 px the app has a phone layout. After any layout change, run the `e2e/mobile` projects (`mobile-safari`, `mobile-chrome`, `mobile-small`) and keep each page from overflowing down to 320 px.
- The app shell (`AppShell`, the layout with every action disabled) paints before the SDK's chunks and WASM load, so the entry's static module graph (`main.tsx`, `routes.tsx`, the shell and the `*View` modules it renders) imports nothing from `@miden-sdk/*` or `@getpara/*`, not even through an app hook: `vite build` fails otherwise. A view needing the client gets a container (`header.tsx` around `header-view.tsx`). The rules are in `phone-layout.md`.

# Database schema

Every change to `apps/api/db/schema.ts` ships with its migration (`pnpm db:generate --name <what_it_does>` in `apps/api`), and a migration must work with the API that's already deployed. Read `docs/claude/database-migrations.md` first.

# Node and tooling

Node 26 (`engines.node`, `node-version` in the three deploy workflows), with `@types/node` on the same major. Node only runs tooling: the apps run on Workers and in the browser.
- TypeScript scripts run with plain `node` (built-in type stripping, no `tsx`), e.g. `apps/status-page/scripts/*.ts`. They need `.ts` extensions on relative imports and `import type` for types, and can't use enums, namespaces, parameter properties or tsconfig path aliases. `tsc --noEmit` stays the only type checker: Node strips types without checking them.
- Env files are loaded with `process.loadEnvFile` (no `dotenv`), behind an `existsSync` guard because it throws when the file is missing (CI has no `.env.local`). It never overwrites a variable that's already set, so load the most specific file first.
- In `turbo.json`, a `<package>#<task>` entry replaces the generic task instead of extending it: repeat what it needs, like `"inputs": ["$TURBO_DEFAULT$", ".env*"]`, or git-ignored `.env*.local` edits won't invalidate the cache.
- After `pnpm remove`, run `pnpm install --frozen-lockfile --force` if a build can't resolve a package the lockfile still lists: pnpm can prune a package directory that's still needed. To check a lockfile change the way CI does, run a clean frozen install and build in a temporary `git worktree`.
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
