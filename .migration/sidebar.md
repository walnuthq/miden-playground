# sidebar

2026-10-22, golden pair via CLI (`shadcn add sidebar --overwrite`, style base-vega). Updated; Radix `Slot` replaced by Base `useRender`.

## Changed

- `sidebar.tsx` and `hooks/use-mobile.ts` refreshed. `SidebarMenuButton`/`SidebarMenuSubButton`/`SidebarMenuAction` take `render` instead of `asChild` (`nav-main.tsx`, `footer.tsx`).

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

## Verify by hand

- Collapse the sidebar to icons and back; menu buttons still navigate.
