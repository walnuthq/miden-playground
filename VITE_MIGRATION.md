# Migrating `apps/web` from Next.js to Vite

Status: step 1 done (#707, merged as `cdf88c8`, deployed and checked on production 2026-10-26). Step 2 done (#708, merged as `fd0da7a`, deployed and checked on production 2026-10-26). Step 3 done (#709, merged as `6e16862`; its trailing-slash redirect broke starting tutorials and was fixed by #712, merged as `9d795a3`; deployed and checked on production 2026-10-27: full e2e suite, Para PROD login, analytics proxy). Step 4 done except the R2 bucket deletion (see its outcomes); "Optional, later" items still open. First audit 2026-10-26 on `main` at `02ce1e6`; re-audit 2026-10-26 on `main` at `4d134d3` (deps update #706: the inventory below still holds, the corrections are folded into the steps and listed in "Re-audit changes" at the end). The re-audit's three open decisions (vite-plugin for its skill only, `@tailwindcss/vite`, `workerMode = "module"`) were confirmed on 2026-10-26 and are in the table below.

This is the brief for an implementing agent. Implement it in the PR order below, **one PR per step**, plan mode first for each. Every step lists its context, exact files, decisions already taken and how to verify. Re-check the facts marked _(verify)_ when you start a step, the tree may have moved.

## Why

The Miden SDK skills and tooling target Vite (`@miden-sdk/vite-plugin`, `@miden-sdk/para-react/vite`, the shipped example wallet), and `apps/web` uses none of the features that would justify Next.js: it is a client-side SPA. Every component is `"use client"` or a thin page wrapper, the 3 API routes are mocks, and the only server-side pieces are config plugins (webpack aliases, MDX, Simple Analytics rewrites) and the OpenNext Worker.

## Decisions taken

| Topic                     | Decision                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundler                   | Vite 8 (`vite@8.3.5`, `@vitejs/plugin-react@6.1.2`), same versions as `apps/status-page`.                                                                                                         |
| Miden / Para Vite plugins | Config replicated inline in `vite.config.ts` (3.2). `@miden-sdk/vite-plugin` is still installed in step 3 as a devDependency, **not registered**, for the `vite-wasm-setup` skill it ships (3.1). |
| Tailwind                  | `@tailwindcss/vite` replaces PostCSS in `apps/web`, like `apps/status-page` (which already consumes the shared `globals.css` that way).                                                           |
| SDK worker                | Keep `WasmWebClient.workerMode = "module"` (`lib/miden-client.ts`) for the cutover; try `auto` in step 4 with a Safari test (3.2).                                                                |
| Router                    | **React Router v8** (`react-router@8.5.0`), **data mode**: `createBrowserRouter` + `RouterProvider`, components only, no loaders/actions. Not framework mode (no SSR, no file routes).            |
| API mocks                 | Replaced by local async helpers that wait **1 s** and return static payloads. No network mocking.                                                                                                 |
| MDX                       | Removed. Each `stepN.mdx` becomes JSX inlined into its sibling `stepN.tsx`.                                                                                                                       |
| Theme                     | **Keep `next-themes`** (framework-agnostic, see step 3).                                                                                                                                          |
| Analytics                 | Simple Analytics plain script + a small `trackEvent` helper, **proxied through our domain by a Cloudflare Worker** (`/proxy.js`, `/simple/*`, `/auto-events.js`).                                 |
| Hosting                   | Cloudflare Workers static assets (SPA fallback) + that Worker, replacing OpenNext. Same Worker name, routes and domains.                                                                          |

## Inventory (what exists today)

| Area               | Size                                                                                                                                                                                                                | Where                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Pages              | 12 pages under one route group layout `app/(home)/layout.tsx`, root `app/layout.tsx`                                                                                                                                | `app/`                                                                                 |
| API routes         | `GET /api` (env debug), `POST /api/scripts`, `PATCH`/`DELETE /api/scripts/[id]`                                                                                                                                     | `app/api/`                                                                             |
| `next/navigation`  | 30 files: `router.push` ×20, `usePathname` ×19, `useSearchParams` ×4, `notFound()` ×1                                                                                                                               | listed in step 3                                                                       |
| `next/link`        | 12 files                                                                                                                                                                                                            | listed in step 3                                                                       |
| `next/image`       | 4 uses                                                                                                                                                                                                              | `components/home/index.tsx`, `components/lib/wallet-button.tsx`, 2 MDX files           |
| `next/font/google` | Geist, Geist Mono (`--font-sans`, `--font-mono`)                                                                                                                                                                    | `app/layout.tsx`                                                                       |
| Metadata / OG      | Home page only                                                                                                                                                                                                      | `app/(home)/page.tsx`                                                                  |
| MDX                | 73 files, ~1,035 lines                                                                                                                                                                                              | `components/tutorials/*/stepN.mdx`                                                     |
| Env vars           | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_REGISTRY_URL`, `NEXT_PUBLIC_GUARDIAN_ENDPOINT_URL`, `NEXT_PUBLIC_PARA_API_KEY`, `NEXT_PUBLIC_PARA_ENVIRONMENT`, `NEXT_PUBLIC_MIDEN_FEE_AMOUNT`, `SIMPLE_ANALYTICS_HOSTNAME` | `lib/constants.ts`, `lib/miden-faucet.ts`, `components/providers/para-provider.tsx`    |
| `"use client"`     | 58 files in the app                                                                                                                                                                                                 |                                                                                        |
| Deploy             | OpenNext → Worker `miden-playground`, R2 incremental cache                                                                                                                                                          | `wrangler.jsonc`, `open-next.config.ts`, `.github/workflows/deploy-web-cloudflare.yml` |

## PR order

1. **Mock API → local helpers** (still on Next).
2. **MDX → TSX** (still on Next).
3. **Vite + React Router v8 + Worker cutover** (the framework switch; build and deploy must change together because the deploy workflow runs on every push to `main`).
4. **Post-cutover cleanup** (docs, optional alias removal, R2 bucket, memory).

Steps 1 and 2 are framework-independent and shrink step 3 to plumbing. Each PR must pass `pnpm lint` and `pnpm typecheck` at the root, and the verification listed in the step.

Gotchas met in step 1, likely again later:
- Biome also formats Markdown: after editing this file, run `pnpm format` (or `pnpm exec biome check --write VITE_MIGRATION.md`) or `pnpm lint` fails.
- Deleting Next routes leaves stale `apps/web/.next/types/**` that break `pnpm typecheck` (`next typegen` doesn't prune them): `rm -rf apps/web/.next/types`.
- The first e2e run on a freshly started `next dev` can time out while routes compile on demand. Load the page once (or rerun) before reading a failure as a regression.
- The Bread-based specs (tutorials 3, 4, 5, 8, 9, 11) can fail in `bread.fund()` ("Bread's USDCX balance stays empty"), the known Bread faucet issue, before reaching any Playground code. Cover the Playground part with an ad hoc spec that skips the Bread fixture.

Gotchas met in step 2:
- Biome lints `<img>` (`lint/performance/noImgElement`, a Next.js-domain rule) as a warning in the two converted steps. It turns off with `next` in step 3; don't suppress it.
- Step screenshots seeded without a store: 6 steps used to throw on `main` (unguarded `props.counter.identifier` / `props.walletA.identifier`) and now render with `?.`. They have no `main` baseline.

Gotchas met in step 3:
- `apps/api` is a plain Worker, but local checkouts keep stale `apps/api/.next/` and `next-env.d.ts` from an older setup. Removing the Next entries from the root `.gitignore` makes Biome lint them (thousands of errors), so they stay until step 4 (delete the leftovers first).
- `vite.config.ts` can't use `vite-env.d.ts`'s types: it's typechecked by `tsconfig.node.json` (with `e2e/` and `playwright.config.ts`, which need `node` types), the Worker by `worker/tsconfig.json` (`@cloudflare/workers-types` + `wrangler types --include-runtime=false`), the app by `tsconfig.json`.
- React Router updates the URL before it commits the new page (Next did it after). `e2e/tutorial.ts` `openLink` now also waits for the header breadcrumb; a spec that asserts page content right after `toHaveURL` can match the previous page.
- The `*` route renders inside the sidebar layout (Next's 404 had none), so the header's breadcrumbs had to handle unknown first segments.
- next-themes still renders its (inert) `<script>`, which React 19 reports on every client render: `scriptProps={{ type: "application/json" }}` marks it as a data block. The anti-flash script is in `index.html`.
- Para is only offered by the wallet button in the private-transfers tutorial (`components/lib/header.tsx`): check the signer dropdown there.
- Para's provider renders nothing until Para has initialized, and Para rejects origins its key doesn't allow (403 `origin not authorized`): a production build served on `localhost:8787` (`pnpm preview`) is a blank page, as it was with OpenNext. To test the built app locally, build with the BETA key and serve it on port 3000: `vite build --mode development && wrangler dev --port 3000` (stop `vite` first).
- Worker preview URLs (`<version>-miden-playground.walnuthq.workers.dev`) have the same problem: Para's production key rejects them (the deployed OpenNext version's preview URL is blank too). Only the `qa` preview alias is allowed in the Para dashboard: upload with `pnpm upload --preview-alias qa` and QA on `https://qa-miden-playground.walnuthq.workers.dev`. The production API and registry allow that alias in CORS too (`apps/api/index.ts`, the registry's `ALLOWED_ORIGINS`), so every tutorial and example runs on it; other preview URLs can't call them. Para's test accounts only exist in BETA, so the e2e Para tests skip themselves on the `qa` alias; for them, upload a production build with only Para switched to BETA (`VITE_PARA_API_KEY=<beta key> VITE_PARA_ENVIRONMENT=BETA vite build && wrangler versions upload`; shell variables win over `.env` files).
- Local `.env*.local` files need `VITE_*` names; a stale `NEXT_PUBLIC_*` file silently falls back to the defaults (no Para, local API).
- Don't call router hooks (`useLocation`, …) in `RootLayout`: it wraps `Providers`, so every navigation re-renders the whole provider tree, and starting a tutorial or loading an example then silently does nothing (#712). Put location-dependent logic in its own component inside the tree (`TrailingSlashRedirect`).

Repo conventions that apply to every PR (from `CLAUDE.md` and memory):
- Never edit `packages/ui/src/components/*` (stock shadcn, byte-identical to the CLI).
- PRs: from the fork, `gh pr create --repo walnuthq/miden-playground --head saimeunt:<branch>`. No CI checks on upstream PRs: verify locally. No Claude attribution in commits or PR bodies.
- Match the surrounding code style: arrow-function components, `export default` at the bottom, comment density as in the files around.

---

## Step 1: Replace the mock API routes with local helpers

### Context

`lib/api.ts` already decides per call whether to hit the real API (`API_URL`, i.e. `apps/api`, which itself calls `miden-source-code-verification/apps/api-compile`) or the Next mock under `/api`:

- `createScript({ name, type, example, tutorialId })`: real API when `tutorialId` is one of `""`, `"foreign-procedure-invocation"`, `"your-first-smart-contract-and-custom-note"`, `"contract-verification"`, else `/api`.
- `compileScript(script)`: real API when `isValidUUIDv4(script.id)`, else `/api` (mock ids look like `${example}_${uuid}`).
- `deleteScript(scriptId)`: same rule as `compileScript`.

The mock handlers:

- `app/api/scripts/route.ts` (`POST`): returns `{ package: { id: \`${example}_${randomUUID()}\`, name, type, rust, dependencies } }`, `rust`/`dependencies`picked from`lib/types/default-scripts/*`by`example` (`none`→`defaultScript()`from`lib/utils/script`). Note it maps `"p2id-note"`to`p2id`.
- `app/api/scripts/[id]/route.ts` (`PATCH`): parses the example from `id.split("_")[0]`, returns a `CompiledPackage` with `status: "compiled"`, the example's `masm`, `commitment`, `dependencies`, `exports: procedureExports.map((p) => ({ Procedure: p }))`, `masp: ""`, `error: ""`. Here `"p2id-note"` maps to **`timelockP2id`** (not `p2id`): keep that. For `"counter-account"` it rewrites `add.1` in the MASM to `add.<n>`, where `n` is the last `felt!(<n>)` in the submitted Rust (used by the counter tutorials).
- `app/api/scripts/[id]/route.ts` (`DELETE`): returns `{ package: { id } }`.
- `app/api/route.ts` (`GET /api`): env debug endpoint. Not called by the app: **delete**.

All mocks currently `await sleep(400)` (`sleep` in `lib/utils`).

### Changes

- Add `lib/mock-api.ts` with two exported async functions, `mockCreateScript({ name, type, example })` and `mockCompileScript({ id, name, rust })`, each `await sleep(1000)` then return the same shapes as today. No delete mock: mock scripts (ids with `_`) never get the delete action (`components/scripts/columns.tsx`), so the `DELETE` route was unreachable from the UI and `deleteScript` now always calls `apps/api`. Move the lookup tables (`scriptsRust`, `scriptsDependencies`, `scripts`, `scriptsExports`) there unchanged. Use `crypto.randomUUID()` (global) instead of `node:crypto`.
- Return copies, not the module-level objects: the HTTP round trip used to hand callers fresh objects (JSON), and the results go into app state (`NEW_SCRIPT` / `UPDATE_SCRIPT` in `hooks/use-scripts.ts`) and are persisted. `structuredClone` the `dependencies` / `exports` arrays (or the whole payload).
- In `lib/api.ts`, replace the `/api` branches with calls to those helpers, keeping each function's return contract (`{ script }` or `{ error }`). The real-API branches don't change. Keep the mock side's `{ error }` path: today an unknown example in the id (`scripts[example]` undefined, e.g. a script persisted by an older version) throws in the route, becomes a 500 and then `{ error: message }`. Wrap the mock call in `try`/`catch` returning `{ error: (error as Error).message }`, so the editor console still shows an error instead of an unhandled rejection.
- Delete `app/api/` entirely.
- The default-scripts modules are already bundled client-side (imported by `components/script/add-dependency-dialog.tsx`, `components/notes/add-note-dropdown-menu.tsx`, `components/notes/create-note-dialog.tsx`), so bundle size doesn't change.
- Update the docs that point at the routes: the header comments of `e2e/tutorial-7-deploy-a-counter-contract.spec.ts` and `e2e/tutorial-8-timelock-p2id-note.spec.ts` ("mock API routes (app/api/scripts)"), `e2e/README.md` prerequisite 3 ("compile through mock routes in `apps/web`"), and `docs/qa/README.md` (setup bullet: "mock Next.js routes in `apps/web/app/api/scripts`", and the e2e paragraph: "compile through mock Next.js routes"). Say "local mocks in `apps/web/lib/mock-api.ts`" instead. Script ids keep the `<example>_<uuid>` shape.
- Commit `VITE_MIGRATION.md` (untracked today) with this PR so the later PRs can update its status.

### Verify

- `pnpm typecheck`, `pnpm lint`.
- The mocks are used by tutorials 7 (deploy a counter contract) and 8 (timelock P2ID note), see `e2e/README.md`. Run the dev server and tutorial 7: create script, compile, the counter increment value is reflected in MASM, delete script. Then `pnpm --filter miden-playground-web test:e2e e2e/tutorial-7-deploy-a-counter-contract.spec.ts` and, with Bread Wallet installed (`pnpm bread-wallet`), `e2e/tutorial-8-timelock-p2id-note.spec.ts` (known flakiness: memory "Bread e2e failures").

---

## Step 2: Convert the tutorial MDX to TSX

### Context

- 73 `components/tutorials/<tutorial>/stepN.mdx` files. Each is imported **only** by its sibling `stepN.tsx` as `StepNContent` and rendered inside the step's `Content` component, sometimes with props (`<Step4Content transaction={transaction} />`). 30 files use `{props.…}` expressions (59 references).
- The MDX pipeline: `@next/mdx` in `next.config.ts` (`createMDX({})`, no remark/rehype plugins), `mdx.d.ts` (module typing), `mdx-components.tsx` (global element overrides via `useMDXComponents`).
- `mdx-components.tsx` overrides only **markdown-generated** elements (not explicit JSX in the MDX):
  - `a` → `<a href target="_blank" rel="noreferrer" className="text-primary font-medium underline underline-offset-4 inline-flex items-center gap-1">{children} <SquareArrowOutUpRight className="size-4" /></a>`
  - `ul` → `<ul className="ml-6 list-disc [&>li]:mt-2">`
  - `ol` → `<ol className="ml-6 list-decimal [&>li]:mt-2">`
  - `code` → `<code className="font-mono text-xs">{children}</code>`: applies to inline code **and** fenced blocks, and **drops** the `language-*` className. `pre` is not overridden (plain `<pre>`). No syntax highlighting.
- Imports used inside MDX: `@/components/tutorials/tutorial-link` (default `Link`, 53 uses, internal links), `@/components/lib/copy-button` (`CopyButton` ×7), `@/components/lib/account-address` (×5), `lucide-react` (`EllipsisVertical` ×10), `connect-wallet-and-sign-transactions/mint-button` and `wallet-backup-using-miden-guardian/mint-button` (`MintButton` ×3), `contract-verification/import-button`, `wallet-backup-using-miden-guardian/guardian-info`, `@/lib/utils`, `next/image` (×2).
- Fenced code blocks (all `rust`): `contract-verification/step2.mdx`, `your-first-smart-contract-and-custom-note/step2.mdx` and `step4.mdx`, `timelock-p2id-note/step3.mdx`.
- Raw HTML in MDX: a `<video className="max-h-64 object-contain" autoPlay loop><source src="/img/transfer-assets-transactions-video.mp4" type="video/mp4" /></video>` in `transfer-assets-between-wallets/step4.mdx`.
- Layout sensitivity: `components/tutorials/tutorial-step.tsx` renders `<step.Content />` inside `<div className="flex flex-col gap-2">`. MDX output is a fragment of top-level blocks (`<p>`, `<ul>`, `<pre>`…), so each block is a flex child spaced by `gap-2`. **The JSX must stay a fragment of the same top-level blocks**, no wrapping `<div>`, or the spacing changes.

### Changes

- Generate a faithful first pass mechanically instead of hand-transcribing: a throwaway script (in the scratchpad, not committed) that runs `@mdx-js/mdx`'s `compile(source, { jsx: true, outputFormat: "program" })` on each file prints the JSX the loader produces. Then clean it up by hand into idiomatic JSX. `@mdx-js/mdx@3.1.1` is in the tree as a dependency of `@mdx-js/loader`, but only under `node_modules/.pnpm` (not resolvable from `apps/web`): install it in the scratchpad (`npm i @mdx-js/mdx@3.1.1`) next to the script rather than adding it to the app.
- Add small shared prose components replicating `mdx-components.tsx`, e.g. in `components/tutorials/prose.tsx`: `ExternalLink` (the `a` override), `BulletList` / `NumberedList` (the `ul`/`ol` overrides), `InlineCode` (the `code` override), and `CodeBlock` (`<pre><code className="font-mono text-xs">{code}</code></pre>` taking a string, so Rust braces don't need JSX escaping; pass a template literal and keep the exact whitespace). Use them wherever markdown generated those elements; keep `TutorialLink` for explicit `<Link>`.
- MDX → JSX mapping to get right: paragraphs → `<p>`; `**x**` → `<strong>`; `_x_`/`*x*` → `<em>`; `` `x` `` → `<InlineCode>`; `**\`x\`**`→`<strong><InlineCode>x</InlineCode></strong>`; `[t](url)`→`<ExternalLink href="url">t</ExternalLink>`; soft line breaks inside a paragraph become a single space (watch `{" "}` at JSX line ends); typographic characters (`≥`, quotes, `—`) stay as written (MDX has no smartypants here).
- Inline the content into each `stepN.tsx`: either as the JSX returned by `Content`, or as a local `const StepNContent = ({ transaction }: { … }) => (<>…</>)` component in the same file when the step passes props, typed with the real types instead of MDX's untyped `props`. Delete the `.mdx` file.
- `next/image` in the 2 MDX files (`create-and-fund-wallet/step4`, `foreign-procedure-invocation/step2`): switch straight to `<img>` with the same `src`, `alt`, `width`, `height`, `className` (decided: saves step 3 work). Next's `<Image>` adds `loading="lazy"` and `decoding="async"`; keep `loading="lazy"` on the `<img>`. The 2 other `next/image` uses (`components/home/index.tsx`, `components/lib/wallet-button.tsx`) stay for step 3, to keep this PR to the MDX.
- Remove: `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx` from `apps/web/package.json`; `mdx.d.ts`; `mdx-components.tsx`; the `createMDX` wrapper in `next.config.ts` (keep `withSimpleAnalytics(nextConfig)`); the `packageExtensions."@next/mdx"` block in `pnpm-workspace.yaml`. Run `pnpm install` to update the lockfile.

### Verify

- `pnpm typecheck`, `pnpm lint`, `pnpm build` (still `next build`).
- Visual diff, before vs after, for **all 73 steps**. Take the baseline from production (https://playground.miden.xyz, which serves `main` until this PR merges) or a `main` dev server, and the after from the branch's dev server, both at the same viewport (Playwright's 1440×900).
  - Steps are gated: "Next step" stays disabled at the furthest step until its on-chain action is done, so don't walk the tutorials. Jump straight to a step by seeding the persisted state and reloading: `localStorage.setItem("state", JSON.stringify({ tutorialId: "<tutorial dir name>", tutorialStep: N - 1, tutorialMaxStep: N - 1, tutorialOpen: true }))` for `stepN` (`steps` is 0-based, see `components/tutorials/<id>/index.ts`; the deserializer in `lib/utils/state.ts` fills the other fields with defaults). The step text renders without the tutorial's store; links and values built from synced state show placeholders (e.g. `.../undefined`), identically on both sides.
  - Screenshot only the tutorial panel (`#tutorial`) to keep diffs stable. The panel scrolls, so long steps are clipped at 900 px: use a tall viewport (e.g. 1440×4000) for the screenshots. Pin the color scheme on both sides (Playwright `colorScheme: "light"`), since the app follows the system theme. Recipe checked on production for `create-and-fund-wallet` step 4 on 2026-10-26. A throwaway Playwright script in `apps/web/e2e/` (deleted before committing, as in step 1) is the easiest way to loop over the 12 tutorials × steps. Compare pixel-wise (e.g. `pixelmatch`, or Playwright's `toHaveScreenshot` against baselines generated from `main`) and look at every non-empty diff by eye.
  - Must-look steps: the fenced Rust blocks, the lists, the video (`transfer-assets-between-wallets/step4`), the two images, and steps with `props` (`create-and-fund-wallet/step4`).
- `grep -r "\.mdx" apps/web --exclude-dir=node_modules` returns nothing.

---

## Step 3: Switch to Vite, React Router v8 and the Worker

The big one. Build output and deploy change together, so this is a single PR. Suggested commit order inside the PR: scaffold → router → env → shell/assets → theme → analytics + Worker → deploy config → cleanup.

### 3.1 Dependencies

Add (exact pins, repo style):
- `vite@8.3.5`, `@vitejs/plugin-react@6.1.2` (dev). Match `apps/status-page`.
- `react-router@8.5.0`. Peer: React ≥ 19.2.7 (repo has 19.3.1), Node ≥ 22.22 (repo requires 24). ESM-only, no `react-router-dom` in v8.
- `vite-plugin-node-polyfills@0.28.0` (dev, peer supports Vite 8): Para needs `buffer`, `crypto`, `stream`, `util`. Next/webpack polyfilled these silently; Vite doesn't.
- `@fontsource-variable/geist@5.3.0`, `@fontsource-variable/geist-mono@5.3.0`.
- `@cloudflare/vite-plugin` (latest, `1.65.0` at audit time) _(optional, see 3.9)_.
- `@tailwindcss/vite@4.3.3` (dev), same as `apps/status-page` (3.6).
- `@miden-sdk/vite-plugin@0.17.5` (dev), **for its skill only** (see below).

`vite-plugin-node-polyfills` also satisfies an optional peer of `@miden-sdk/para-react` (`>=0.23.1 <1.0.0`).

Remove: `next`, `@opennextjs/cloudflare`, `@simpleanalytics/next`, `@types/node` if nothing else needs it _(verify: `e2e/` and `playwright.config.ts` use `process.env`, keep it)_. Remove `sharp` from `allowBuilds` in `pnpm-workspace.yaml` (only `next/image` needed it; keep `workerd`, `esbuild`).

**`@miden-sdk/vite-plugin`: install it, don't register it.** It ships the `vite-wasm-setup` skill (the Vite counterpart of `frontend-pitfalls` FP3/FP8/FP18, referenced by `react-sdk-patterns` and `frontend-source-guide`), which only reaches `.claude/skills/` when the package is in `apps/web/node_modules`. Add it in the same commit as `vite@8.3.5`, then run the skills sync from `CLAUDE.md`, which adds the `vite-wasm-setup` symlinks and lock entry:
- Its peer range is `vite ^5 || ^6`. Installed **before** `vite@8` is in `apps/web`, pnpm auto-installs `vite@6.4.5` + Rollup as the missing peer (tried during the re-audit, reverted). With `vite@8.3.5` already a devDependency, the peer resolves to Vite 8 with only a range warning: silence it with `peerDependencyRules.allowedVersions: { "@miden-sdk/vite-plugin>vite": "8" }` in `pnpm-workspace.yaml`, with a comment.
- It is versioned separately from the SDK (`0.17.5` vs `0.17.6`): never infer one version from the other.

Why not register it (or `paraVitePlugin()` from `@miden-sdk/para-react/vite`), re-checked against the source:
- Not because of `optimizeDeps.esbuildOptions`: Vite 8 still converts `esbuildOptions.plugins` into Rolldown plugins (`applyDepOptimizationOptionCompat`, run right after every plugin's `configResolved`), so both plugins' pre-bundling stubs would work, with a deprecation warning on each start.
- `midenVitePlugin()` sets `resolve.preserveSymlinks: true`. Under pnpm's isolated `node_modules`, resolving from the symlinked path can't reach transitive dependencies (they live next to the real path in `.pnpm`), and a plugin's `config()` result overrides the user config, so it can't be turned off cleanly.
- It aliases bare `@miden-sdk/miden-sdk` to the package directory (eager entry), which competes with our `/lazy` alias.
- Its dev RPC proxy is on by default (`/rpc.Api` → testnet); the app talks to the RPC directly today.
- `paraVitePlugin()` stubs 12 packages; we need 21 (3.2), so a local plugin is needed anyway, and one list in one place is easier to keep in sync with Para bumps.
  Re-evaluate both plugins when `@miden-sdk/vite-plugin` peers on Vite 8 and drops `preserveSymlinks` (or makes it optional).

### 3.2 `apps/web/vite.config.ts`

What it must do, mapping each line of today's `next.config.ts`:

| Today (`next.config.ts`)                                                                                   | Vite                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transpilePackages: ["@workspace/ui"]`                                                                     | Nothing: Vite compiles TS workspace sources. Add `@` alias → `apps/web` root, and keep `@workspace/ui/*` resolving through the package `exports` _(verify `packages/ui/package.json` exports cover `components/*`, `hooks/*`, `lib/*`, `globals.css`, `postcss.config`)_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `experiments.asyncWebAssembly`, `topLevelAwait`                                                            | `build.target: "esnext"`, `optimizeDeps.exclude: ["@miden-sdk/miden-sdk"]` (WASM must not be pre-bundled), `worker.format: "es"`. These are what `@miden-sdk/vite-plugin` sets. Also `resolve.dedupe: ["@miden-sdk/miden-sdk", "@miden-sdk/react", "react", "react-dom", "react/jsx-runtime", "@getpara/web-sdk", "@getpara/react-sdk-lite"]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Alias `@miden-sdk/miden-sdk$` → `@miden-sdk/miden-sdk/lazy`, `@miden-sdk/react$` → `@miden-sdk/react/lazy` | Keep, as exact-match regex aliases: `{ find: /^@miden-sdk\/miden-sdk$/, replacement: "@miden-sdk/miden-sdk/lazy" }`, same for react. Rationale today was SSR (top-level await in the eager entry); without SSR they may be unnecessary, but the wallet adapter and the multisig client import the eager entry while the app imports `/lazy`, and two entries can mean two WASM instances (`WASM_CLASS_MISMATCH`). Keep for the cutover, experiment in step 4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Para stubs (`paraStubPackages` → `false`)                                                                  | A small local plugin (`resolveId` returning a `\0stub:` id, `load` returning `export default {};`, `enforce: "pre"`) for the full list in today's `next.config.ts`: the 12 `@getpara/*` packages **plus** `@farcaster/miniapp-sdk`, `@farcaster/miniapp-wagmi-connector`, `@base-org/account`, `@metamask/connect-evm`, `@safe-global/safe-apps-provider`, `@safe-global/safe-apps-sdk`, `accounts` (exact match, the `accounts$` alias) and **`@opentelemetry/context-zone`**. The last one is critical: it pulls in zone.js, which replaces the global `Promise` and breaks the Miden store's Dexie transactions (`PrematureCommitError`), e.g. when importing a sandbox store. Also make sure pre-bundling stubs them: Vite 8's dep optimizer takes Rollup-style plugins in `optimizeDeps.rolldownOptions.plugins` (checked in `vite@8.3.5` types; `esbuildOptions` is deprecated), so the same `{ name, resolveId, load }` object can go both in `plugins` and in `optimizeDeps.rolldownOptions.plugins`. Copy the comments from `next.config.ts` along. |
| (implicit, webpack resolved one copy) `@miden-sdk/react` context identity                                  | What `midenVitePlugin()` does with its `externalize-miden-react` pre-bundling plugin: keep `@miden-sdk/react` (and `@miden-sdk/react/lazy`)**external** while pre-bundling, so the pre-bundled signer packages (`@miden-sdk/miden-wallet-adapter`, `@miden-sdk/para-react`) share the app's React contexts. A `rolldownOptions.plugins` entry whose `resolveId` returns `{ id, external: true }` for `/^@miden-sdk\/react(\/lazy)?$/`. Symptom when missing: signer providers can't see `MidenProvider` / `MultiSignerProvider` (e.g. "must be used within" errors, wallet dropdown missing signers), typically after a dev re-optimization. Don't copy its `resolve.preserveSymlinks: true` (3.1).                                                                                                                                                                                                                                                                                                                                                          |
| (implicit) Node builtins polyfills                                                                         | `nodePolyfills({ include: ["buffer", "crypto", "stream", "util"] })` from `vite-plugin-node-polyfills`, what `paraVitePlugin()` adds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `allowedDevOrigins: ["playground.miden.local"]`                                                            | `server.allowedHosts: ["playground.miden.local"]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `next dev -p 3000`                                                                                         | `server.port: 3000`, `strictPort: true` (Playwright `baseURL` and the `tutorials-qa` skill assume 3000). Same for `preview.port`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Tailwind via `postcss.config.mjs` (re-exports `@workspace/ui/postcss.config`)                              | `tailwindcss()` from `@tailwindcss/vite`, like `apps/status-page`, and delete `apps/web/postcss.config.mjs` (3.6). `packages/ui`'s `postcss.config` export and its `@tailwindcss/postcss` devDependency then have no consumer: remove them in step 4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `withSimpleAnalytics`                                                                                      | Moves to the Worker (3.8) and `index.html` (3.3).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

Also: `envPrefix: "VITE_"` (default), `plugins: [react(), tailwindcss(), …]`. No COOP/COEP headers: the app runs the single-threaded SDK build (no `SharedArrayBuffer`), and `same-origin` COOP would null `window.opener` in Para's OAuth popups. Do not use `@miden-sdk/*/mt`. No RPC dev proxy (the app calls the RPC directly, as on Next). Don't set `resolve.preserveSymlinks` (pnpm).

SDK worker and WASM, things the config must not break:
- `lib/miden-client.ts` forces `WasmWebClient.workerMode = "module"`, with a comment about webpack/Next (web-sdk#286). In `auto` the SDK uses the classic worker on Safari/WebKit. Vite recognises both `new Worker(new URL(…, import.meta.url))` forms, but how the classic variant (a self-contained script that rewrites `import.meta.url`) behaves with `worker.format: "es"` is untested here. **Keep `"module"` for the cutover** (it is what production runs today) and reword the comment (it's no longer a Next workaround but the choice we've validated). Re-evaluate `auto` in step 4 with a Safari test.
- The SDK emits its WASM twice in source (`dist/st/assets/` for the main thread, `dist/st/workers/assets/` for the worker), byte-identical, 21.6 MB. Webpack deduped them into one hashed file; check that `dist/assets` also holds a single `miden_client_web-*.wasm`. Each asset must stay under Workers static assets' **25 MiB per-file limit**, which is also the limit today.
- Dev pre-bundling discovers Para/wagmi/Reown deps lazily and **reloads the page** when it re-optimizes. A reload in the middle of a tutorial loses in-flight UI state. If that shows up, list the offenders in `optimizeDeps.include` (Vite prints them as "new dependencies optimized").
- If the optimizer complains about top-level await in a pre-bundled dep, set its target to `esnext` (what the upstream plugin did with `esbuildOptions.target`) through `optimizeDeps.rolldownOptions`.

Read the `frontend-pitfalls` skill (FP3, FP8, FP16, FP17 `WASM_CLASS_MISMATCH`, FP18 eager vs lazy), `vite-wasm-setup` (after installing it, 3.1) and `para-signer` ("Bundler setup") before writing this file. The upstream plugin source is short and worth reading too: `apps/web/node_modules/@miden-sdk/vite-plugin/dist/index.mjs` and `@miden-sdk/para-react/dist/paraVitePlugin.mjs`.

### 3.3 Entry: `index.html`, `main.tsx`, `App`

`apps/web/index.html` replaces `app/layout.tsx` and the home page `metadata`:
- `<html lang="en">`, `<meta charset>`, viewport, `<title>Miden Playground</title>`, `<meta name="description" content="Experiment with Miden's novel architecture in our very own training environment.">`.
- Open Graph / Twitter tags from `app/(home)/page.tsx`: `og:url` `https://playground.miden.xyz`, `og:type` `website`, `og:image` `https://playground.miden.xyz/opengraph-image.jpg`, `og:locale` `en_US`, `og:site_name` `Miden Playground`, `twitter:image` `https://playground.miden.xyz/twitter-image.jpg` (plus `og:title`/`og:description`, `twitter:card` as Next emitted _(verify by viewing source of playground.miden.xyz before the cutover)_). Static for all routes: today only the home page sets metadata, so no regression.
- `<link rel="icon" href="/favicon.ico">`.
- The theme anti-flash inline script (3.5).
- The Simple Analytics script (3.8).
- `<body class="font-sans antialiased"><div id="root"></div><script type="module" src="/main.tsx"></script></body>`. Next's `<body>` carried the font variable classes; with fontsource they're not needed if the CSS variables are defined (3.6).

Move `app/favicon.ico`, `app/opengraph-image.jpg`, `app/twitter-image.jpg` to `public/`.

`apps/web/main.tsx` (or `src/main.tsx`; the app has no `src/`, keep files at the app root next to `components/`, `hooks/`, `lib/`):
- CSS imports **in this order** (the comment in `app/layout.tsx` explains: Para's stylesheet ships its own Tailwind preflight, so it must come before `globals.css` for the app's base rules to win): `@getpara/react-sdk-lite/styles.css`, `@miden-sdk/miden-wallet-adapter/styles.css`, the fontsource imports, then the app's `./index.css` (3.6), which imports `@workspace/ui/globals.css`.
- `createRoot(…).render(<StrictMode>…</StrictMode>)`: Next 16's App Router runs in strict mode by default (`next.config.ts` doesn't turn it off), and `apps/status-page/src/main.tsx` does the same. Keep it. `MidenProvider` guards its own double init (FP9); `components/providers/miden-provider.tsx`'s `deleteOutdatedMidenStores` effect already ran twice in dev under Next. Follow status-page's `main.tsx` for the `#root` lookup (throw instead of `!`).
- Render `<RouterProvider router={router} />` (import from **`react-router/dom`** in v8).

