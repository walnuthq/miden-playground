import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { COUNTER_EXAMPLE_ID } from "@/lib/utils/counter-example";

// The counter's storage slot, as counter_account.masm names it in its source
// (`word("counter_account::count_map")`).
export const COUNTER_SLOT_NAME = "counter_account::count_map";

// What the steps build on: the two scripts the tutorial starts with (the
// counter-contract example's packages, see index.ts, found by name: their ids
// are the API's) and the network counter the user deploys with the counter's
// in step 2.
const useNetworkCounter = () => {
  const { scripts } = useScripts();
  const { accounts } = useAccounts();
  const counterScript = scripts.find(
    ({ name, type }) =>
      type === "account-component" && name === COUNTER_EXAMPLE_ID,
  );
  const noteScript = scripts.find(
    ({ name, type }) => type === "note" && name === "increment-note",
  );
  const counter = counterScript
    ? accounts.find(
        ({ components, isPublic }) =>
          isPublic &&
          components.includes("auth-network-account") &&
          components.includes(counterScript.id),
      )
    : undefined;
  return { noteScript, counterScript, counter };
};

export default useNetworkCounter;
