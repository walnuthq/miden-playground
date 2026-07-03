import { readFileSync } from "node:fs";
import { PROJECT_ROOT } from "@/lib/constants";

const readFile = (filePath: string) =>
  readFileSync(`${PROJECT_ROOT}/templates/${filePath}`, "utf-8");

export const projectTemplateFiles = {
  ".cargo/config.toml": readFile("project-template/.cargo/config.toml"),
  "rust-toolchain.toml": readFile("project-template/rust-toolchain.toml"),
} as const;

export const templates = {
  account: readFile("account.rs"),
  "authentication-component": readFile("authentication-component.rs"),
  note: readFile("note.rs"),
  "tx-script": readFile("tx-script.rs"),
  "counter-account": readFile("counter-account.rs"),
  "p2id-note": readFile("p2id-note.rs"),
  "counter-note": readFile("counter-note.rs"),
} as const;
