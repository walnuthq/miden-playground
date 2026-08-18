import type { Dependency } from "@/lib/types";
import { templates, projectTemplateFiles } from "@/lib/templates";
import { generateCargoToml, generateMidenProjectToml } from "@/lib/toml";

export const basicWalletDependency: Dependency & {
  rust: string;
  files: Record<string, string>;
} = {
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account-component",
  digest: "",
  rust: templates["basic-wallet"],
  files: {
    "basic-wallet/.cargo/config.toml":
      projectTemplateFiles[".cargo/config.toml"],
    "basic-wallet/src/lib.rs": templates["basic-wallet"],
    "basic-wallet/Cargo.toml": generateCargoToml({
      name: "basic-wallet",
    }),
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
  digest: "0x186a1eaab380a244ca52a3b2c50e50aac1cbc06c1c77618775d49769cd373565",
  rust: templates["counter-account"],
  files: {
    "counter-account/.cargo/config.toml":
      projectTemplateFiles[".cargo/config.toml"],
    "counter-account/src/lib.rs": templates["counter-account"],
    "counter-account/Cargo.toml": generateCargoToml({
      name: "counter-account",
    }),
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
