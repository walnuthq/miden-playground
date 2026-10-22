# select

2026-10-22, golden pair via CLI (`shadcn add select --overwrite`, style base-vega). Migrated from Radix Select.

## Changed

- `select.tsx`: Base `Select`; `z-100` and the default `position="popper"` dropped (upstream uses item-aligned positioning).
- 9 Selects in `apps/web`: `items` added (record or `{ value, label }[]`) so `SelectValue` shows labels; handlers accept `string | null`; `""` state passed as `null` so the placeholder shows.

Leftover scan `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` on this file: clean.

## Left alone

- `cmdk` (command), `sonner`: not Radix, only the wrappers were refreshed.

## Behavior changes

- The upstream trigger renders `Select.Icon` with `render={<ChevronDownIcon />}`; Base's default `▼` child lands inside the svg. Invisible, but it is in the trigger's `textContent`, so e2e assertions on Select triggers use `toContainText` instead of `toHaveText` (tutorials 7, 9, 10, 11).

- Item-aligned positioning by default (the list opens over the trigger, on the selected item) instead of a popper below it.

## Verify by hand

- Open each Select in the Create Script / Deploy Account dialogs: the trigger shows labels, not ids, and the placeholder shows when empty.