Root route element (replaces `app/layout.tsx` body):
```tsx
<Providers>
  {/* .root (isolation: isolate, Base UI's portal setup) wraps only the page
      content: Para renders its login iframe next to it from ParaProvider,
      and that iframe has to stack above Para's modal portaled to body. */}
  <div className="root">
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
    <Toaster richColors position="bottom-center" />
  </div>
  <ScrollRestoration />
</Providers>;
```
Keep that comment. `<ScrollRestoration />` restores Next's scroll-to-top on navigation _(verify it works with the sidebar's scroll container; the main scroll may be inside `SidebarInset`, in which case scroll that element on `pathname` change instead)_.

### 3.4 Routing (React Router v8, data mode)

`apps/web/routes.tsx` (or `router.tsx`):
```tsx
createBrowserRouter([
  {
    Component: Root, // 3.3
    children: [
      {
        Component: SidebarLayout, // app/(home)/layout.tsx, renders <Outlet /> where {children} was
        children: [
          { index: true, Component: Home },
          { path: "accounts", Component: Accounts },
          { path: "accounts/:identifier", Component: AccountPage },
          { path: "components", Component: Components },
          { path: "components/:id", Component: ComponentPage },
          { path: "notes", Component: Notes },
          { path: "notes/:id", Component: NotePage },
          { path: "scripts", Component: Scripts },
          { path: "scripts/:id", Component: ScriptPage },
          { path: "transactions", Component: Transactions },
          { path: "transactions/:id", Component: TransactionPage },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
```

