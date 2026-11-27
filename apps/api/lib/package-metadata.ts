import { declaredSlotNames } from "./storage-slot-names.ts";
import type { NoteSchemaSource, PackageMetadata } from "./types.ts";

// What a build reports that the API keeps in `metadata`: a note or
// transaction script's account procedures. api-compile sends `null` when it
// can't tell (a dynamic call is reachable), and nothing for a failed build or
// another kind of package.
export type BuildMetadata = { accountProcedures?: string[] | null };

// The source a compile is for, and the templates' and example packages'
// sources as shipped, which a note's schema is checked against.
export type CompiledSource = {
  masm: string;
  // Whether the package is an account component: only one declares storage
  // slots (`slotNames`).
  accountComponent?: boolean;
  shipped: (template: NoteSchemaSource) => string | undefined;
};

const sameNames = (left: string[], right: string[]) => {
  const names = new Set(right);
  return (
    names.size === new Set(left).size && left.every((name) => names.has(name))
  );
};

// Whether an account component's storage schema still describes its source:
// the slot names the source declares (its `word("…")` constants) are the
// schema's, as a set. A source whose names can't be read with certainty
// doesn't (lib/storage-slot-names.ts). Only names are compared: a slot whose
// name stays and whose use changes (a map read as a value) keeps a wrong
// type, by decision (spec/remove-rust.md, decision 3).
const storageHolds = (
  storage: NonNullable<PackageMetadata["storage"]>,
  masm: string,
) => {
  const declared = declaredSlotNames(masm);
  return (
    declared !== null &&
    sameNames(
      declared,
      storage.slots.map(({ name }) => name),
    )
  );
};

// A package's `metadata` after a build that failed: its schemas as they are,
// without what the last build read from the code (`accountProcedures`). The
// stale rules below wait for a source that builds: one that doesn't may be a
// typo away from the template's (an unclosed string makes its slot names
// unreadable), and a dropped schema never comes back.
export const failedBuildMetadata = (
  current: PackageMetadata | null,
): PackageMetadata | null => {
  const { storage, slotNames, noteStorage, template } = current ?? {};
  return storage || slotNames || noteStorage
    ? {
        ...(storage && { storage }),
        ...(slotNames && { slotNames }),
        ...(noteStorage && { noteStorage, template }),
      }
    : null;
};

// The one place a package's `metadata` is decided on a compile that built. A
// MASM package carries no schema, so `storage` and `noteStorage` are
// the ones the package already has (a template's hand-written schema),
// unless the source no longer matches them, and then they're dropped for
// good: nothing brings them back.
// - `storage` holds while the source declares the schema's slot names.
// - `noteStorage` holds while the source is byte for byte the template's or
//   example package's as shipped (`template`): a note's inputs have no names
//   in MASM to compare, so any edit drops it, a comment's too. `template`
//   goes with it.
// - `slotNames` is read from the source on each build, for an account
//   component left without a `storage` schema: the names it declares, so the
//   forms don't start empty. It says nothing of a slot's type.
// `accountProcedures` is the build's: kept when it's a list, `[]` included;
// `null` (api-compile couldn't tell) or absent is dropped, which reads the
// same: no filter. Null when nothing is left.
export const compiledMetadata = (
  current: PackageMetadata | null,
  build: BuildMetadata,
  source: CompiledSource,
): PackageMetadata | null => {
  const { template } = current ?? {};
  const storage =
    current?.storage && storageHolds(current.storage, source.masm)
      ? current.storage
      : undefined;
  const noteStorage =
    current?.noteStorage &&
    template !== undefined &&
    source.shipped(template) === source.masm
      ? current.noteStorage
      : undefined;
  const declared =
    !storage && source.accountComponent ? declaredSlotNames(source.masm) : null;
  const slotNames = declared && declared.length > 0 ? declared : undefined;
  const { accountProcedures } = build;
  return storage || slotNames || noteStorage || Array.isArray(accountProcedures)
    ? {
        ...(storage && { storage }),
        ...(slotNames && { slotNames }),
        ...(noteStorage && { noteStorage, template }),
        ...(Array.isArray(accountProcedures) && { accountProcedures }),
      }
    : null;
};
