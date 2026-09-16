import { kebabCase } from "lodash";
import { parse } from "smol-toml";
import type { Dependency, MidenProjectToml, PackageType } from "@/lib/types";

const extractTraitName = (rust: string) => {
  const pattern =
    /#\[\s*component\b[^\]]*\]\s*(?:#\[[^\]]*\]\s*)*(?:pub(?:\([^)]*\))?\s+)?(?:unsafe\s+)?trait\s+([A-Za-z_]\w*)/;
  const match = rust.match(pattern);
  return match ? match[1] : null;
};

export const generateCargoToml = ({
  name,
  version = "0.1.0",
}: {
  name: string;
  version?: string;
}) => {
  let cargoToml = `[package]\n`;
  cargoToml += `name = "${name}"\n`;
  cargoToml += `version = "${version}"\n`;
  cargoToml += `edition = "2024"\n\n`;
  cargoToml += `[lib]\n`;
  cargoToml += `crate-type = ["cdylib"]\n\n`;
  cargoToml += `[dependencies]\n`;
  cargoToml += `miden = "0.14"\n\n`;
  cargoToml += `[build-dependencies]\n`;
  cargoToml += `miden-sdk-build-script-support = "0.14"\n\n`;
  return cargoToml;
};

export const generateMidenProjectToml = ({
  name,
  version = "0.1.0",
  type,
  rust,
  dependencies,
}: {
  name: string;
  version?: string;
  type: PackageType;
  rust: string;
  dependencies: Dependency[];
}) => {
  const traitName = extractTraitName(rust) ?? name;
  let midenProjectToml = `[package]\n`;
  midenProjectToml += `name = "${name}"\n`;
  midenProjectToml += `version = "${version}"\n\n`;
  midenProjectToml += `[lib]\n`;
  midenProjectToml += `kind = "${type}"\n`;
  switch (type) {
    case "account-component": {
      midenProjectToml += `namespace = "miden:${name}/${kebabCase(traitName)}@${version}"\n`;
      break;
    }
    case "note": {
      midenProjectToml += `namespace = "miden:${name}/miden-${kebabCase(traitName)}@${version}"\n`;
      break;
    }
    case "tx-script": {
      midenProjectToml += `namespace = "miden:base/transaction-script@1.0.0"\n`;
      break;
    }
  }
  midenProjectToml += `path = "src/lib.rs"\n\n`;
  midenProjectToml += `[dependencies]\n`;
  midenProjectToml += `miden-core = "*"\n`;
  midenProjectToml += `miden-protocol = "*"\n`;
  if (dependencies.length > 0) {
    const midenDependencies = dependencies.map(
      ({ name }) => `${name} = { path = "../${name}" }`,
    );
    midenProjectToml += `${midenDependencies.join("\n")}\n\n`;
  }
  midenProjectToml += "\n";
  if (type === "account-component") {
    midenProjectToml += `[package.metadata.miden]\n`;
    midenProjectToml += `supported-types = ["RegularAccountUpdatableCode"]\n\n`;
  }
  return midenProjectToml;
};

export const parseMidenProjectToml = (midenProjectToml: string) =>
  parse(midenProjectToml) as MidenProjectToml;
