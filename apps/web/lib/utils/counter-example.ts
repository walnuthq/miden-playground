import { importExample } from "@/lib/api";
import type { WorkspaceStarter } from "@/lib/types/state";
import { compiledPackageToScript } from "@/lib/utils/script";

// The counter-contract example (whose id is its account package's name).
export const COUNTER_EXAMPLE_ID = "counter-account";

// The counter-contract example's packages (counter-account and increment-note),
// as a workspace's starting scripts. The API creates and compiles them, as
// when launching the example, without its auto-deployed account. A Mainnet sandbox starts from
// them, and so does tutorial 9 (Tutorial.starter), which only reads them:
// `readOnly` then leaves out what would change or remove them (editing,
// compiling, their dependencies, deleting).
export const counterExampleStarter = async ({
  readOnly = false,
}: {
  readOnly?: boolean;
} = {}): Promise<WorkspaceStarter> => {
  const { scripts, error } = await importExample(COUNTER_EXAMPLE_ID);
  if (!scripts) {
    throw new Error(error ?? "Scripts couldn't be imported.");
  }
  const failedScript = scripts.find(({ status }) => status === "error");
  if (failedScript) {
    throw new Error(`${failedScript.name}: ${failedScript.error}`);
  }
  return {
    scripts: scripts.map((script) => ({
      ...compiledPackageToScript(script),
      readOnly,
    })),
  };
};
