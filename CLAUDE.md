# Area guides

Before working in one of these areas, read its file in `docs/claude/`. Their rules aren't loaded otherwise.

- Skills (`.claude/skills`, `.agents/skills`, `skills-lock.json`): `skills.md`.
- Bumping `@miden-sdk/*`: `upgrading-miden.md`, then `examples.md`, `script-templates.md`, `masm-highlighting.md`.
- Saved projects, the Projects submenu, resumable tutorials, `PlaygroundProjects`, network resets: `saved-projects.md`.
- Mainnet sandbox (`mm`), Bread Wallet, fees, network notes, built-in note scripts, note verification: `mainnet-sandbox.md`.
- MockChain sandbox (`mmck`), `lib/mock-chain.ts`, the mock client as the app's client, its saved chain: `mockchain-sandbox.md`.
- Home-page examples, `compiled.json`, `pnpm examples:compile`: `examples.md`.
- Read-only procedures, the Invoke button: `read-only-procedures.md`.
- `apps/api/templates/*.rs`, `pnpm templates:check`/`sync`, the package embedded in `apps/web/lib/tutorials/basic-wallet.json`, note scripts and the wallets that can consume them: `script-templates.md`.
- `templates/project-template/Cargo.lock`, `pnpm lockfile:check`/`sync`, api-compile image bumps: `project-template-lockfile.md`.
- Script page (`/scripts/:id`): editor, console, diagnostics, tabs, shortcuts, its e2e specs, script owners (the owner token), shared links and forks: `script-editor.md`.
- The console's Simulate tab, `lib/simulation`, the mock client, `components/procedures`, storage slot values: `simulation.md`.
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
- Analytics events are an allowlist of names and fields in `apps/web/lib/analytics-events.ts`, shared by the app and the Worker's `/ingest`. Analytics Engine's columns are positional: append a field, never reorder or reuse one. An event never carries a script name, an id, an address or an error text. `spec/analytics-trial.md` and `spec/product-analytics-events.md` have the rest.
- The MockChain sandbox (`mmck`) has no node, prover, faucet, registry or wallet, and its client is a mock one. Outside its area this bites three ways: a new path that submits a transaction must prove a block and sync after it (`proveMockBlock`), or the transaction stays pending; an address the app shows or stores comes from `accountAddress` (`lib/web-client.ts`), not the React SDK's `normalizeAccountId`, which prints a MockChain account as a testnet one; and nothing may ask the chain for an account it doesn't hold or build an `RpcClient` there. `mockchain-sandbox.md` has the rest.
- In an e2e spec, after a switch to another network wait for the header badge to name it (`MockChain | #N`), not for a block number alone: the previous network's badge has one too, and against production the switch is slow enough for a click to land on the old page.
- Use built-ins (`Object.groupBy`, with `lib` at `ES2024` in the api and web tsconfigs; `new Set`, `Object.fromEntries`, `crypto.randomUUID`), not `lodash` or `uuid`.
