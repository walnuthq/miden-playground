type PackageFiles = Record<string, string>;

// A package's own files: the stored entries under its `<name>/` directory.
// Rows compiled before packages stored only their own files can still hold
// their dependencies' directories.
export const ownFiles = (name: string, files: PackageFiles): PackageFiles =>
  Object.fromEntries(
    Object.entries(files).filter(([path]) => path.startsWith(`${name}/`)),
  );

// The files of a build: the package's own next to each dependency's own
// (`../<dependency>` in its miden-project.toml).
export const buildFiles = (
  own: PackageFiles,
  dependencies: { name: string; files: PackageFiles }[],
): PackageFiles =>
  Object.assign(
    {},
    ...dependencies.map(({ name, files }) => ownFiles(name, files)),
    own,
  );

// The files of an exported zip: a package without dependencies is the zip's
// root, one with dependencies sits in its directory next to theirs.
export const exportFiles = (
  name: string,
  files: PackageFiles,
  dependencies: { name: string; files: PackageFiles }[],
): PackageFiles => {
  const own = ownFiles(name, files);
  if (dependencies.length > 0) {
    return buildFiles(own, dependencies);
  }
  return Object.fromEntries(
    Object.entries(own).map(([path, content]) => [
      path.slice(name.length + 1),
      content,
    ]),
  );
};
