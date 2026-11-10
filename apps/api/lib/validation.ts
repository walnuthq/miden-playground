// A package name: what Cargo accepts, as the web app's form does. It becomes
// a directory name and a TOML string.
export const isValidPackageName = (name: unknown): name is string =>
  typeof name === "string" && /^[A-Za-z][A-Za-z0-9_-]{1,63}$/.test(name);

// A network id as the registry's paths take it ("mtst", "mdev", "mm").
export const isValidNetwork = (network: string) =>
  /^[a-z0-9-]{1,32}$/.test(network);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

// What a request may carry. Generous for real projects (the largest example
// has 4 packages), small enough that one request can't queue hours of builds
// or store megabytes.
export const MAX_PACKAGES = 16;
export const MAX_SOURCE_LENGTH = 512_000;
export const MAX_MANIFEST_LENGTH = 16_384;
export const MAX_ID_LENGTH = 128;
// The whole body, in bytes: MAX_PACKAGES sources don't all reach their limit.
export const MAX_BODY_SIZE = 2 * 1024 * 1024;

export const isSource = (value: unknown): value is string =>
  typeof value === "string" && value.length <= MAX_SOURCE_LENGTH;

// An account or note id, as the registry takes it: its format is the
// registry's to check, its length is bounded here.
export const isId = (value: unknown): value is string =>
  typeof value === "string" && value !== "" && value.length <= MAX_ID_LENGTH;

export const isBoundedArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length <= MAX_PACKAGES;

export const isPackageSource = (
  value: unknown,
): value is { midenProjectToml: string; rust: string } =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { midenProjectToml?: unknown }).midenProjectToml ===
    "string" &&
  (value as { midenProjectToml: string }).midenProjectToml.length <=
    MAX_MANIFEST_LENGTH &&
  isSource((value as { rust?: unknown }).rust);

// The packages of an import, keyed by directory.
export const isPackageSources = (
  value: unknown,
): value is Record<string, { midenProjectToml: string; rust: string }> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length <= MAX_PACKAGES &&
  Object.keys(value).every((key) => key.length <= MAX_ID_LENGTH) &&
  Object.values(value).every(isPackageSource);
