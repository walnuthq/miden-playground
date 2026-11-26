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

// The commitments are the templates' as api-compile builds them under these
// names (a package's commitment covers its name). They change with the
// template or api-compile's toolchain: a compile answers the real one, so a
// stale one is only shown until then.
export const basicWalletDependency = templateDependency(
  "basic-wallet",
  "0x59e7859c8a1235c43f1d171452422e94d99ed434519c6d351eec2e0a71ab8983",
);

export const counterAccountDependency = templateDependency(
  "counter-account",
  "0xc586e89be2b913920e892f193b034eeb6e55409cf9b3554a5b4afb1a95eef155",
);

export const defaultDependenciesRecords = {
  "basic-wallet": basicWalletDependency,
  "counter-account": counterAccountDependency,
} as const;

export type DefaultDependency = keyof typeof defaultDependenciesRecords;
