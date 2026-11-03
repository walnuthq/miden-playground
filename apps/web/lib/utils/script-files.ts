// A script's files (`Script.files`): its source and, for scripts from the API,
// its manifests. Plain node runs the unit tests: relative imports only.
import type { Script, ScriptFiles } from "../types/script.ts";

// The file a script's code is compiled from, and the only one edited.
export const SCRIPT_FILE = "src/lib.rs";

// The files of a script that only has a source (the built-in and mock API's
// scripts). The MASM-only built-ins have none.
export const sourceFiles = (source: string): ScriptFiles =>
  source === "" ? {} : { [SCRIPT_FILE]: source };

export const scriptSource = ({ files }: Pick<Script, "files">) =>
  files[SCRIPT_FILE] ?? "";

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
  const toml = files["miden-project.toml"];
  if (toml === undefined) {
    return files;
  }
  return {
    ...files,
    "miden-project.toml":
      action === "add"
        ? addTomlDependency(toml, name)
        : removeTomlDependency(toml, name),
  };
};
