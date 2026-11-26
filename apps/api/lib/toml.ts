import { parse } from "smol-toml";
import type { Dependency, MidenProjectToml, PackageType } from "@/lib/types";
import { masmNamespace, sourceFilePath } from "./source-file.ts";

// Whether a MASM source uses the standards library (`use
// miden::standards::…`, or a fully qualified path): its package must then
// depend on miden-standards. A mention in a comment adds it too, which costs
// nothing.
const usesStandards = (masm: string) => /\bmiden::standards\b/.test(masm);

// A package's miden-project.toml, which api-compile assembles: the core and
// protocol libraries always, the standards library when the source uses it,
// and the scripts it depends on by path (`../<name>`, next to it in the
// build's files). "*" resolves to the versions api-compile ships.
export const generateMidenProjectToml = ({
  name,
  version = "0.1.0",
  type,
  masm,
  dependencies,
}: {
  name: string;
  version?: string;
  type: PackageType;
  masm: string;
  dependencies: Dependency[];
}) => {
  let midenProjectToml = `[package]\n`;
  midenProjectToml += `name = "${name}"\n`;
  midenProjectToml += `version = "${version}"\n\n`;
  midenProjectToml += `[lib]\n`;
  midenProjectToml += `kind = "${type}"\n`;
  midenProjectToml += `namespace = "${masmNamespace(name)}"\n`;
  midenProjectToml += `path = "${sourceFilePath(name)}"\n\n`;
  midenProjectToml += `[dependencies]\n`;
  midenProjectToml += `miden-core = "*"\n`;
  midenProjectToml += `miden-protocol = "*"\n`;
  if (usesStandards(masm)) {
    midenProjectToml += `miden-standards = "*"\n`;
  }
  for (const { name } of dependencies) {
    midenProjectToml += `${name} = { path = "../${name}" }\n`;
  }
  return midenProjectToml;
};

export const parseMidenProjectToml = (midenProjectToml: string) =>
  parse(midenProjectToml) as MidenProjectToml;

// The libraries api-compile provides: a manifest names them by version, not
// by path.
export const builtInDependencies = new Set([
  "miden-core",
  "miden-protocol",
  "miden-standards",
]);
