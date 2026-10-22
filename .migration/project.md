# project

2026-10-22, whole-project migration to Base UI with the shadcn CLI (`components.json` style `new-york` → `base-vega` in `packages/ui` and `apps/web`). Radix is gone.

## Dependency swap

- Removed `radix-ui`, `clsx`, `tailwind-merge` from `packages/ui`.
- Added `cn@0.5.0` (shadcn's compiled clsx + tailwind-merge, what the registry now imports). `src/lib/utils.ts` re-exports it, so app imports of `@workspace/ui/lib/utils` keep working.
- `@base-ui/react` stays at 1.9.0 (latest).
- Added `shadcn@4.22.1` and `@import "shadcn/tailwind.css"` in `globals.css`: the base styles' custom variants (`data-horizontal`/`data-vertical` → `data-orientation`, `data-open`/`data-checked`/`data-disabled`, …) live there. `shadcn init` adds it; switching styles by hand doesn't, and tabs laid out side by side without it.
- Lockfile has no `radix-ui` left.

## Components

All 31 remaining components re-added with `shadcn add <c> --overwrite` and left as the CLI wrote them (Biome ignores the directory). `progress.tsx` deleted (unused). Local tweaks removed, not moved: `z-100` on popups, select `position="popper"`, tooltip `bg-primary`, sonner `zIndex: 60`.

## App-code sweep

- `asChild` → `render` (47 sites + status-page).
- Non-modal dialogs: `disablePointerDismissal`, `data-modal="false"`, no z-index classes.
- Select `items` + null-safe handlers (9 Selects).
- Root `TooltipProvider`; tooltip `delay` on the trigger.
- Radix data attributes/CSS vars (`data-[state=open]`, `--radix-*`, `data-[orientation]`) replaced.
- Unsized `DropdownMenuContent` got `w-auto`.

## Result

`pnpm lint` and `pnpm typecheck` pass (3/3 workspaces). See the PR for the e2e run.
