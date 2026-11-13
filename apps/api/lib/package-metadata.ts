import type { PackageMetadata } from "@/lib/types";

// What the API stores of a build's schemas: an account component's storage
// slots and a note's storage fields, or null when the build reported neither
// (another kind of package, or an api-compile older than the schemas).
export const packageMetadata = ({
  storage,
  noteStorage,
}: PackageMetadata): PackageMetadata | null =>
  storage || noteStorage
    ? { ...(storage && { storage }), ...(noteStorage && { noteStorage }) }
    : null;
