import { importExample } from "@/lib/api";
import { counterAccountComponent } from "@/lib/tutorials/counter-account";
import type { WorkspaceStarter } from "@/lib/types/state";
import { compiledPackageToScript } from "@/lib/utils/script";

// The counter-contract example (whose id is its account package's name).
export const COUNTER_EXAMPLE_ID = "counter-account";

// The counter-contract example's packages (counter-account and increment-note)
// and the counter's component, as a workspace's starting scripts. The API
// inserts the packages precompiled (compiled.json), as when launching the
// example, without its auto-deployed account. A Mainnet sandbox starts from
// them; a tutorial can too (Tutorial.starter).
export const counterExampleStarter = async ({
  componentName,
}: {
  componentName: string;
}): Promise<WorkspaceStarter> => {
  const { scripts, error } = await importExample(COUNTER_EXAMPLE_ID);
  if (!scripts) {
    throw new Error(error ?? "Scripts couldn't be imported.");
  }
  const failedScript = scripts.find(({ status }) => status === "error");
  if (failedScript) {
    throw new Error(`${failedScript.name}: ${failedScript.error}`);
  }
  const counterAccountScript = scripts.find(
    ({ name }) => name === COUNTER_EXAMPLE_ID,
  );
  return {
    scripts: scripts.map(compiledPackageToScript),
    components: counterAccountScript
      ? [
          {
            ...counterAccountComponent,
            name: componentName,
            scriptId: counterAccountScript.id,
          },
        ]
      : [],
  };
};
