// Bundled as strings by the Text rule in wrangler.jsonc.
import cargoConfigToml from "@/templates/project-template/.cargo/config.toml";
import buildRs from "@/templates/project-template/build.rs";
import cargoLock from "@/templates/project-template/Cargo.lock";
import rustToolchainToml from "@/templates/project-template/rust-toolchain.toml";
import accountComponent from "@/templates/account-component.rs";
import note from "@/templates/note.rs";
import txScript from "@/templates/tx-script.rs";
import basicWallet from "@/templates/basic-wallet.rs";
import p2idNote from "@/templates/p2id-note.rs";
import authNoAuth from "@/templates/auth-no-auth.rs";
import counterAccount from "@/templates/counter-account.rs";
import counterNote from "@/templates/counter-note.rs";
import counterScript from "@/templates/counter-script.rs";
import countReader from "@/templates/count-reader.rs";

export const projectTemplateFiles = {
  ".cargo/config.toml": cargoConfigToml,
  "build.rs": buildRs,
  // The lockfile api-compile's image was warmed with (see generateCargoToml).
  "Cargo.lock": cargoLock,
  "rust-toolchain.toml": rustToolchainToml,
} as const;

export const templates = {
  library: "",
  "authentication-component": "",
  "account-component": accountComponent,
  note,
  "tx-script": txScript,
  "basic-wallet": basicWallet,
  "p2id-note": p2idNote,
  "auth-no-auth": authNoAuth,
  "counter-account": counterAccount,
  "counter-note": counterNote,
  "counter-script": counterScript,
  "count-reader": countReader,
} as const;
