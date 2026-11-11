# Plan 009: A compile result never overwrites edits made while it ran

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/hooks/use-scripts.ts apps/web/hooks/use-compile-script.ts apps/web/components/global-context/reducer/script.ts apps/web/components/global-context/reducer/index.ts apps/web/lib/utils/script.ts`
> Plan 008 edits `reducer/script.ts` (early returns, no `defaultScript`):
> expected. On any other mismatch with the excerpts below, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/008-reducers-ignore-missing-items.md
- **Category**: bug
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

A Rust compile takes seconds and the editor stays editable meanwhile. When
the API answers, the whole response is merged over the script in state: the
source that was sent replaces what the user typed since, the script is marked
"compiled" and holds the old package. The editor still shows the new text, so
nothing looks wrong, but a deploy uses the old package and a reload or a
project save loses the edits. The merge also resets `createdAt` on every
compile. After this plan, a result is applied only if the script still has
the source and dependencies that were compiled, and only compile-owned fields
are written.

## Current state

- `apps/web/hooks/use-scripts.ts:84-95`:

  ```ts
  const compileScript = async (script: Script) => {
    const { script: compiledScript, error } = await apiCompileScript(script);
    if (compiledScript) {
      dispatch({
        type: "UPDATE_SCRIPT",
        payload: {
          script: compiledPackageToScript(compiledScript),
        },
      });
    }
    return { script: compiledScript, error };
  };
  ```

- `apps/web/lib/utils/script.ts:188-200` — `defaultScript()` carries
  `createdAt: Date.now()`, `readOnly: false`, etc., all spread into the
  payload:

  ```ts
  export const compiledPackageToScript = (
    compiledPackage: CompiledPackage,
  ): Script => ({
    ...defaultScript(),
    ...compiledPackage,
    procedureExports: compiledPackage.error
      ? []
      : compiledPackage.exports.map((manifestExport) => ({
          ...defaultProcedureExport(),
          ...manifestExport.Procedure,
          readOnly: isReadOnlyProcedure(manifestExport.Procedure),
        })),
  });
  ```

- `apps/web/lib/types/script.ts:144-158`:

  ```ts
  export type CompiledPackage = Pick<
    Script,
    | "id" | "name" | "type" | "status" | "masm" | "files" | "commitment"
    | "masp" | "exports" | "error" | "warnings" | "dependencies"
  >;
  ```

  (`files` matters: the API generates `Cargo.toml` and `miden-project.toml`,
  which the script page's Explorer shows.)

- `apps/web/lib/api.ts:48-57` — what a compile sends: `script.name`,
  `files: { [SCRIPT_FILE]: scriptSource(script) }`, and
  `dependencies: script.dependencies.map(({ id }) => id)`.

- `apps/web/lib/utils/script-files.ts:6,13-14`:

  ```ts
  export const SCRIPT_FILE = "src/lib.rs";
  export const scriptSource = ({ files }: Pick<Script, "files">) =>
    files[SCRIPT_FILE] ?? "";
  ```

  This module loads in plain node (its imports are relative): the reducer
  tests can import a reducer that uses it.

- `apps/web/components/lib/editor.tsx:209-218` — typing during a compile:

  ```ts
  : (content) =>
      updateScript({
        id: script.id,
        status: "draft",
        files: { ...script.files, [SCRIPT_FILE]: content ?? "" },
        masm: "",
      })
  ```

- `apps/web/hooks/use-compile-script.ts:11-56` — `useCompileScript(script)`
  calls `compileScript(script)`, then logs to the editor console with
  `append({ level, text, output, compile })`. Levels in use: `"info"`,
  `"error"`, `"warning"`, `"success"`.

- `apps/web/components/global-context/reducer/script.ts` — `ScriptAction`
  union at lines 5-55 (each member `{ type: "…"; payload: … }`), reducer
  `switch` below. After plan 008, `UPDATE_SCRIPT` returns `state` when the
  script is missing.
- `apps/web/components/global-context/reducer/index.ts:82-98` — the root
  reducer lists every script action type in a `case` group that calls
  `scriptReducer(state, action)`. A new action type must be added there or it
  is silently unhandled.

## Commands you will need

| Purpose       | Command                                                | Expected on success |
| ------------- | ------------------------------------------------------ | ------------------- |
| Unit tests    | `cd apps/web && pnpm test`                             | exit 0, `fail 0`    |
| Typecheck     | `cd apps/web && pnpm typecheck`                        | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write <files>` | exit 0              |

## Scope

**In scope**:

- `apps/web/components/global-context/reducer/script.ts`, `script.test.ts`,
  `index.ts`
- `apps/web/hooks/use-scripts.ts` (`compileScript` only)
- `apps/web/hooks/use-compile-script.ts`

**Out of scope** (do NOT touch):

- `compiledPackageToScript` and its other callers (imports, examples).
- `apps/web/lib/api.ts`, `apps/api/**`.
- Disabling the editor during a compile: a decision not taken here.
- `components/script/script.tsx`.

## Git workflow

- Branch: `fix/compile-keeps-newer-edits` from `main`.
- Conventional commit, e.g. `fix(web): keep edits made while a script compiles`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the `SCRIPT_COMPILED` action and its tests

