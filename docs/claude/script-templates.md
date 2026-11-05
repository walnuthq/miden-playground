# Script templates

The "Create script" dialog creates scripts from `apps/api/templates/*.rs` (`lib/templates.ts`): each type with no example, and each example of the web app's `scriptExamples` (`apps/web/lib/types/script.ts`). Every one must compile. `pnpm templates:check` in `apps/api` creates and compiles each through the local API (`pnpm dev`, with api-compile running), then deletes them. Run it after editing a template, and after bumping the SDK, the api-compile image or `templates/project-template`: SDK API changes break templates silently (0.15 replaced `Asset.key: Word` with `Asset.id: AssetId`).

- The counter note and counter script examples import `counter_account` but come without it: tutorial 11 teaches adding the user's own `counter-account` script as a dependency. The check does the same (`userDependencies`), so keep it in sync when an example gains such a dependency.
