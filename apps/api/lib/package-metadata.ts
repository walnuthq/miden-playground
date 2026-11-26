import type { PackageMetadata } from "@/lib/types";

// What a build reports that the API keeps in `metadata`: a note or
// transaction script's account procedures. api-compile sends `null` when it
// can't tell (a dynamic call is reachable), and nothing for a failed build or
// another kind of package.
export type BuildMetadata = { accountProcedures?: string[] | null };

// The one place a package's `metadata` is decided, on each compile. A MASM
// package carries no schema, so `storage` and `noteStorage` are the ones the
// package already has (a template's hand-written schema), whatever the
// build. `accountProcedures` is the build's: kept when it's a list, `[]`
// included; `null` (api-compile couldn't tell) or absent is dropped, which
// reads the same: no filter. Null when nothing is left.
export const compiledMetadata = (
  current: PackageMetadata | null,
  build: BuildMetadata,
): PackageMetadata | null => {
  const { storage, noteStorage } = current ?? {};
  const { accountProcedures } = build;
  return storage || noteStorage || Array.isArray(accountProcedures)
    ? {
        ...(storage && { storage }),
        ...(noteStorage && { noteStorage }),
        ...(Array.isArray(accountProcedures) && { accountProcedures }),
      }
    : null;
};
