# Case helpers

`apps/api/lib/case.ts` (`kebabCase`) and `apps/web/lib/utils/case.ts` (`snakeCase`) port lodash's word splitting, quirks included (`P2IDNote` → `p-2-id-note`). They build names the Miden compiler checks (the component namespace in `lib/toml.ts`, the trait segment of storage slot names in `storageSlotName`), so keep them identical to lodash and to each other. Don't swap them for a simpler regex.

- `kebabCase` in `apps/web/lib/utils/index.ts` is a different helper, for script names and ids.
- A storage slot is named `<package>::<trait>::<field>`. `storageSlotName` (`apps/web/lib/utils/component.ts`) mirrors the compiler's `derive_storage_slot_name` (miden-base-macros): the package name isn't split into words, only its characters outside `[A-Za-z0-9_]` become `_` (`counter2` stays `counter2`, where `snakeCase` gives `counter_2`); the trait is in snake case. Tutorial 7 shows the name computed from a script the user names freely, so a wrong one blocks its step 4: `lib/utils/component.test.ts` holds names checked against compiled packages.
