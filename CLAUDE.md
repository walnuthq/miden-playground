# Area guides

Before working in one of these areas, read its file in `docs/claude/`. Their rules aren't loaded otherwise.

- Skills (`.claude/skills`, `.agents/skills`, `skills-lock.json`): `skills.md`.
- Bumping `@miden-sdk/*`: `upgrading-miden.md`, then `examples.md`, `script-templates.md`, `masm-highlighting.md`.
- Saved projects, resumable tutorials, `PlaygroundProjects`, network resets: `saved-projects.md`.
- Mainnet sandbox (`mm`), Bread Wallet, fees, network notes, built-in note scripts, note verification: `mainnet-sandbox.md`.
- Home-page examples, `compiled.json`, `pnpm examples:compile`: `examples.md`.
- Read-only procedures, the Invoke button: `read-only-procedures.md`.
- `apps/api/templates/*.rs`, `pnpm templates:check`: `script-templates.md`.
- `templates/project-template/Cargo.lock`, `pnpm lockfile:check`/`sync`, api-compile image bumps: `project-template-lockfile.md`.
- Script page (`/scripts/:id`): editor, console, diagnostics, tabs, shortcuts, its e2e specs: `script-editor.md`.
- Tutorial steps (`apps/web/components/tutorials`), adding a tutorial: `tutorial-copy.md`.
- Layout, responsive classes, dialogs, the app shell and its SDK-free entry, anything that renders on a phone: `phone-layout.md`.
- `packages/ui`, shadcn components, Base UI APIs (`render`, `Select`, dialogs), overlays: `ui-components.md`.
- `apps/api/lib/case.ts`, `apps/web/lib/utils/case.ts`, `storageSlotName`, the component namespace in `lib/toml.ts`: `case-helpers.md`.
- MASM tab highlighting, `pnpm masm:sync`: `masm-highlighting.md`.
- `apps/web/vite.config.ts` and its build plugins, Vite/Para/SDK bumps, testing the built app: `vite-build.md`.
- `apps/api/db/schema.ts` (every change ships with its migration), Drizzle migrations, `drizzle-kit` bumps: `database-migrations.md`.
- `.env*` files, `DATABASE_URL`, `.dev.vars`: `environment-variables.md`.
- Node scripts, `process.loadEnvFile`, `turbo.json`, `pnpm add`/`remove`, Node and `@types/node` bumps: `node-tooling.md`.

# Rules that bite outside their area

- Tutorial steps name buttons, tabs, files and the console, and say where they sit. After renaming or moving any of them, grep `apps/web/components/tutorials`: no test catches stale copy.
- The example and sandbox specs launch an example through `apps/api`: run it on port 3001 next to the web app on 3000, or "Launch example" never navigates.
- Below 768 px the app has a phone layout. After any layout change, run the `e2e/mobile` projects (`mobile-safari`, `mobile-chrome`, `mobile-small`) and keep each page from overflowing down to 320 px.
- The app shell paints before the SDK and its WASM load, so the entry's static module graph (`main.tsx`, `routes.tsx`, `AppShell` and the `*View` modules it renders) imports nothing from `@miden-sdk/*` or `@getpara/*`, not even through an app hook: `vite build` fails otherwise. `phone-layout.md` has the rules.
- `packages/ui/src/components` holds stock shadcn components: never edit them. Layout tweaks go in `className` at the call site, global styles in `packages/ui/src/styles/globals.css`.
- Use built-ins (`Object.groupBy`, with `lib` at `ES2024` in the api and web tsconfigs; `new Set`, `Object.fromEntries`, `crypto.randomUUID`), not `lodash` or `uuid`.
