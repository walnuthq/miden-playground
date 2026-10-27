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

When bumping `@miden-sdk/*`, also update `CLIENT_VERSION` in `apps/web/lib/utils/store.ts` to the new version. It stamps the stores the tutorials seed from `defaultStore`, and the SDK refuses to import a store stamped by a client newer than the running one. Bump the `@miden-sdk/*` pins in `pnpm-workspace.yaml` `overrides` too. If the new version is younger than pnpm's minimum release age, exempt exactly that version of each package in `minimumReleaseAgeExclude`, and remove the entries once it ages out.

# Vite build (`apps/web`)

`apps/web` is a Vite SPA with React Router, served by a Cloudflare Worker (static assets with SPA fallback, plus the Simple Analytics proxy in `worker/`). `VITE_MIGRATION.md` (repo root) records how it got there and the gotchas met on the way. Before changing `apps/web/vite.config.ts`, read the `vite-wasm-setup`, `frontend-pitfalls` (FP3, FP8, FP17, FP18) and `para-signer` ("Bundler setup") skills.
- `vite.config.ts` replicates the Miden and Para Vite plugins inline. Re-check it on every Para or SDK bump: the list of stubbed optional Para packages (a new optional connector fails to resolve; `@opentelemetry/context-zone` must stay stubbed or zone.js breaks the store's Dexie transactions), and the `@miden-sdk/react` externalization in dev pre-bundling (without it the signer providers can't see `MidenProvider`).
- The app imports the eager entries (`@miden-sdk/miden-sdk`, `@miden-sdk/react`), like its dependencies. Don't import `/lazy`: two entries mean two WASM instances (`WASM_CLASS_MISMATCH`).
- Keep `WasmWebClient.workerMode = "module"` in `apps/web/lib/miden-client.ts`: `auto` breaks the client on Safari (the comment there says why).
- `@miden-sdk/vite-plugin` is a devDependency only for the `vite-wasm-setup` skill it ships, and is not registered: it peers on Vite ≤ 6 and forces `resolve.preserveSymlinks`, which breaks pnpm. Bump it with the SDK, but look up its own latest version: it is versioned separately. Once it supports Vite 8 and drops `preserveSymlinks`, register it and remove its `peerDependencyRules` entry in `pnpm-workspace.yaml`.
- Tailwind goes through `@tailwindcss/vite`, not PostCSS.
- Dev pre-bundling and the production build can diverge, and merging to `main` deploys. After a bump of Vite, Para or the SDK, test the built app: `vite build --mode development && wrangler dev --port 3000` in `apps/web` (port 3000 and the BETA Para key, which Para's production key would reject on localhost), then the e2e suite against it.

# UI components

`packages/ui/src/components` holds stock shadcn components (style `base-vega`, Base UI primitives, `cn` from the `cn` package). Keep them byte-identical to the CLI output so they can be refreshed with `pnpm dlx shadcn@latest add <name> --overwrite` (run in `packages/ui`); Biome ignores that directory on purpose. They need `@import "shadcn/tailwind.css"` in `globals.css` for their `data-*` custom variants.
- Never edit those files. Put layout tweaks in `className` at the call site, and anything global in `packages/ui/src/styles/globals.css`.
- No z-index overrides on overlays: Base UI portals popups to body in open order, so the stock `z-50` stacks correctly.
- Non-modal dialogs (`modal={false}`) also pass `disablePointerDismissal` to `Dialog` and `data-modal="false"` to `DialogContent`; a rule in `globals.css` hides their backdrop, which Base UI renders even for non-modal dialogs.
- Base UI APIs: `render={<X />}` instead of `asChild` (plus `nativeButton={false}` when `X` isn't a button), `Select` needs `items` for `SelectValue` to show labels, and `onValueChange` can receive `null`.
