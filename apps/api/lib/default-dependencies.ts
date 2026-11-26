import { templates } from "@/lib/templates";
import { generateMidenProjectToml } from "@/lib/toml";
import type { Dependency } from "@/lib/types";
import { MANIFEST_FILE, sourceFilePath } from "./source-file.ts";

// A dependency built from a template, not a row: its files, under its
// `<name>/` directory, as a build takes them.
const templateDependency = (
  name: "basic-wallet" | "counter-account",
  commitment: string,
): Dependency & { files: Record<string, string> } => ({
  id: name,
  name,
  type: "account-component",
  commitment,
  files: {
    [`${name}/${sourceFilePath(name)}`]: templates[name],
    [`${name}/${MANIFEST_FILE}`]: generateMidenProjectToml({
      name,
      type: "account-component",
      masm: templates[name],
      dependencies: [],
    }),
  },
});

// The commitments are the templates' as api-compile builds them: unknown
// until the MASM templates are written (plan 02 of spec/remove-rust). A
// compile answers the real one.
export const basicWalletDependency = templateDependency("basic-wallet", "");

export const counterAccountDependency = templateDependency(
  "counter-account",
  "",
);

export const defaultDependenciesRecords = {
  "basic-wallet": basicWalletDependency,
  "counter-account": counterAccountDependency,
} as const;

export type DefaultDependency = keyof typeof defaultDependenciesRecords;
