# tooltip

2026-10-22, golden pair via CLI (`shadcn add tooltip --overwrite`, style base-vega). Migrated from Radix Tooltip.

## Changed

- `tooltip.tsx`: Base `Tooltip`; `bg-primary` and `z-100` dropped (upstream `bg-foreground`); `Tooltip` no longer wraps its own provider.
- `apps/web/app/layout.tsx`: root `TooltipProvider` (delay 0, as before).
- `copy-button.tsx`: `delayDuration` on the root → `delay` on the trigger.
- `account-address.tsx`: `Link > Button` (a button inside a link) → `Button render={<Link />} nativeButton={false}`.
- `TooltipTrigger asChild` sites → `render`.

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- `account-address.tsx` renders the account link as a Next `Link` styled with `buttonVariants({ variant: "link" })`: Base's `Button` with `nativeButton={false}` gives the anchor `role="button"`, which hid it from `getByRole("link")`.

- Tooltip colors follow upstream (foreground background).

## Verify by hand

- Hover an account address and a copy button; the tooltip shows immediately.
