# switch

2026-10-22, golden pair via CLI (`shadcn add switch --overwrite`, style base-vega). Migrated from Radix Switch.

## Changed

- `switch.tsx`: Base `Switch` (gains `size`).

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- Base names the switch from one `<label for>` only (the last registered); Radix's `<button>` took every label ("Storage mode Public"). The value labels next to the 5 switches (Public/Private, Network/Regular note) lost `htmlFor` so the heading label ("Storage mode", "Note type", "Network note") names the switch, which the e2e locators rely on.

- Base renders a `span role="switch"` with a hidden input; e2e uses `getByRole("switch")` and still works.

## Verify by hand

- Toggle storage mode in Create Wallet with mouse and Space.
