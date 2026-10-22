# alert-dialog

2026-10-22, golden pair via CLI (`shadcn add alert-dialog --overwrite`, style base-vega). Migrated from Radix AlertDialog.

## Changed

- `packages/ui/src/components/alert-dialog.tsx`: Base `AlertDialog` parts, `Action`/`Cancel` render the project `Button`. New upstream parts: `size`, `AlertDialogMedia`.
- `apps/web`: the only trigger (`asChild`) now uses `render={<Button />}`.

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

## Verify by hand

- Open the alert dialog, check focus lands in it, Escape closes it and focus returns to the trigger.
