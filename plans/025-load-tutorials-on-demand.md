# Plan 025: A tutorial's steps load when that tutorial is opened

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. This plan has a decision gate after step 2:
> stop there and report unless its condition holds. When done, update the
> status row for this plan in `plans/README.md` — unless a reviewer
> dispatched you and told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/components/tutorials/index.ts apps/web/components/tutorials/meta.ts apps/web/hooks/use-tutorials.ts apps/web/components/lib/sidebar-layout.tsx apps/web/components/tutorials/tutorial-layout.tsx apps/web/lib/types/tutorial.ts`
> If any changed, compare the "Current state" excerpts against the live code
> before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED (about 26 components read the active tutorial)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Every page of the app sits under a layout that statically imports all twelve
tutorials: their step components (about 9,600 lines) and two embedded store
snapshots. In the build at the planned commit that is one chunk,
`dist/assets/tutorials-*.js`, 318 KB raw (about 94 KB gzip), downloaded and
parsed before any page renders, whether or not a tutorial is open. Most
visits to the script editor, a sandbox or a shared script never open one. The
project has been trimming first-load cost on phones (`spec/mobile-ux.md`);
this is the largest remaining eager chunk of app code.

## Current state

- `apps/web/components/tutorials/index.ts:1-36` — imports the twelve
  tutorials statically and default-exports `tutorials: Tutorial[]`, in order.
  Lines 41-55 check, in dev only, that `meta.ts` lists the same ids and step
  counts.
- `apps/web/components/tutorials/meta.ts` — `tutorialMetas: TutorialMeta[]`
  and `tutorialMeta(id)`: id, number, title, tagline, description, category,
  `initialRoute`, `stepCount`, `requiresWallet`. It exists so the app shell
  can list tutorials before the SDK loads:

  ```ts
  // What the home page's cards and the project switcher show of each tutorial,
  // apart from its steps and state. On its own so the app shell can render them
  // before the SDK loads: the step components import the SDK, so the full
  // tutorials (index.ts) can't be in the shell's graph.
  ```

- `apps/web/lib/types/tutorial.ts:34-44`:

  ```ts
  export type Tutorial = TutorialMeta & {
    networkId: NetworkId;
    state: State;
    store: Store | null;
    starter?: () => Promise<WorkspaceStarter>;
    steps: TutorialStep[];
  };
  ```

- Each tutorial module, e.g.
  `apps/web/components/tutorials/create-and-fund-wallet/index.ts`,
  default-exports a `Tutorial` built from its `state`, `store` and `StepN`
  imports and `tutorialMeta("<id>")`.
- Three importers of the full list:
  - `apps/web/hooks/use-tutorials.ts:5` — uses it at lines 133, 154, 168
    (`tutorials.find(...)` by id, inside async functions that start or
    restart a tutorial), 172 (`tutorials[tutorial.number]`, the next
    tutorial) and 221 (`tutorial: tutorials.find(({ id }) => id === tutorialId)`,
    returned synchronously to every caller of `useTutorials()`).
  - `apps/web/components/lib/project-switcher.tsx:37`
  - `apps/web/components/tutorials/next-tutorial-button.tsx:2`
- `apps/web/components/lib/sidebar-layout.tsx:5` imports
  `components/tutorials/tutorial-layout.tsx`, which imports
  `components/tutorials/tutorial-step.tsx` and `useTutorials`: that is how
  the chunk ends up on every page.
- 26 files under `components`, `hooks` and `pages` call `useTutorials()`.
  Many only need `isTutorial`, the id or the step number.
- Rules that apply (CLAUDE.md, `docs/claude/phone-layout.md`,
  `docs/claude/vite-build.md`, `docs/claude/tutorial-copy.md`,
  `docs/claude/saved-projects.md`): the app shell's static graph imports
  nothing from `@miden-sdk/*`; `vite build` fails otherwise. Tutorials can be
  resumed from saved progress (`enterTutorial` in `use-tutorials.ts`), and
  their e2e specs are the regression net.

## Commands you will need

| Purpose       | Command                                                 | Expected on success  |
| ------------- | ------------------------------------------------------- | -------------------- |
| Build         | `cd apps/web && pnpm build`                             | exit 0               |
| Chunk sizes   | `ls -l apps/web/dist/assets \| grep -i tutorial`        | the tutorial chunks  |
| Preloads      | `grep -o 'modulepreload[^>]*' apps/web/dist/index.html` | the preloaded chunks |
| Typecheck     | `cd apps/web && pnpm typecheck`                         | exit 0               |
| Unit tests    | `cd apps/web && pnpm test`                              | exit 0               |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>`  | exit 0               |

## Scope

**In scope**:

- `apps/web/components/tutorials/index.ts`, a new
  `apps/web/components/tutorials/loaders.ts`
- `apps/web/hooks/use-tutorials.ts`
- `apps/web/components/tutorials/tutorial-layout.tsx`,
  `tutorial-step.tsx`, `next-tutorial-button.tsx`
- `apps/web/components/lib/project-switcher.tsx`
- Callers of `useTutorials()` that read `tutorial.steps`, `tutorial.state`,
  `tutorial.store` or `tutorial.starter` (found in step 2), only as far as
  needed

**Out of scope** (do NOT touch):

- The tutorials' own folders (`components/tutorials/<id>/**`): no step,
  state or store changes.
- `meta.ts`'s contents, tutorial copy, `apps/web/e2e/**`.
- `vite.config.ts` `manualChunks` unless step 4 says so.
- The reducers' tutorial actions.

## Git workflow

- Branch: `perf/tutorials-on-demand` from `main`.
- Conventional commits, e.g. `perf(web): load a tutorial's steps when it opens`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Record the baseline

Run `cd apps/web && pnpm build` and record: the size of
`dist/assets/tutorials-*.js`, and whether `dist/index.html` preloads it.

**Verify**: two numbers in your notes (bytes, preloaded yes/no).

### Step 2: Inventory who needs what (decision gate)

List every use of the full tutorials:

```sh
grep -rn "from \"@/components/tutorials\"" apps/web --include=*.ts --include=*.tsx --exclude-dir=node_modules
grep -rnE "tutorial\??\.(steps|state|store|starter)\b" apps/web/components apps/web/hooks apps/web/pages --include=*.ts --include=*.tsx
```

Classify each hit:

- **meta-only**: needs id, number, title, `initialRoute`, `stepCount`,
  `requiresWallet` → can use `tutorialMetas` / `tutorialMeta(id)`.
- **async**: already inside an async function (starting, restarting,
  resuming a tutorial) → can `await` a loader.
- **render-time**: reads `steps` (or `state`/`store`) synchronously while
  rendering.

**Gate**: continue only if every render-time use is inside the tutorial
panel (`tutorial-layout.tsx`, `tutorial-step.tsx` and components they
render). If a component outside the panel needs `steps`, `state` or `store`
at render time, STOP and report the list: the design below doesn't cover it.

### Step 3: Loaders

`apps/web/components/tutorials/loaders.ts`:

```ts
// One dynamic import per tutorial: its steps and state load when it's
// opened, not with every page. meta.ts lists the same ids, in order.
const loaders: Record<TutorialId, () => Promise<{ default: Tutorial }>> = {
  "create-and-fund-wallet": () =>
    import("@/components/tutorials/create-and-fund-wallet"),
  // … the eleven others …
};

const loaded = new Map<TutorialId, Promise<Tutorial>>();

export const loadTutorial = (id: TutorialId) => {
  let tutorial = loaded.get(id);
  if (!tutorial) {
    tutorial = loaders[id]().then((module) => module.default);
    // A failed chunk load (offline, a deploy in between) can be retried.
    tutorial.catch(() => loaded.delete(id));
    loaded.set(id, tutorial);
  }
  return tutorial;
};
```

`Record<TutorialId, …>` makes TypeScript fail when a tutorial id has no
loader. Move the dev-only consistency check of `index.ts` (ids in order,
step counts) to run per tutorial inside `loadTutorial` in dev
(`import.meta.env.DEV`): compare the loaded tutorial's `steps.length` with
`tutorialMeta(id).stepCount`. Keep the `preview-tutorials` localStorage
block of `index.ts` wherever it still has an effect; delete `index.ts` only
if nothing imports it afterwards.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.

### Step 4: Switch the consumers

- `use-tutorials.ts`: the async call sites (`tutorials.find(...)` at the
  planned lines 133, 154, 168) become `await loadTutorial(id)`; the "next
  tutorial" lookup at line 172 uses `tutorialMetas[tutorial.number]` for the
  id, then `loadTutorial` when the full tutorial is needed. The synchronous
  `tutorial:` it returns becomes the loaded active tutorial or `undefined`
  while it loads: hold it in a small hook
  (`useLoadedTutorial(tutorialId)`: `useState` + `useEffect` calling
  `loadTutorial`, ignoring a result that arrives after the id changed).
  Return the active tutorial's meta as well (`tutorialMeta`), so meta-only
  callers don't wait.
- Meta-only callers found in step 2 (the project switcher, the next-tutorial
  button, anything reading titles or numbers): switch to `tutorialMetas` /
  the returned meta.
- The tutorial panel (`tutorial-layout.tsx`, `tutorial-step.tsx`): render
  nothing (or the existing closed-bar title from the meta) until the active
  tutorial is loaded. Do not add layout: the panel's size and its phone
  behaviour must not change.

**Verify**: `grep -rn "from \"@/components/tutorials\"" apps/web --include=*.ts --include=*.tsx --exclude-dir=node_modules`
→ no match (or only `index.ts` re-exporting, if kept).
`cd apps/web && pnpm typecheck` → exit 0; `pnpm test` → exit 0.

### Step 5: Measure

`cd apps/web && pnpm build`.

**Verify**: `dist/index.html` no longer preloads a chunk containing the
tutorials' steps, and `ls -l dist/assets | grep -i -E "step|tutorial"` shows
per-tutorial chunks (names vary). Record the sizes next to step 1's. If the
build still emits one `tutorials-*` chunk preloaded from `index.html`, read
`manualChunks` in `apps/web/vite.config.ts`: a rule may be grouping
`components/tutorials/**`. Adjust that rule only if it names the tutorials
explicitly; otherwise STOP.

### Step 6: Format and check

**Verify**: `cd apps/web && pnpm exec biome check --write components/tutorials/loaders.ts components/tutorials/index.ts hooks/use-tutorials.ts components/tutorials/tutorial-layout.tsx components/tutorials/tutorial-step.tsx components/tutorials/next-tutorial-button.tsx components/lib/project-switcher.tsx`
→ exit 0; `pnpm typecheck`, `pnpm test`, `pnpm build` → exit 0; root
`pnpm lint` → exit 0.

## Test plan

- No unit test for the loaders (dynamic imports of React components).
- E2E (operator, local: web :3000 + api :3001): the whole suite including
  the `e2e/mobile` projects (`mobile-safari`, `mobile-chrome`,
  `mobile-small`), since the tutorial panel is on every page and has a phone
  layout: `cd apps/web && pnpm test:e2e`. Specifically: every
  `tutorial-*.spec.ts`, the resume specs, `projects.spec.ts`,
  `workspace-switch.spec.ts`. This plan is not done without that run; report
  plainly if you could not run it.
- Manual check for the operator: load `/` with the Network panel open: no
  tutorial step chunk is requested until a tutorial is opened; opening
  tutorial 1 requests one.

## Done criteria

- [ ] `cd apps/web && pnpm build` exits 0 and `grep -o 'modulepreload[^>]*' apps/web/dist/index.html | grep -cE "/tutorials-|create-and-fund-wallet"` prints `0` (the `use-tutorials-*` hook chunk is expected in the preloads)
- [ ] `cd apps/web && pnpm typecheck` and `pnpm test` exit 0
- [ ] Before/after chunk sizes are in your report
- [ ] The operator (or you) ran the e2e suite including `e2e/mobile`; say which
- [ ] `git status` shows only in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The gate of step 2 fails.
- A consumer needs the full tutorial synchronously during a workspace switch
  (e.g. `enterTutorial` is called from a non-async path).
- `pnpm build` fails on the app-shell guard (the entry's static graph
  reached the SDK): a meta-only module started importing a tutorial.
- A tutorial e2e spec fails because the panel is briefly empty (a spec
  asserts a step title immediately after navigation): report the spec; do
  not add waits to specs.
- The measured first-load saving in step 5 is under 30 KB gzip: report the
  numbers and stop before step 6; the change may not be worth its risk.

## Maintenance notes

- A new tutorial now needs three entries: its folder, its meta in
  `meta.ts`, its loader in `loaders.ts` (TypeScript enforces the last).
  Update `docs/claude/tutorial-copy.md`'s "adding a tutorial" section in the
  same pull request.
- A failed chunk load (offline, or a deploy between page load and opening a
  tutorial) now surfaces when a tutorial is opened; the loader retries on
  the next attempt, and the caller should toast like `tutorialStarter` does
  for a failed starter.
- Reviewer: check the phone panel (`MobileTutorialPanel`) for a flash when
  resuming a tutorial on load.
