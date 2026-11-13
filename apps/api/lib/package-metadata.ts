import type { PackageMetadata } from "@/lib/types";

// What the API stores of a build's metadata: an account component's storage
// slots, a note's storage fields and a script's account procedures, or null
// when the build reported none (another kind of package, or an api-compile
// older than them). `accountProcedures` is kept when it's a list, `[]`
// included; `null` (api-compile couldn't tell) is dropped, which reads the
// same as absent: no filter.
export const packageMetadata = ({
  storage,
  noteStorage,
  accountProcedures,
}: PackageMetadata): PackageMetadata | null =>
  storage || noteStorage || Array.isArray(accountProcedures)
    ? {
        ...(storage && { storage }),
        ...(noteStorage && { noteStorage }),
        ...(Array.isArray(accountProcedures) && { accountProcedures }),
      }
    : null;
