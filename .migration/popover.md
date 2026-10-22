# popover

2026-10-22, golden pair via CLI (`shadcn add popover --overwrite`, style base-vega). Migrated from Radix Popover.

## Changed

- `popover.tsx`: Base `Popover`; `z-100` dropped. New upstream parts `PopoverHeader`/`Title`/`Description`.
- `select-consumable-notes-combobox.tsx`: `PopoverTrigger asChild` → `render={<Button … />}`.

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- Popover `Anchor` has no Base equivalent; not used in the app.

## Verify by hand

- Open the consumable-notes picker inside the Create Transaction dialog; it renders above the dialog.