- The page files in `app/(home)/**/page.tsx` are thin wrappers (`<Accounts />`, or `await params` then `<Account identifier={identifier} />`). Replace the param ones with tiny wrappers using `useParams()`, or have the components read `useParams()` themselves. Delete `app/`.
- Code splitting: Next split per route. Use the route `lazy` field (`lazy: () => import("…")`) for the detail pages at least, or accept a single bundle and check its size. Monaco is already loaded from a CDN by `@monaco-editor/react`.
- Stale chunks after a deploy: Workers static assets only serve the current deployment, so a tab opened before a deploy gets a 404 (or, with SPA fallback on a navigation, HTML) for an old lazy chunk. With route `lazy`, add the standard Vite handler in `main.tsx`: `window.addEventListener("vite:preloadError", () => window.location.reload())`. Next had the same problem and handled it with a hard navigation.
- `useIsClient()` guards (10 components, plus `TutorialLayout` returning `null` until mounted) were there for SSR hydration. They are harmless in an SPA (one empty first render): leave them for this PR, remove in step 4.
- `NotFound`: Next rendered its built-in 404 for unknown paths and for `notFound()`. Add a simple not-found component (match the app's look, shadcn `Empty` if present in `packages/ui`).
- `notFound()` in `components/script/script.tsx:39` (script id not in state): render `<NotFound />` instead (or `throw` a 404 `Response` caught by an `errorElement`; rendering is simpler).

API mapping, file by file:

| Next                                                              | React Router v8                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| `import { useRouter } from "next/navigation"`; `router.push(url)` | `import { useNavigate } from "react-router"`; `navigate(url)` |
| `usePathname()`                                                   | `useLocation().pathname`                                      |
| `useSearchParams()` → `URLSearchParams`                           | `const [searchParams] = useSearchParams()` (tuple)            |
| `<Link href="…">` from `next/link`                                | `<Link to="…">` from `react-router`                           |
| async page `params`                                               | `useParams()`                                                 |

Files using `next/navigation` (30): `components/account/account.tsx`, `components/accounts/accounts-table.tsx`, `components/component/index.tsx`, `components/components/components-table.tsx`, `components/components/create-component-dialog.tsx`, `components/home/new-sandbox-card.tsx`, `components/lib/header.tsx`, `components/lib/nav-main.tsx`, `components/lib/project-switcher.tsx`, `components/note/note.tsx`, `components/notes/notes-table.tsx`, `components/script/script.tsx`, `components/scripts/create-script-dialog.tsx`, `components/scripts/scripts-table.tsx`, `components/transactions/transactions-table.tsx`, `hooks/use-examples.ts`, `hooks/use-tutorials.ts`, and tutorial steps `connect-wallet-and-sign-transactions/step1`, `contract-verification/step1`, `deploy-a-counter-contract/step1`, `step3`, `foreign-procedure-invocation/step2`, `step4`, `interact-with-the-counter-contract/step1`, `step4`, `private-transfers/step1`, `timelock-p2id-note/step1`, `wallet-backup-using-miden-guardian/step2`, `step5`, `your-first-smart-contract-and-custom-note/step1`.

Files using `next/link` (12): `components/account/account-component-table.tsx`, `components/account/account-notes-table.tsx`, `components/component/component-information-table.tsx`, `components/lib/account-address.tsx`, `components/lib/nav-main.tsx`, `components/lib/note-id.tsx`, `components/lib/note-script-root.tsx`, `components/lib/transaction-id.tsx`, `components/note/note-information-table.tsx`, `components/script/dependencies-table.tsx`, `components/transaction/transaction-note-table.tsx`, `components/tutorials/tutorial-link.tsx`.

Patterns to watch:
- Tab state in the URL (`account.tsx`, `component/index.tsx`, `note/note.tsx`, `script/script.tsx`): `searchParams.get("tab") ?? "information"` and `router.push(value === default ? pathname : \`${pathname}?${new URLSearchParams({ tab: value })}\`)`. Keep the same URLs; `navigate(…)`works the same. Next's`router.push`scrolled to top on tab change? _(verify: Next keeps scroll for same-page search param changes only with`{ scroll: false }`; check the current behaviour and keep it; `ScrollRestoration`won't scroll on search-only changes unless`getKey` says so)_.
- Tutorial `useCompleted` hooks compare `pathname` to `/scripts/${id}`, `/accounts/${identifier}`…: same strings with `useLocation().pathname`. Note React Router doesn't strip a trailing slash; neither did Next for these routes.
- `components/lib/header.tsx` parses `pathname.split("/")` for breadcrumbs: unchanged.
- Base UI `render={<Link … />}` usages (e.g. sidebar items in `nav-main.tsx`): React Router's `Link` renders an `<a>`, pass `nativeButton={false}` where the host is a button primitive, as with `next/link`.
- `components/tutorials/index.ts:17` reads `window.location` at module scope (`preview-tutorials` param): fine in an SPA.
- `next/image` (if not done in step 2): `components/home/index.tsx` (hero SVG, 255×45) and `components/lib/wallet-button.tsx` (`/img/para.jpg`) → `<img>` with the same attributes.

