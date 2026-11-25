// A script is one MASM file next to its generated miden-project.toml. Both
// are named from the package name, which is all the web app and plain node
// scripts need to find them: relative imports only, none at all here.

// The package's MASM namespace, its `[lib] namespace`: what a dependent
// script `use`s (`use counter_account`). A MASM path segment can't hold `-`.
export const masmNamespace = (packageName: string) =>
  packageName.replaceAll("-", "_");

// The package's source file, at the package root: `counter-account` is
// `counter_account.masm`.
export const sourceFilePath = (packageName: string) =>
  `${masmNamespace(packageName)}.masm`;

export const MANIFEST_FILE = "miden-project.toml";

// The files of a package the web app shows (and edits: the source only),
// without the `<name>/` prefix they're stored under.
export const scriptFilePaths = (packageName: string) =>
  [sourceFilePath(packageName), MANIFEST_FILE] as const;
