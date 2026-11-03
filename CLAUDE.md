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

When bumping `@miden-sdk/*`, also update `CLIENT_VERSION` in `apps/web/lib/utils/store.ts` to the new version. It stamps the stores the tutorials seed from `defaultStore`, and the SDK refuses to import a store stamped by a client newer than the running one. Bump the `@miden-sdk/*` pins in `pnpm-workspace.yaml` `overrides` too, regenerate the examples' compiled snapshots (see "Examples"), and check that the script templates still compile (see "Script templates"). Then run `pnpm masm:sync` in `apps/web` (see "MASM highlighting"). If the new version is younger than pnpm's minimum release age, exempt exactly that version of each package in `minimumReleaseAgeExclude`, and remove the entries once it ages out.

# Saved projects and resumable tutorials

A saved project is the app state (`stateSerializer`) plus the client store as `exportStore()` dumps it, secret keys included (`apps/web/lib/utils/project.ts`, `hooks/use-projects.ts`). Leaving a tutorial saves it, and starting it again resumes it (`hooks/use-tutorials.ts`). Its step shows from `State.tutorialProgress`, without reading the snapshots.
- Snapshots go in their own IndexedDB database, `PlaygroundProjects`. Never put "miden" in its name, in any case: `clearMidenStorage()`, which runs before every store import, deletes every database whose name contains it.
- `leaveTutorial()` exports the current store, so call it before `switchNetwork`.
- Snapshots carry the client version that wrote them. An SDK bump migrates them on import, but a rollback makes the SDK refuse them. `popState` then starts the tutorial over from `fallbackState`.
- A testnet reset invalidates them: `isRestorable` compares their genesis header with `genesisBlockHeader` in `lib/utils/store.ts`, so update that header with the reset.

# Examples

The examples launched from the home page (`apps/web/lib/examples`) get their packages from `apps/api/examples/<dir>`. That is a copy of each upstream project's `miden-project.toml` and `src/lib.rs`, the only files the API reads, plus `compiled.json`, their initial compile output. `POST /scripts/examples/:exampleId` inserts those packages already compiled, without calling api-compile. Later edits recompile through `PATCH /scripts/:id` as usual.
- Edit the sources in place. They may drift from upstream on purpose (e.g. the counter's map key).
- Regenerate the snapshots with `pnpm examples:compile` in `apps/api`, with the local API (`pnpm dev`) and api-compile running. The local api-compile image must match production's, since its output ships as is. Do it after editing an example, and after bumping the SDK, the api-compile image or `templates/project-template`.
- The snapshots are bundled into the API Worker: each note's masp is ~560 KB of base64 (it embeds its dependencies). The two examples bring the upload to ~840 KiB gzipped, so watch the Worker size limit when adding examples.
- `compiled.json` also holds each package's MASM (the MASM tab of a launched example's scripts).
- `compiled.json` stores a hash of the sources. When they don't match, the API logs a warning and compiles live, so a forgotten regeneration after an edit is only slow. A compiler bump leaves the hash unchanged, though: regenerate by hand, or launching an example serves stale packages.
- Register a new example in `apps/api/examples/index.ts`, keyed by the web app's example id. Its `compiled.json` import needs the `as unknown as CompiledExample` cast: real manifests have structured signature params, which the `ProcedureSignature.params: string[]` type doesn't model.

# Script templates

The "Create script" dialog creates scripts from `apps/api/templates/*.rs` (`lib/templates.ts`): each type with no example, and each example of the web app's `scriptExamples` (`apps/web/lib/types/script.ts`). Every one must compile. `pnpm templates:check` in `apps/api` creates and compiles each through the local API (`pnpm dev`, with api-compile running), then deletes them. Run it after editing a template, and after bumping the SDK, the api-compile image or `templates/project-template`: SDK API changes break templates silently (0.15 replaced `Asset.key: Word` with `Asset.id: AssetId`).
- The counter note and counter script examples import `counter_account` but come without it: tutorial 11 teaches adding the user's own `counter-account` script as a dependency. The check does the same (`userDependencies`), so keep it in sync when an example gains such a dependency.

# Project template lockfile