### 3.5 Theme: keep `next-themes`

- `next-themes@0.4.6` has no Next dependency (peers: `react`, `react-dom` only).
- `packages/ui/src/components/sonner.tsx` (stock shadcn, must not be edited) imports `useTheme` from `next-themes`, so replacing the library would mean two theme sources. `components/lib/mode-toggle.tsx` and `components/lib/editor.tsx` (`resolvedTheme` for Monaco) use it too. `components/providers/index.tsx` sets it up (`attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange enableColorScheme`): unchanged. Optionally rename the import alias `NextThemesProvider` → `ThemeProvider`.
- Only change: next-themes injects its anti-flash `<script>` during render, and a client-rendered `<script>` never executes. `apps/status-page/index.html` already has the equivalent inline script (same provider props, same `theme` storage key, `dark` class + `colorScheme`, try/catch): copy it with its comment, pointing it at `components/providers/index.tsx`.
- Note: `apps/status-page/src/main.tsx` says apps/web "pins itself to light with `forcedTheme`". That's stale: apps/web follows the system (`defaultTheme="system" enableSystem`). Fix that comment in step 4.

### 3.6 Fonts and CSS

- Replace `next/font/google` with `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` imports in `main.tsx`.
- Checked: `packages/ui/src/styles/globals.css` defines **no** `--font-*` theme variable, so `font-sans` / `font-mono` use Tailwind's defaults, and Next overrode `--font-sans` / `--font-mono` on `<body>` through the `next/font` variable classes. (`apps/status-page` never loaded Geist, so it can't be copied here.) Add `apps/web/index.css`, modelled on `apps/status-page/src/index.css`: `@import "@workspace/ui/globals.css";` then `@theme { --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif; --font-mono: "Geist Mono Variable", ui-monospace, monospace; }`. App-specific, so it belongs in apps/web, not the shared globals.css.
- Checked: `globals.css` has `@source "../../../apps/**/*.{ts,tsx}"`, which covers `apps/web` (Tailwind skips gitignored paths such as `dist`). Unlike status-page's `index.css`, no extra `@source` is needed. Check that classes used only in `apps/web` (e.g. `bg-beginner`, `max-h-64`) are in the built CSS.

