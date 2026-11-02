// Shared by the Worker (examples/index.ts) and scripts/compile-examples.ts,
// which runs with plain `node`: no "@/" imports.

export type ExampleSources = Record<
  string,
  { midenProjectToml: string; rust: string }
>;

// Fingerprint of an example's sources, stored in its compiled.json: a mismatch
// means they were edited without regenerating the snapshot.
export const sourcesHash = async (sources: ExampleSources) => {
  const canonical = JSON.stringify(
    Object.entries(sources)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([dir, { midenProjectToml, rust }]) => [
        dir,
        midenProjectToml,
        rust,
      ]),
  );
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};
