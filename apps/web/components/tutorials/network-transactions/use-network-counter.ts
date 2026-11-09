import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import { storageSlotName } from "@/lib/utils/component";
import { COUNTER_EXAMPLE_ID } from "@/lib/utils/counter-example";

// The counter's storage slot, named after its script (counter-account).
export const COUNTER_SLOT_NAME = storageSlotName({
  packageName: COUNTER_EXAMPLE_ID,
  traitName: "CounterContract",
  fieldName: "count_map",
});

// What the steps build on: the two scripts the tutorial starts with (the
// counter-contract example's packages, see index.ts), the component made from
// the counter's and the network counter the user deploys with it in step 2.
const useNetworkCounter = () => {
  const { scripts } = useScripts();
  const { components } = useComponents();
  const { accounts } = useAccounts();
  const counterScript = scripts.find(
    ({ name, type }) =>
      type === "account-component" && name === COUNTER_EXAMPLE_ID,
  );
  const noteScript = scripts.find(
    ({ name, type }) => type === "note" && name === "increment-note",
  );
  const component = counterScript
    ? components.find(
        ({ type, scriptId }) =>
          type === "account-component" && scriptId === counterScript.id,
      )
    : undefined;
  const counter = component
    ? accounts.find(
        ({ components, isPublic }) =>
          isPublic &&
          components.includes("auth-network-account") &&
          components.includes(component.id),
      )
    : undefined;
  return { noteScript, component, counter };
};

export default useNetworkCounter;
