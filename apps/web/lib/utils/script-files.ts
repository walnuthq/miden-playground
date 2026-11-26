// A script's files (`Script.files`): its MASM source and, for scripts from
// the API, its generated miden-project.toml. Both are named from the package
// name, by the API's own helper. Plain node runs the unit tests: relative
// imports only.
import {
  MANIFEST_FILE,
  scriptFilePaths as packageFilePaths,
  sourceFilePath,
} from "../../../api/lib/source-file.ts";
import type { Script, ScriptFiles } from "../types/script.ts";

export { MANIFEST_FILE, sourceFilePath };

// The file a script is assembled from, and the only one edited:
// `counter-account` is `counter_account.masm`.
export const scriptSourcePath = ({ name }: Pick<Script, "name">) =>
  sourceFilePath(name);

// The files a script can have, the source first, in the order the Explorer
// lists them.
export const scriptFilePaths = ({ name }: Pick<Script, "name">) =>
  packageFilePaths(name);

// The files of a script that only has a source (the built-in scripts and the
// packages embedded for the tutorials). The built-in libraries have none.
export const sourceFiles = (name: string, source: string): ScriptFiles =>
  source === "" ? {} : { [sourceFilePath(name)]: source };

export const scriptSource = (script: Pick<Script, "name" | "files">) =>
  script.files[scriptSourcePath(script)] ?? "";

// The files after the source was edited: the manifest stays the API's until
// the next compile.
export const filesWithSource = (
  script: Pick<Script, "name" | "files">,
  source: string,
): ScriptFiles => ({ ...script.files, [scriptSourcePath(script)]: source });

// A path dependency of miden-project.toml, as the API writes it
// (`generateMidenProjectToml` in apps/api/lib/toml.ts).
const dependencyLine = (name: string) => `${name} = { path = "../${name}" }`;

// The line range of the `[dependencies]` section's entries: from its header to
// its last non-blank line before the next section.
const dependenciesSection = (lines: string[]) => {
  const header = lines.findIndex((line) => line.trim() === "[dependencies]");
  if (header === -1) {
    return undefined;
  }
  const next = lines.findIndex(
    (line, index) => index > header && line.trim().startsWith("["),
  );
  let last = (next === -1 ? lines.length : next) - 1;
  while (last > header && lines[last]?.trim() === "") {
    last -= 1;
  }
  return { header, last };
};

// miden-project.toml with a dependency on another script. Adding a dependency
// is local until the next compile, which replaces the file with the API's.
export const addTomlDependency = (toml: string, name: string) => {
  const lines = toml.split("\n");
  const section = dependenciesSection(lines);
  if (!section || lines.includes(dependencyLine(name))) {
    return toml;
  }
  lines.splice(section.last + 1, 0, dependencyLine(name));
  return lines.join("\n");
};

export const removeTomlDependency = (toml: string, name: string) =>
  toml
    .split("\n")
    .filter((line) => line !== dependencyLine(name))
    .join("\n");

// The script's files after adding or removing a dependency: miden-project.toml
// follows, when the script has one.
export const filesWithDependency = (
  files: ScriptFiles,
  name: string,
  action: "add" | "remove",
): ScriptFiles => {
  const toml = files[MANIFEST_FILE];
  if (toml === undefined) {
    return files;
  }
  return {
    ...files,
    [MANIFEST_FILE]:
      action === "add"
        ? addTomlDependency(toml, name)
        : removeTomlDependency(toml, name),
  };
};
