# separator

2026-10-22, golden pair via CLI (`shadcn add separator --overwrite`, style base-vega). Migrated from Radix Separator.

## Changed

- `separator.tsx`: Base `Separator`.
- `header.tsx`: `data-[orientation=vertical]:h-4` → `data-vertical:h-4`.

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

## Verify by hand
