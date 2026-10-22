# dialog

2026-10-22, golden pair via CLI (`shadcn add dialog --overwrite`, style base-vega). Migrated from Radix Dialog.

## Changed

- `dialog.tsx`: Base `Dialog`; overlay is lighter with a backdrop blur; `DialogFooter` gained `showCloseButton`.
- 16 non-modal dialogs in `apps/web`: `onPointerDownOutside`/`onInteractOutside` preventDefault replaced by `disablePointerDismissal` on the root; `z-100`/`z-50` removed from `DialogContent`; `data-modal="false"` added to `DialogContent`.
- `DialogClose asChild` (16) → `render={<Button variant="outline" />}`.
- `packages/ui/src/styles/globals.css`: rule hiding the overlay of `data-modal="false"` dialogs.

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- Base UI renders `Dialog.Backdrop` even when `modal={false}`; Radix rendered no overlay. Handled in app code/CSS (the backdrop would block the tutorial pane), flagged here.
- `disablePointerDismissal` also stops non-modal dialogs from closing when focus moves outside, same as the old preventDefault pair.

## Verify by hand

- Open "Create new wallet" during a tutorial: no backdrop, the tutorial pane scrolls and its buttons work, clicking outside doesn't close the dialog, Escape and Cancel do.
