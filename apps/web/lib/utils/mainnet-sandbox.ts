import { importExample } from "@/lib/api";
import counterContractExampleState from "@/lib/examples/counter-contract/state";
import type { State } from "@/lib/types/state";
import { compiledPackageToScript } from "@/lib/utils/script";

// The counter-contract example (whose id is its account package's name).
const COUNTER_EXAMPLE_ID = "counter-account";

// A new Mainnet sandbox starts with the counter-contract example's packages
// (counter-account and increment-note), so there's something to deploy: a
// network counter that increment-note, sent as a network note from Bread
// Wallet, increments. The API inserts them precompiled (compiled.json), as when
// launching the example, without its auto-deployed account: Partner Mainnet
// only creates invited accounts and network accounts.
export const mainnetSandboxStarter = async (): Promise<
  Pick<State, "scripts" | "components">
> => {
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
  const counterAccountComponent = counterContractExampleState.components.find(
    ({ id }) => id === COUNTER_EXAMPLE_ID,
  );
  return {
    scripts: scripts.map(compiledPackageToScript),
    components:
      counterAccountScript && counterAccountComponent
        ? [
            {
              ...counterAccountComponent,
              // The built-in MASM counter is already "Counter Contract".
              name: "Counter Account",
              scriptId: counterAccountScript.id,
            },
          ]
        : [],
  };
};
