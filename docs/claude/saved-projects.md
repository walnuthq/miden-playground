# Saved projects and resumable tutorials

A saved project is the app state (`stateSerializer`) plus the client store as `exportStore()` dumps it, secret keys included (`apps/web/lib/utils/project.ts`, `hooks/use-projects.ts`). Leaving a tutorial saves it, and starting it again resumes it (`hooks/use-tutorials.ts`). Its step shows from `State.tutorialProgress`, without reading the snapshots.
- Snapshots go in their own IndexedDB database, `PlaygroundProjects`. Never put "miden" in its name, in any case: `clearMidenStorage()`, which runs before every store import, deletes every database whose name contains it.
- `leaveTutorial()` exports the current store, so call it before `switchNetwork`.
- Snapshots carry the client version that wrote them. An SDK bump migrates them on import, but a rollback makes the SDK refuse them. `popState` then starts the tutorial over from `fallbackState`.
- A network reset (testnet, or Partner Mainnet before public mainnet) invalidates them: `isRestorable` compares their genesis header with `genesisBlockHeader` in `lib/utils/store.ts`, so update that header with the reset.
