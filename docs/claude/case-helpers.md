# Case helpers

`apps/api/lib/case.ts` (`kebabCase`) and `apps/web/lib/utils/case.ts` (`snakeCase`) port lodash's word splitting, quirks included (`P2IDNote` → `p-2-id-note`). They build names the Miden compiler checks (the component namespace in `lib/toml.ts`, storage slot names in `storageSlotName`), so keep them identical to lodash and to each other. Don't swap them for a simpler regex.

- `kebabCase` in `apps/web/lib/utils/index.ts` is a different helper, for script names and ids.