Every package the API creates starts from `apps/api/templates/project-template/Cargo.lock`, and api-compile builds `--offline` against the crates its image warmed from its own examples' lockfiles (miden-source-code-verification, `apps/api-compile/examples`). They must pin the same registry crates: when they drift (a `cargo update` there), each build downloads and rebuilds the crates that differ, which took 176 s on production, and the container loses them when it sleeps after 5 idle minutes.
- `pnpm lockfile:check` in `apps/api` compares the template with api-compile's `GET /lockfile` (`API_COMPILE_URL`, default the local one); `pnpm lockfile:sync` rewrites the template. `templates:check` runs the check first. Run it after any lockfile change in api-compile, and after bumping the SDK or the api-compile image.
- The API sends `warmLockfile: true` to `POST /compile`: a stale lockfile (the template's, or one stored with a package, which api-compile returns and the API sends back on the next compile) is re-resolved offline against the cache instead, and the updated one comes back and is stored. `/verify` never re-resolves: it must build the exact lockfile it gets.

# Script editor (`/scripts/:id`)

`spec/editor-console-improvements.md` is the roadmap for the editor and console (15 scored items). Its status line says what's done and what's next; mark items done there, with their PR, as they ship.
- Compile errors come as rustc's rendered text in `script.error`, parsed by `apps/web/lib/utils/diagnostics.ts` into Monaco markers and console links. cargo's JSON isn't available: midenc consumes it and keeps only the `.wasm` artifacts. When the compiler or api-compile changes its output, re-capture the fixtures in `lib/utils/fixtures/compile-errors/` and run `pnpm test` in apps/web (`node:test`, plain node).
- The console hides the build noise around the diagnostics (`cleanCompilerOutput` in `lib/utils/compiler-output.ts`, display only; "Show full output" shows the raw text). Its rules match cargo's and api-compile's exact lines: update them with the fixtures.
- The API doesn't store `error` or `warnings` (a successful build's stderr): a script fetched from it has neither, so guard with `script.error ?? ""`.
- The console log (`lib/console-log.ts`) is in memory, per script id: not in `State`, so not persisted or saved with projects. e2e specs wait for a compile with `COMPILED` from `e2e/editor.ts`, not the console's text.
- The console's header bar repeats the latest log line. Keep it one text node (`[time] text`) and not a button: the specs' anchored regexes (`/^Compiled …/`) and `getByRole("button", { name: "Compile" })` (a case-insensitive substring) would match it too, and fail on two elements. For the same reason, the empty log's placeholder shows in the bar only.
- The Compile button sits in the tabs row, above the editor (`hooks/use-compile-script.ts`), not in the console. Tutorial steps say where it is (`deploy-a-counter-contract/step2.tsx`, `timelock-p2id-note/step3.tsx`): update them when it moves.
- Tutorials outside the list in `apps/web/lib/api.ts` (`createScript`) use `lib/mock-api.ts`: script ids aren't UUIDs, and compiling never reaches the API or api-compile. It always succeeds, with no error text. Run tutorials 6, 7 and 8 after changing the script page.
- The page's tabs are Explorer, MASM and Manifest. The Explorer lists the script's files (`script.files`: `src/lib.rs`, `Cargo.toml`, `miden-project.toml`) and opens them as editor tabs, `src/lib.rs` only at first. Only `src/lib.rs` is edited: the API generates the manifests, which show read-only (Monaco language `ini`: there's no TOML). Built-in and mock API scripts have `src/lib.rs` only, MASM-only built-ins no file. Read a script's source with `scriptSource` (`lib/utils/script-files.ts`): `files` replaced `script.rust`, in the API (`packages.rust` was dropped by `pnpm db:migrate-drop-rust`) and in persisted state (`migrateScript`).
- Adding or removing a dependency patches `miden-project.toml` locally (`filesWithDependency`, in the API generator's format); the next compile replaces it with the API's. Keep the patch in step with `generateMidenProjectToml` in `apps/api/lib/toml.ts`.
- The Explorer tab stays mounted on the other tabs (`keepMounted`), and so does the `src/lib.rs` editor while another file shows or its tab is closed: the hidden editor stays in the DOM and in `monaco.editor.getEditors()` (it's the first one). Scope e2e locators to the visible tab. The console shows on every tab of an editable script, and its links open `src/lib.rs` in the Explorer.
- `script.masm` is the MASM tab's content. A compiled Rust script gets it from api-compile (`masm: true` in `POST /compile`), stored in `packages.masm`; it's cleared by an edit or a failed compile. That MASM is for reading: it calls library procedures without including them, so it doesn't reassemble. Scripts without a package (the built-in ones, the mock API's) are assembled from their `masm` instead: branch on `assembledFromMasm` (`lib/utils/script.ts`), never on `masm` alone.

# MASM highlighting

The MASM tab's Monaco language (`apps/web/lib/masm/language.ts`, a Monarch tokenizer) takes its keywords, types and instructions from `lib/masm/vocabulary.json`, which `pnpm masm:sync` in `apps/web` extracts from the assembler's own sources in 0xMiden/miden-vm (`lib/masm/vocabulary.ts`), at the tag of the `miden-assembly-syntax` in `apps/api/templates/project-template/Cargo.lock`. `pnpm masm:check` fails when the file is out of date.
- Don't switch to the VS Code extension's TextMate grammar (no instructions: VS Code colors MASM with miden-lsp's semantic tokens) or tree-sitter-masm (behind the syntax, and miden-lsp is dropping it for `miden-assembly-syntax-cst`).
- The sync fails when the upstream tables change shape (`checkVocabulary`): update the patterns in `vocabulary.ts` and their unit tests.
- The tokenizer uses token types the built-in `vs-dark` and `light` themes color, so no custom theme changes the Rust editor. `e2e/script-masm.spec.ts` pins the token types.

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
