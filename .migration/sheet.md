# sheet

2026-10-22, golden pair via CLI (`shadcn add sheet --overwrite`, style base-vega). Migrated from Radix Dialog (as Sheet).

## Changed

- `sheet.tsx`: Base `Dialog` parts; only the sidebar uses it (mobile).

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

## Verify by hand

- Mobile width: open the sidebar sheet, close with Escape and the overlay.
