// A package name: what Cargo accepts, as the web app's form does. It becomes
// a directory name and a TOML string.
export const isValidPackageName = (name: unknown): name is string =>
  typeof name === "string" && /^[A-Za-z][A-Za-z0-9_-]{1,63}$/.test(name);

// A network id as the registry's paths take it ("mtst", "mdev", "mm").
export const isValidNetwork = (network: string) =>
  /^[a-z0-9-]{1,32}$/.test(network);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const isPackageSource = (
  value: unknown,
): value is { midenProjectToml: string; rust: string } =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { midenProjectToml?: unknown }).midenProjectToml ===
    "string" &&
  typeof (value as { rust?: unknown }).rust === "string";
