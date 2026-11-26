// Finds the Miden packages in a folder picked by "Import Project". The folder
// is one package or holds several, each in its own directory, which depend on
// each other through `path = "../<dir>"`. A package is a directory with a
// miden-project.toml whose `[lib] path` names its MASM module. Plain node runs
// the unit tests: relative imports only.
import { parse } from "smol-toml";

const MANIFEST = "miden-project.toml";

// Build outputs and hidden directories: a picked folder lists all of them.
const skippedDirectory = (segment: string) =>
  segment === "target" || segment === "node_modules" || segment.startsWith(".");

const joinPath = (directory: string, path: string) =>
  directory === "" ? path : `${directory}/${path}`;

// The packages' directories (relative to the picked folder's parent, as
// `webkitRelativePath` gives them), each with its manifest's path. Whether a
// directory is a Rust project (it has a Cargo.toml) is told too, to refuse it
// with a reason.
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
      const directory = manifestPath.slice(0, -MANIFEST.length).slice(0, -1);
      return {
        directory,
        manifestPath,
        rust: pathSet.has(joinPath(directory, "Cargo.toml")),
      };
    })
    .sort((a, b) => a.directory.localeCompare(b.directory));
};

// The directories with a Cargo.toml and no miden-project.toml: Rust projects
// from before the switch to MASM, refused with a reason rather than ignored.
export const findCargoOnlyDirectories = (paths: string[]) => {
  const manifests = new Set(
    findPackages(paths).map(({ directory }) => directory),
  );
  return paths
    .filter((path) => {
      const segments = path.split("/");
      return (
        segments.at(-1) === "Cargo.toml" &&
        !segments.slice(0, -1).some(skippedDirectory)
      );
    })
    .map((path) => path.slice(0, -"Cargo.toml".length).slice(0, -1))
    .filter((directory) => !manifests.has(directory))
    .sort();
};

// The path of a package's MASM module, from its manifest's `[lib] path`,
// relative to the picked folder's parent. Undefined when the manifest doesn't
// parse, has no such path, or names something else than a `.masm` file inside
// the package.
export const manifestSourcePath = (directory: string, manifest: string) => {
  let path: unknown;
  try {
    path = (parse(manifest) as { lib?: { path?: unknown } }).lib?.path;
  } catch {
    return undefined;
  }
  if (typeof path !== "string" || !path.endsWith(".masm")) {
    return undefined;
  }
  const segments = path.replace(/^\.\//, "").split("/");
  if (segments.some((segment) => segment === ".." || segment === "")) {
    return undefined;
  }
  return joinPath(directory, segments.join("/"));
};