### 3.7 Env vars

- Rename `NEXT_PUBLIC_*` → `VITE_*` and `process.env.X` → `import.meta.env.X` in `lib/constants.ts`, `lib/miden-faucet.ts`, `components/providers/para-provider.tsx`.
- Replace `process-env.d.ts` with `vite-env.d.ts`: `/// <reference types="vite/client" />` and an `ImportMetaEnv` interface with the same 6 vars (+ analytics, below), keeping the header comment ("keep in sync with .env.example, .env.production and turbo.json").
- `SIMPLE_ANALYTICS_HOSTNAME` (build-time today, read by the Next plugin) becomes a **Worker variable**: `vars.SIMPLE_ANALYTICS_HOSTNAME` in `wrangler.jsonc`, read by the proxy (3.8). It's a server concern; the client bundle doesn't need it. Remove it from `.env.example` / `.env.production` / `turbo.json` and document it in `wrangler.jsonc` instead (for local `wrangler dev`, a `.dev.vars` with `SIMPLE_ANALYTICS_HOSTNAME=` left empty keeps analytics off).
- Update `.env.example`, `.env.production` (keep the comments; mention `vite build` / `vite` instead of `next build` / `next dev`). Checked: the `.local` variants are gitignored, not committed. Vite loads the same files in the same order (`.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`), so local overrides keep working once renamed. Tell the team that local `.env.local` files need the `VITE_` rename too.
- `VITE_PARA_API_KEY` is also the name the `para-signer` skill and the SDK examples use.
- `turbo.json` `miden-playground-web#build`: `env` list renamed, `outputs: ["dist/**"]`. Root `build` task `outputs` still list `.next/**`: replace with `dist/**` once no app uses Next.
- `process.env.NODE_ENV` in commented code (`components/home/index.tsx:77`, `components/lib/project-switcher.tsx:170`): switch to `import.meta.env.DEV` if uncommented.
- `.dev.vars`: drop `NEXTJS_ENV` (OpenNext only); keep the file only for the Worker's `SIMPLE_ANALYTICS_HOSTNAME` as above, with an updated comment.

