// Finds the Miden packages in a folder picked by "Import Project". The folder
// is one package or holds several, each in its own directory (e.g. the bank
// example: bank-account, deposit-note, …, which depend on each other through
// `path = "../<dir>"`). A package is a directory with a miden-project.toml and
// its source at src/lib.rs. Plain node runs the unit tests: relative imports
// only.

const MANIFEST = "miden-project.toml";
const SOURCE = "src/lib.rs";

// Build outputs and hidden directories: cargo's target/ holds generated
// lib.rs files (crunchy's `out/lib.rs`), and a picked folder lists all of it.
const skippedDirectory = (segment: string) =>
  segment === "target" || segment === "node_modules" || segment.startsWith(".");

// The packages' directories (relative to the picked folder's parent, as
// `webkitRelativePath` gives them), each with the paths of its manifest and
// source. A package without src/lib.rs is left out.
export const findPackages = (paths: string[]) => {
  const pathSet = new Set(paths);
  return paths
    .filter((path) => {
      const segments = path.split("/");
      return (
        segments.at(-1) === MANIFEST &&
        !segments.slice(0, -1).some(skippedDirectory)
      );
    })
    .map((manifestPath) => {
      const directory = manifestPath.slice(0, -`/${MANIFEST}`.length);
      return {
        directory,
        manifestPath,
        sourcePath: directory === "" ? SOURCE : `${directory}/${SOURCE}`,
      };
    })
    .filter(({ sourcePath }) => pathSet.has(sourcePath))
    .sort((a, b) => a.directory.localeCompare(b.directory));
};
