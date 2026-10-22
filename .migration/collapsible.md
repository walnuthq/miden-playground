# collapsible

2026-10-22, golden pair via CLI (`shadcn add collapsible --overwrite`, style base-vega). Migrated from Radix Collapsible.

## Changed

- `collapsible.tsx`: Base `Collapsible`.
- `apps/web/components/lib/nav-main.tsx`: `Collapsible render={<SidebarMenuItem />}`; the chevron moved from an `<svg>` trigger inside `SidebarMenuAction` to `CollapsibleTrigger render={<SidebarMenuAction />}`; `group-data-[state=open]` became `group-data-open`.

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- Base sets `data-open`/`data-closed`, not `data-state`.

## Verify by hand

- Toggle the Accounts and Notes sections in the sidebar; the chevron rotates and the sub-items show and hide.
