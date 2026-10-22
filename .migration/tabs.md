# tabs

2026-10-22, golden pair via CLI (`shadcn add tabs --overwrite`, style base-vega). Migrated from Radix Tabs.

## Changed

- `tabs.tsx`: Base `Tabs` (gains the `line` variant).

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- Base activates a tab when it receives focus via arrow keys (automatic activation), like Radix's default.

## Verify by hand

- Arrow through the account page tabs.