In `reducer/script.ts`:

- Add `import { scriptSource } from "@/lib/utils/script-files";`.
- Add to `ScriptAction`:

  ```ts
  | {
      type: "SCRIPT_COMPILED";
      payload: {
        // The compiled package, as a script.
        script: Script;
        // What was sent to the compiler.
        source: string;
        dependencyIds: string[];
      };
    }
  ```

- Add the case:

  ```ts
  case "SCRIPT_COMPILED": {
    const { script, source, dependencyIds } = action.payload;
    const current = state.scripts.find(({ id }) => id === script.id);
    // Deleted or edited since the compile started: the result describes
    // another source, so the script stays as it is (a draft).
    if (
      !current ||
      scriptSource(current) !== source ||
      current.dependencies.map(({ id }) => id).join() !== dependencyIds.join()
    ) {
      return state;
    }
    const {
      status, masm, files, commitment, masp, exports,
      procedureExports, error, warnings, dependencies,
    } = script;
    return {
      ...state,
      scripts: state.scripts.map((item) =>
        item === current
          ? {
              ...item,
              status, masm, files, commitment, masp, exports,
              procedureExports, error, warnings, dependencies,
              updatedAt: Date.now(),
            }
          : item,
      ),
    };
  }
  ```

  (Biome will reflow the destructuring: one field per line is fine.)

- In `reducer/index.ts`, add `case "SCRIPT_COMPILED":` to the group that
  calls `scriptReducer`.

In `script.test.ts`, add: applied when source and dependency ids match
(fields merged, `createdAt` and `name` of the current script kept, other
scripts keep identity); returns the same `state` object when the current
source differs; when the dependency ids differ; when the script is missing.

**Verify**: `cd apps/web && pnpm test` → exit 0; `pnpm typecheck` → exit 0.

### Step 2: Dispatch it from `compileScript`

In `hooks/use-scripts.ts`, `compileScript` becomes:

```ts
const compileScript = async (script: Script) => {
  const source = scriptSource(script);
  const dependencyIds = script.dependencies.map(({ id }) => id);
  const { script: compiledScript, error } = await apiCompileScript(script);
  if (compiledScript) {
    dispatch({
      type: "SCRIPT_COMPILED",
      payload: {
        script: compiledPackageToScript(compiledScript),
        source,
        dependencyIds,
      },
    });
  }
  return { script: compiledScript, error };
};
```

Import `scriptSource` from `@/lib/utils/script-files` if the file doesn't
already.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.
`grep -n "SCRIPT_COMPILED" apps/web/hooks/use-scripts.ts` → 1 match.

### Step 3: Tell the user when the result was dropped

In `hooks/use-compile-script.ts`, keep the latest script in a ref and compare
after the compile:

```ts
const latest = useRef(script);
latest.current = script;
```

After `setCompiling(false)` and the `if (!compiledScript) { … return; }`
block, add:

```ts
const current = latest.current;
if (current && scriptSource(current) !== scriptSource(script)) {
  append({
    level: "info",
    text: `${script.name} changed while it compiled: compile again to update its package.`,
  });
  return;
}
```

Import `useRef` from `react` and `scriptSource` from
`@/lib/utils/script-files`.

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write hooks/use-scripts.ts hooks/use-compile-script.ts components/global-context/reducer`
→ exit 0; `pnpm test` → exit 0.

## Test plan

- Unit: the four `SCRIPT_COMPILED` cases of step 1 in `script.test.ts`.
- E2E (operator, local only: web on :3000, api on :3001 with the compile
  service): `cd apps/web && pnpm test:e2e e2e/script-*.spec.ts`. No new spec
  is required; say in your report that the manual check below was not run if
  you can't run the app.
- Manual check for the operator: open a script, click Compile, type in the
  editor before it finishes; after the compile the status stays "draft", the
  console shows the "changed while it compiled" line, and a reload keeps the
  typed text.

## Done criteria

- [ ] `cd apps/web && pnpm test` exits 0, with the four new cases
- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `grep -rn "SCRIPT_COMPILED" apps/web/components/global-context/reducer/index.ts` → 1 match
- [ ] `grep -n "UPDATE_SCRIPT" apps/web/hooks/use-scripts.ts` → 1 match (in `updateScript` only)
- [ ] `git status` shows only the in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `compileScript` in `use-scripts.ts` doesn't match the excerpt.
- The tutorials' e2e specs (if you can run them) fail because a tutorial
  step compiles a script whose state copy differs from what was sent (e.g. a
  step that edits the source programmatically right after starting a
  compile): report which step.
- `scriptSource(current) !== source` is true in the unit test for an
  unedited script (the API normalizes the source): report.

## Maintenance notes

- The console line names a button ("compile again"): if the Compile button
  is renamed, update it, and grep `apps/web/components/tutorials` for stale
  copy as CLAUDE.md asks.
- `compiledPackageToScript` still builds a full `Script` for imports and
  examples, where a full replacement is wanted.
- Not done here: cancelling the in-flight compile request when the user
  edits. It would save compile-service time and is a separate change in
  `lib/api.ts` (an `AbortSignal`).
