# dropdown-menu

2026-10-22, golden pair via CLI (`shadcn add dropdown-menu --overwrite`, style base-vega). Migrated from Radix DropdownMenu.

## Changed

- `dropdown-menu.tsx`: Base `Menu` parts (`Positioner`/`Popup`, `SubmenuRoot`, `RadioGroup`, `GroupLabel`).
- `DropdownMenuTrigger asChild` (16 + status-page) → `render={<Button … />}`.
- `DropdownMenuContent` without a width got `className="w-auto"` (upstream sizes the popup to the trigger with `w-(--anchor-width)`, which wrapped long labels).
- `project-switcher.tsx`: `data-[state=open]` → `data-popup-open`, `--radix-dropdown-menu-trigger-width` → `--anchor-width`.
- `DropdownMenuRadioItem` call sites: `closeOnClick` added.
- `select-account-dropdown-menu.tsx`: labelled Wallets/Faucets sections wrapped in `DropdownMenuGroup` (`GroupLabel` labels its group).

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- Base `Menu.RadioItem` defaults to `closeOnClick={false}` (Radix closed the menu on select). The two picker menus (`select-account-dropdown-menu.tsx`, `select-transaction-type-dropdown-menu.tsx`) pass `closeOnClick` explicitly at the call site to keep the old behavior; the component is untouched. Plain items still close on click (default `true`).

## Verify by hand

- Open a row action menu and the project switcher; arrow keys move, typeahead works, Escape closes and refocuses the trigger, picking a radio item updates the trigger label.