### 3.8 Simple Analytics (client + Worker proxy)

What `@simpleanalytics/next` does today:
- `<SimpleAnalytics />` in `app/layout.tsx` renders `next/script` `<script src="/proxy.js" data-hostname={NEXT_PUBLIC_SIMPLE_ANALYTICS_HOSTNAME}>`. That var is unset, so `data-hostname` is absent: pageviews are reported under the domain the app is served on (as `.env.example` says).
- `withSimpleAnalytics` (when `SIMPLE_ANALYTICS_HOSTNAME` is set) adds rewrites:
  - `/proxy.js` → `https://simpleanalyticsexternal.com/proxy.js?hostname=${SIMPLE_ANALYTICS_HOSTNAME}&path=/simple`
  - `/auto-events.js` → `https://scripts.simpleanalyticscdn.com/auto-events.js`
  - `/simple/:match*` → `https://queue.simpleanalyticscdn.com/:match*`
  - and headers on `/` and `/([^_].*)`: `Accept-CH` and `Vary` = `Sec-CH-Viewport-Width, Sec-CH-Viewport-Height, Viewport-Width, Sec-CH-Lang, Lang` (client hints).
- `trackEvent(name, params)` = `window.sa_event?.(name, params)`, a no-op when the script isn't loaded. Used 4 times in `hooks/use-tutorials.ts` (`start_tutorial`, `complete_tutorial`, `complete_tutorial_step` with `tutorial_id`, `tutorial_step`, `wallet_connected`).
- SA's script tracks SPA `pushState` navigations by itself; nothing to wire into the router.

Client:
- `index.html`: `<script async src="/proxy.js"></script>` in `<body>`. In dev (no Worker in front, unless 3.9), `/proxy.js` 404s as it does today with Next when the var is unset: acceptable, or inject the tag only in production builds with a tiny Vite `transformIndexHtml` plugin.
- `lib/analytics.ts`: `export const trackEvent = (name: string, metadata?: Record<string, unknown>) => window.sa_event?.(name, metadata);` and a `Window` augmentation (`sa_event?: (name: string, metadata?: …) => void`) in `window.d.ts`. Update `hooks/use-tutorials.ts` import.

