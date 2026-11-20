# Raw felts for procedure arguments the form can't type

Status: implemented 2026-11-20 on `feat/raw-felt-arguments` (the plan was
written 2026-11-19 at `7127b64`). It takes the "raw felts fallback" named in
`spec/simulation-follow-ups.md` ("Argument types the form can't type"). The
investigation's answers are below; `docs/claude/simulation.md` has the rules
as built.

## What the investigation found

Against the local api-compile (sdk 0.15, the production image's toolchain),
with a counter given a record, a `NoteIdx`, a `u64`/`u32`/`bool`, an
`Option<Felt>` and a `Vec<Felt>` parameter:

1. **Leaf kinds.** Every parameter of the embedded packages
   (`lib/tutorials/basic-wallet.json`, `apps/api/examples/*/compiled.json`) is
   a `Struct` whose leaves are all `"Felt"`. A fresh compile shows the other
   shapes: a record the package defines is a `Struct` named without a package
   (`pair`); a `u64`, a `u32` and a `bool` are the bare strings `"U64"`,
   `"U32"`, `"I1"`, not structs; an option is `{ "Enum": { "name":
   "option0", … } }`; a `Vec` doesn't compile ("generic type arguments are
   not supported in exported types"). The code read `param.Struct.name`
   unguarded, which throws on the bare strings: fixed with the widening
   (`MidenTypeLayout`). The manifest names a layout once, so the basic
   wallet's `tag` and `note-type` are `note-idx` there and its `recipient`
   `asset-id`: an untyped parameter is labelled with its WIT type instead.
2. **Push order.** A type's felts in field order, the first on top of the
   stack, so pushed last: `push.<last>.….<first>`. The typed cases follow it
   (`account-id` is `prefix`, `suffix` and pushes `push.<suffix>.<prefix>`;
   an `asset` is its id word then its value word). Proved by runs in the
   Simulate tab (`e2e/script-simulate.spec.ts`, "raw felts"): `pick(pair,
   idx, last)` returns each felt as a digit, `1234`; `same_id(id, pair)`
   returns 1 when the pair's raw felts are the typed id's prefix and suffix,
   0 when swapped; `create_note(tag, note_type, recipient)` creates a note.
3. **The 16-felt limit.** midenc refuses to compile such an export: "For
   cross-context calls only up to 16 felt flattened params supported (advice
   provider is not yet supported)" (`frontend/wasm/src/component/
   lift_exports.rs`). No package has one, so the check is only a guard.

Differences from the plan below: `formatProcedureInputs` moved to
`lib/utils/procedure-inputs.ts` (re-exported from `lib/utils/script.ts`) so
the unit tests can load it; the e2e's script is edited in the spec with
`replaceInEditor`, as the spec's other steps do (`e2e/scripts` holds no
contract sources); the procedures list lets a long name wrap, which the
basic wallet's table needed to fit a 320 px screen.

Found by the hand checks and fixed with it: Invoke on a built-in (MASM)
component never compiled, its call written as `<name>::` followed by the
export's full standards path. It is called by name now, and the built-in basic
wallet's exports have signatures, so its `create_note` and
`move_asset_to_note` take their arguments (raw felts for the untyped ones)
from the account page too.

## Why

The arguments form types four parameter types: `Felt`, `Word`, `AccountId`,
`Asset` (`midenTypes`, `apps/web/lib/types/script.ts`). For anything else
(`note-idx`, `asset-id`, a record the component defines) `procedureParams`
leaves `type` undefined (`lib/utils/procedure-inputs.ts`, "Undefined for a
type the forms don't know"), the form prints

> `<name>`: arguments of type `<rawType>` aren't supported yet.

(`components/procedures/procedure-arguments-form.tsx`), and
`procedureArgumentsReady` keeps the run disabled, in the script page's
Simulate tab and in the account page's Invoke dialog. One such parameter makes
the whole procedure uncallable. The embedded basic wallet has several
(`apps/web/lib/tutorials/basic-wallet.json`: `create-note` takes `note-idx`
and `asset-id` values).

A note's storage already has the fallback: when a field can't be typed, the
user enters felts (`lib/utils/note-storage.ts`,
`components/procedures/note-storage-fields.tsx`). This plan gives procedure
arguments the same, per parameter.

All paths below are under `apps/web`.

## What the manifest says about a type

Each parameter in a compiled package's export carries its layout, not only its
name. From `lib/tutorials/basic-wallet.json`:

```json
{
  "Struct": {
    "name": "miden:base/core-types@1.0.0/note-idx",
    "repr": "Default",
    "size": 4,
    "fields": [
      {
        "name": "inner",
        "index": 0,
        "align": 4,
        "offset": 0,
        "ty": {
          "Struct": {
            "name": "miden:base/core-types@1.0.0/felt",
            "size": 4,
            "fields": [
              { "name": "inner", "index": 0, "offset": 0, "ty": "Felt" }
            ]
          }
        }
      }
    ]
  }
}
```

So a struct can be flattened to its `"Felt"` leaves, in field order: `note-idx`
is one felt, `asset-id` (a word) four. `MidenTypeStruct` in
`lib/types/script.ts` only declares `name` today (`repr` and `size` are in a
comment); `decodeProcedureResult` already reads `size` through a cast.

## Step 1: investigate before building (STOP conditions)

Answer these, in the PR description, before writing the feature (answered
above):

1. **Leaf kinds.** Dump the `ty` values of every export in
   `lib/tutorials/*.json`, `lib/examples/*/compiled.json` and one freshly
   compiled script with a record parameter, an `Option` and a list. Which
   `ty` shapes exist besides `{ "Struct": … }` and `"Felt"`? Only structs
   whose leaves are all `"Felt"` are in scope. Everything else stays
   "not supported yet".
2. **Push order.** How do a struct's leaves map to the stack? Today
   `formatProcedureInputs` (`lib/utils/script.ts:134`) pushes parameters in
   reverse, an `AccountId` as `push.<suffix>.<prefix>` and an `Asset` as two
   words. Establish the rule from those two cases and the manifest's field
   order for `account-id` and `asset` (expected: leaves pushed in reverse
   field order, so the first leaf ends on top). Prove it by running, in the
   Simulate tab, one procedure with a typed `AccountId` argument and the same
   call with the equivalent raw felts: same result.
3. **The 16-felt limit.** A call passes at most 16 felts on the stack. Find
   what the compiler does past that (indirect arguments through memory or
   advice). If the manifest doesn't say, a procedure whose flattened
   parameters exceed 16 felts stays unsupported, with that reason.

**STOP and report** if 2 can't be established with a run, or if 1 shows that
the layout is missing from packages compiled by the production api-compile
(then the fallback has nothing to count felts with).

## Step 2: the fallback

### Types and helpers (`lib/types/script.ts`, `lib/utils/procedure-inputs.ts`)

- Widen `MidenTypeStruct` to the layout: `name: string` (not only the four
  known names), optional `size`, optional `fields` with `ty`. Keep
  `midenTypes[param.Struct.name]` lookups working (they already cast).
- `feltCount(type: MidenTypeStruct): number | undefined`: the number of
  `"Felt"` leaves, `undefined` when the layout is missing or has another leaf
  kind. Pure, no SDK import: this file's unit tests run on plain node.
- `ProcedureParam` gains `feltCount?: number`, set by `procedureParams` when
  `type` is undefined.
- `ProcedureArgument` gains `{ type: "Felts"; values: string[] }`.
  `emptyProcedureArgument` can't build it from a `MidenType`: give the form a
  separate `emptyFeltsArgument(count)`.
- `procedureArgumentError`: every value passes `isFelt`, else "Not a field
  element."
- `procedureArgumentsReady`: a parameter is ready when it has a `type` **or** a
  `feltCount`, and a valid argument. Also false when the flattened total is
  over 16 (question 3), unless the investigation found the rule.
- `MidenInput.type` gains `"Felts"`, its `value` the JSON array of the felts
  as decimal strings, in field order. `encodeProcedureArguments` emits it.
- `formatProcedureInputs` (`lib/utils/script.ts`): a `"Felts"` case pushing
  them in the order question 2 established. This is also where the existing
  `// TODO calling convention differs between MASM and Rust` sits: leave the
  typed cases exactly as they are.

### Form (`components/procedures/procedure-arguments-form.tsx`)

- For a parameter with no `type` and a `feltCount`: a labelled group, the
  label showing the `rawType` and "N felts", with N felt inputs (the `Felt`
  field's `Input`, `font-mono`, same placeholder), in field order, each with
  the leaf's field path as its `aria-label` when the layout names it
  (`inner`, `a`…`d`). One felt: one input, no group chrome.
- No `type` and no `feltCount`: the current sentence stays.
- A line under the group: "Entered as raw felts: the form doesn't know this
  type." Match the wording of the note storage hint in
  `components/procedures/note-storage-fields.tsx`.
- The form stays stateless: values live in the caller's `ProcedureArguments`.

### Callers

`components/procedures/procedures-list.tsx`,
`components/account/invoke-procedure-arguments-dialog.tsx` and
`hooks/use-simulation.ts` go through `procedureParams`,
`procedureArgumentsReady` and `encodeProcedureArguments`, so they should need
no change. Read each to confirm nothing else branches on `type === undefined`
(`grep -rn "rawType" apps/web/components apps/web/hooks apps/web/lib`).

`lib/utils/note-storage.ts` builds `ProcedureParam`s with a `type` always:
untouched. The typed fields of the four known types: untouched, no "enter as
raw felts" switch for them in this plan.

## Known limit, to state in the UI copy or the docs

A `note-idx` names an output note created earlier in the same transaction. A
lone call has none, so `move_asset_to_note` and the like can now be _run_, and
will fail in the VM unless the index is valid. That is expected: the Simulate
tab reports the failure like any other. Running several calls in one
transaction is a separate feature (`spec/simulation-follow-ups.md`).

## Tests

Extend `lib/utils/procedure-inputs.test.ts`, following its `describe` blocks:

- `feltCount`: 1 for `note-idx`, 4 for `asset-id` (take both layouts from
  `lib/tutorials/basic-wallet.json`), `undefined` without `fields`, and for a
  non-felt leaf.
- `procedureParams`: an unknown type gets `feltCount`, a known one doesn't.
  The existing "leaves a type the forms don't know without a type" case stays
  true.
- Validation: a `Felts` argument with a non-felt is an error; the 16-felt
  total.
- `encodeProcedureArguments` and `formatProcedureInputs`: a `Felts` input
  pushes in the established order; and the equivalence case from question 2
  as a string comparison (an `AccountId`'s two felts entered raw produce the
  same pushes as the typed argument).

E2E: extend `e2e/script-simulate.spec.ts` with one procedure taking an
untyped parameter (the investigation's test script, added under
`e2e/scripts` like the existing ones): fields appear, the run is enabled once
they're valid, and the result or the VM's error shows in the console. Read
`docs/claude/simulation.md` and `docs/claude/script-editor.md` first.

## Checks

- `pnpm lint`, `pnpm typecheck`, `pnpm --filter miden-playground-web test`.
- The script-simulate spec, and tutorials 6 to 8 and 10 locally (they use
  the Invoke dialog and the form): web on :3000, api on :3001.
- `e2e/mobile` projects: the group of inputs must not overflow at 320 px.
- `grep -rn "aren't supported yet" apps/web`: the sentence remains only for
  parameters without a felt layout. Update
  `spec/simulation-follow-ups.md` ("Argument types the form can't type") and
  `docs/claude/simulation.md` with what is now possible and what isn't.
- `grep -rn "supported" apps/web/components/tutorials`: no tutorial step
  describes the old message.

## Out of scope

- Typed fields for records, options and lists (per type, with the first
  example that needs one).
- Several calls in one run, advice inputs, non-fungible assets.
- Transaction scripts' `word` argument and note storage: they have their own
  inputs.
