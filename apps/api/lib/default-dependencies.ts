import { projectTemplateFiles, templates } from "@/lib/templates";
import { generateCargoToml, generateMidenProjectToml } from "@/lib/toml";
import type { Dependency } from "@/lib/types";

export const basicWalletDependency: Dependency & {
  rust: string;
  files: Record<string, string>;
} = {
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account-component",
  commitment: "",
  rust: templates["basic-wallet"],
  files: {
    "basic-wallet/.cargo/config.toml":
      projectTemplateFiles[".cargo/config.toml"],
    "basic-wallet/src/lib.rs": templates["basic-wallet"],
    "basic-wallet/build.rs": projectTemplateFiles["build.rs"],
    "basic-wallet/Cargo.toml": generateCargoToml({
      name: "basic-wallet",
    }),
    "basic-wallet/Cargo.lock": projectTemplateFiles["Cargo.lock"],
    "basic-wallet/miden-project.toml": generateMidenProjectToml({
      name: "basic-wallet",
      type: "account-component",
      rust: templates["basic-wallet"],
      dependencies: [],
    }),
    "basic-wallet/rust-toolchain.toml":
      projectTemplateFiles["rust-toolchain.toml"],
  },
};

export const counterAccountDependency: Dependency & {
  rust: string;
  files: Record<string, string>;
} = {
  id: "counter-account",
  name: "counter-account",
  type: "account-component",
  commitment:
    "0xb76d0a376ff5cc10f1f5d80385dd2d35f335100ed071673b1d69cb94111582ba",
  rust: templates["counter-account"],
  files: {
    "counter-account/.cargo/config.toml":
      projectTemplateFiles[".cargo/config.toml"],
    "counter-account/src/lib.rs": templates["counter-account"],
    "counter-account/build.rs": projectTemplateFiles["build.rs"],
    "counter-account/Cargo.toml": generateCargoToml({
      name: "counter-account",
    }),
    "counter-account/Cargo.lock": projectTemplateFiles["Cargo.lock"],
    "counter-account/miden-project.toml": generateMidenProjectToml({
      name: "counter-account",
      type: "account-component",
      rust: templates["counter-account"],
      dependencies: [],
    }),
    "counter-account/rust-toolchain.toml":
      projectTemplateFiles["rust-toolchain.toml"],
  },
};

export const defaultDependenciesRecords = {
  "basic-wallet": basicWalletDependency,
  "counter-account": counterAccountDependency,
} as const;

export type DefaultDependency = keyof typeof defaultDependenciesRecords;