Worker (`apps/web/worker/index.ts`), modeled on the Next rewrites:
```ts
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/proxy.js") {
      return proxy(
        request,
        `https://simpleanalyticsexternal.com/proxy.js?hostname=${env.SIMPLE_ANALYTICS_HOSTNAME}&path=/simple`,
      );
    }
    if (url.pathname === "/auto-events.js") {
      return proxy(
        request,
        "https://scripts.simpleanalyticscdn.com/auto-events.js",
      );
    }
    if (url.pathname.startsWith("/simple/")) {
      return proxy(
        request,
        `https://queue.simpleanalyticscdn.com${url.pathname.slice("/simple".length)}${url.search}`,
      );
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

- `proxy()` forwards method, body and headers (Next rewrites forward the client IP/UA headers; SA uses `User-Agent`, `Referer`, client hints; Cloudflare adds `CF-Connecting-IP`, and SA documents an `X-Forwarded-For` expectation for proxies _(verify SA's proxy docs: https://docs.simpleanalytics.com/proxy)_). Return the upstream response as-is.
- If `SIMPLE_ANALYTICS_HOSTNAME` is unset (local), return 404 for those paths.
- Add the client-hint `Accept-CH` / `Vary` headers either in the Worker for HTML responses or, simpler, in `public/_headers` for `/*`.
- `run_worker_first: ["/proxy.js", "/auto-events.js", "/simple/*"]` in `wrangler.jsonc` so static assets are served without invoking the Worker for everything else.
- Types: `wrangler types` regenerates `worker-configuration.d.ts` (or keep `cloudflare-env.d.ts` naming) with `Env` (`ASSETS`, `SIMPLE_ANALYTICS_HOSTNAME`). Give the worker its own `tsconfig` (`types: ["@cloudflare/workers-types"]` or the generated runtime types) so DOM and Worker globals don't mix in the app's typecheck.

### 3.9 Cloudflare deploy

`apps/web/wrangler.jsonc`:
- `main`: `.open-next/worker.js` → `worker/index.ts`.
- `assets`: `{ "directory": "./dist", "binding": "ASSETS", "not_found_handling": "single-page-application", "run_worker_first": ["/proxy.js", "/auto-events.js", "/simple/*"] }`. SPA fallback serves `index.html` for `/accounts/…` deep links.
- Remove `r2_buckets` (`NEXT_INC_CACHE_R2_BUCKET`).
- Add `vars: { "SIMPLE_ANALYTICS_HOSTNAME": "playground.miden.xyz" }` (if chosen in 3.7).
- Keep unchanged: `name: "miden-playground"`, `preview_urls`, `workers_dev: true` (playground.miden.xyz is proxied by Vercel to the workers.dev URL), `routes` (custom domain `miden-playground.walnut.dev`), `compatibility_date`, `compatibility_flags` (`nodejs_compat` may no longer be needed, harmless), `observability`. Keep the comments.
- `deploy-staging` uses `--env staging` but `wrangler.jsonc` has no `env.staging` _(verify; keep the script working as it does today)_.

Option: `@cloudflare/vite-plugin` runs the Worker inside `vite dev` (workerd), so `/proxy.js` works locally and the build emits a ready-to-deploy output. It changes how `wrangler.jsonc` is consumed (the plugin writes a generated config into `dist/`). Recommendation: **skip it for the cutover** (plain `vite build` + `wrangler deploy`), revisit later.

`apps/web/package.json` scripts:
- `dev`: `vite`; `build`: `vite build`; `preview`: `vite build && wrangler dev` (serves `dist` through the Worker, closest to prod); `deploy`: `vite build && wrangler deploy`; `deploy-staging`: `vite build && wrangler deploy --env staging`; `upload`: `vite build && wrangler versions upload`; `typecheck`: `tsc --noEmit` (drop `next typegen`), plus the worker tsconfig; `cf-typegen`: `wrangler types`.
- `public/_headers`: `/_next/static/*` → `/assets/*` (Vite's hashed output dir), `Cache-Control: public,max-age=31536000,immutable`.
- `.github/workflows/deploy-web-cloudflare.yml`: the command (`pnpm run deploy`) stays; update the comments ("Builds with OpenNext (`next build` reads …)" → Vite). `paths` filter unchanged.
- `turbo.json`: see 3.7.

Delete: `next.config.ts`, `open-next.config.ts`, `next-env.d.ts`, `cloudflare-env.d.ts` (regenerate), `app/`, `postcss.config.mjs`, `mdx*` leftovers if any. Checked `.gitignore`: `dist` is already ignored at the root. Remove the Next-only entries (`next-env.d.ts` and its comment, `.next/`, `.open-next`) and keep `.wrangler`. `apps/web/.gitignore` only has Playwright entries.

`apps/web/components.json` (shadcn): set `"rsc": false`. With `true`, `shadcn add` writes `"use client"` into generated files, which this PR removes everywhere.

### 3.10 TypeScript and tooling

- `apps/web/tsconfig.json`: stop extending `@workspace/typescript-config/nextjs.json`. Follow `apps/status-page/tsconfig.json`: extend `react-library.json`, `lib: ["ES2023", "DOM", "DOM.Iterable"]`, `module: "ESNext"`, `moduleResolution: "bundler"`, `types: ["vite/client"]`, `verbatimModuleSyntax`, `noEmit`, `jsx: "react-jsx"` _(verify what `react-library.json` sets)_. Keep `paths` (`@/*`, `@workspace/ui/*`, the `react`/`@types/react` pins). Remove the `next` plugin, `next-env.d.ts`, `.next/types/**`, the `declaration: false` OpenNext workaround comment (keep the setting if the preset enables declarations), the `.open-next` exclude. Add `dist`, `worker` (own tsconfig) excludes.
- `packages/typescript-config/nextjs.json`: delete once nothing extends it.
- Remove the 58 `"use client"` directives from `apps/web` (meaningless outside RSC). Leave `packages/ui` alone (stock files).
- `apps/web/AGENTS.md`: delete the `<!-- BEGIN:nextjs-agent-rules -->` … `<!-- END:nextjs-agent-rules -->` block (it is re-added only by `next dev`). The file is gitignored (`AGENTS.md` in the root `.gitignore`), so this is a local cleanup, not part of the diff.
- `lib/miden-client.ts`: reword the `workerMode` comment (3.2).
- Biome: no Next-specific config found; `pnpm lint` must pass.
- `packages/eslint-config` only contains a stale `node_modules` (no tracked files): ignore, or delete the directory locally.

### Verify (step 3)

1. `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build` at the root. `dist/assets` holds exactly one `miden_client_web-*.wasm`, and no file in `dist` is over 25 MiB. `.claude/skills/vite-wasm-setup` resolves (3.1).
2. `pnpm --filter miden-playground-web dev` on port 3000: home, every list/detail route, deep-link reload on `/accounts/<id>` (SPA fallback works in dev by default), unknown route → not found, tab query params, back/forward, theme toggle with no flash on reload in dark mode, Monaco theme follows.
3. Critical Miden checks:
   - Tutorial 2 (sandbox store snapshot import): proves the zone.js stub works (no `PrematureCommitError`).
   - Any flow using the wallet adapter and the multisig client (tutorial 5 wallet backup / Guardian): no `WASM_CLASS_MISMATCH`, and a single distinct `.wasm` URL in the network panel. Expect it to be fetched by both the main thread and the SDK's Web Worker (each instantiates its own module, as on Next), so "one fetch" is not the criterion. "One URL, one copy of the SDK JS" is.
   - Signer contexts shared: the wallet dropdown lists both MidenFi and Para signers (`MultiSignerProvider` + `SignerSlot`), checking the `@miden-sdk/react` externalization (3.2).
   - Safari/WebKit smoke test (or Playwright's `webkit` project, ad hoc): the client initializes with `workerMode = "module"` (3.2).
   - Para login (tutorial with Para, see the `para-signer` skill and memory "Para auth: headless + Gmail OTP"): OAuth popup works (no COOP), Buffer/crypto polyfills OK.
   - Bread Wallet connect (memory "Bread Wallet in agent-browser").
4. `pnpm --filter miden-playground-web preview` (built `dist` through `wrangler dev`): `/proxy.js` returns SA's script, a tutorial start sends a `/simple/…` event (network panel), deep links work, `/assets/*` has the immutable cache header.
5. Full Playwright suite against the **built** app (`PLAYWRIGHT_BASE_URL` = the `wrangler dev` URL), not only against `vite dev`: Vite's dev pre-bundling of Para/wagmi/Reown can differ from the production build. Known flaky/unrelated failures: memory "Bread e2e failures".
6. Deploy to a preview URL (`pnpm --filter miden-playground-web upload`, `preview_urls: true`) and run the `tutorials-qa` skill against it before merging. Memory "Next upgrade → OpenNext check" existed because prod builds diverged from dev; the same caution applies here.

---

## Step 4: Post-cutover cleanup

- Root `README.md`: the apps table (`apps/web` (Next.js on OpenNext) → Vite on Workers static assets + Worker), env section (`.env.production` inlined by `vite build`, `VITE_*`), drop the `.dev.vars` / `NEXTJS_ENV` sentence, deploy section.
- `CLAUDE.md`: replace the "Next.js → Vite migration" pointer with Vite-specific notes that a future agent needs: the Para stub list, the `@miden-sdk/react` externalization and the `/lazy` aliases live in `apps/web/vite.config.ts`, so re-check them on Para / SDK bumps. `@miden-sdk/vite-plugin` is installed for its skill only and not registered (3.1), so bump it with the SDK but read its own latest version, and register it once it peers on Vite 8 and drops `preserveSymlinks`. Remove the `peerDependencyRules` entry when it does.
- Experiment: drop the `/lazy` aliases (3.2) and import the eager entries everywhere (`frontend-pitfalls` FP18 / `vite-wasm-setup`: eager is the norm for a plain Vite SPA); keep only if the step 3 Miden checks still pass and bundle/WASM loading improves.
- Experiment: `workerMode` back to `auto` (3.2), only with a Safari test.
- Remove the `useIsClient()` SSR guards (3.4).
- `packages/ui`: drop the `./postcss.config` export, `postcss.config.mjs` and the `@tailwindcss/postcss` devDependency if nothing uses them anymore (3.2).
- Fix the stale `forcedTheme` comment in `apps/status-page/src/main.tsx` (3.5).
- Delete the R2 bucket `miden-playground-cache` (`wrangler r2 bucket delete miden-playground-cache`) after the new deploy is live. Ask before running it: irreversible.
- Root `.gitignore`: drop the Next entries (`next-env.d.ts`, `.next/`, `.open-next`) after deleting the local leftovers (`apps/*/.next`, `apps/*/next-env.d.ts`, `apps/web/.open-next`); see the step 3 gotchas. (`nextjs.json` and the turbo `.next/**` outputs went in step 3.)
- Claude memory: retire "Next upgrade → OpenNext check" (`next-upgrade-opennext-check.md`), update "Miden package versions match SDK" if the pin rules change.
- Optional later: `@tailwindcss/vite` instead of PostCSS, `@cloudflare/vite-plugin`, upstream `@miden-sdk/vite-plugin` / `paraVitePlugin` once they support Vite 8.

Outcomes (2026-10-27):
- Eager entries: kept. The app imports `@miden-sdk/miden-sdk` and `@miden-sdk/react`, and the `/lazy` aliases are gone. Same bundle (+1.5 KB JS), one `.wasm` file and URL. A cold load on the built app (`wrangler dev`, Chromium, median of 3) gets to a synced network badge in 3.16 s instead of 3.67 s at 40 Mbps (the WASM fetch starts at module evaluation), and in about 2.0 s either way unthrottled. Full e2e suite passed on the built app, with Para BETA (14/14).
- `workerMode = "auto"`: rejected. In WebKit (Playwright) the classic worker resolves `new URL("assets/miden_client_web.wasm", self.location.href)` from `/assets/`, so it requests `/assets/assets/miden_client_web.wasm` (unhashed), gets the SPA fallback's HTML and fails with `CompileError: WebAssembly.Module doesn't parse at byte 0`. The client never initializes. `"module"` syncs in WebKit in about 2.6 s. The reason is now in the comment in `lib/miden-client.ts`.
- `@tailwindcss/vite` was already done in step 3: no app uses PostCSS any more.
- The R2 bucket `miden-playground-cache` still exists: delete it only on explicit request.

## Risks

1. **zone.js / Dexie**: if `@opentelemetry/context-zone` is not stubbed in both the dev pre-bundle and the production build, sandbox store imports break silently (`PrematureCommitError`). Test tutorial 2 first.
2. **Duplicate SDK / WASM**: eager vs `/lazy` entries and pre-bundled copies → `WASM_CLASS_MISMATCH`. Keep the aliases, `dedupe`, and `optimizeDeps.exclude` for `@miden-sdk/miden-sdk`.
3. **Dev vs prod divergence**: Vite dev (pre-bundling) and Rolldown build behave differently for the big wallet stacks. Always validate the built app.
4. **Miden Vite plugins lag Vite 8**: `@miden-sdk/vite-plugin@0.17.5` peers Vite ≤ 6 and forces `preserveSymlinks` (bad with pnpm); we replicate it inline and keep the package for its skill. Revisit on each SDK bump.
5. **Signer React context split**: if `@miden-sdk/react` gets pre-bundled into the signer packages, the MidenFi / Para providers stop seeing `MidenProvider`. Covered by the externalization in 3.2. Check the wallet dropdown after any dev "new dependencies optimized" reload.
6. **WASM size vs Workers assets limit**: 21.6 MB today against a 25 MiB per-file cap, the same constraint as with OpenNext. An SDK bump past it breaks the deploy, not the build.
7. **Stale chunks after deploy** with route-level `lazy`: handled by the `vite:preloadError` reload (3.4).
8. **Simple Analytics proxy**: wrong header forwarding means bot-filtered or mis-attributed pageviews. Compare SA dashboard counts the week after the cutover.
9. **Scroll behaviour**: Next scrolled to top on navigation; React Router needs `ScrollRestoration` or a manual reset on the actual scroll container.

## Re-audit changes (2026-10-26, `4d134d3`)

Checked against the tree and the installed packages, with the Miden skills (`frontend-pitfalls`, `para-signer`, `react-sdk-patterns`, `frontend-source-guide`) and the `vite-wasm-setup` skill read from the `@miden-sdk/vite-plugin@0.17.5` tarball. Inventory counts unchanged (58 `"use client"`, 30 `next/navigation`, 12 `next/link`, 4 `next/image`, 73 MDX files / 1,035 lines); versions in 3.1 still current on npm.

- Step 1: return cloned payloads; keep an `{ error }` path for unknown examples; update the e2e, e2e README and `docs/qa/README.md` references to `app/api/scripts`; commit this file; verify tutorials 7 **and 8**.
- Step 2: 30 MDX files use props (not 38); `@mdx-js/mdx` isn't resolvable from `apps/web`.
- 3.1: install `@miden-sdk/vite-plugin` for its `vite-wasm-setup` skill (after `vite@8`, with a `peerDependencyRules` entry); `@tailwindcss/vite`. The reason for not registering the upstream plugins was wrong (Vite 8 still converts `esbuildOptions.plugins`); the real ones are `preserveSymlinks` under pnpm, the competing alias, the default RPC proxy and the incomplete Para stub list.
- 3.2: added the `@miden-sdk/react` pre-bundling externalization (missing before), the confirmed `optimizeDeps.rolldownOptions.plugins` API, the `workerMode = "module"` override in `lib/miden-client.ts`, the duplicated 21.6 MB WASM vs the 25 MiB asset limit, dev re-optimization reloads.
- 3.3 / 3.5 / 3.6: keep `StrictMode`; copy status-page's anti-flash script; `globals.css` has no font variables, so define them with `@theme` in a new `apps/web/index.css`; `@source` already covers apps/web.
- 3.4: `vite:preloadError` reload for stale chunks; `useIsClient` guards left for step 4.
- 3.7 / 3.9 / 3.10: `.local` env files aren't committed; `components.json` `rsc: false`; `dist` already ignored; `AGENTS.md` is gitignored; delete `postcss.config.mjs`.
- Verify: the WASM is fetched by the main thread **and** the worker (one URL, not one fetch); signer dropdown check; Safari smoke test.
- `CLAUDE.md` now points agents at this plan while the migration is in progress.
- Decisions confirmed: install `@miden-sdk/vite-plugin` only for its skill (step 3), `@tailwindcss/vite` instead of PostCSS, `workerMode = "module"` for the cutover with `auto` retried in step 4.
