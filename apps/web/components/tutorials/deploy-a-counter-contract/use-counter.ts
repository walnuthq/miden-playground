import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { isValidUUIDv4 } from "@/lib/utils";
import { storageSlotName } from "@/lib/utils/component";

// The slot the mock API's counter read, whatever the script's name. A run
// saved before the tutorial moved to the real compiler still has that script
// (its id isn't the API's UUID) and resumes with it. Goes with lib/mock-api.ts.
const MOCK_SLOT_NAME = "counter_contract::counter_contract::count_map";

// What the user builds along the tutorial: the script created in step 1 (its
// id is the API's UUID and its name theirs to choose), the component made from
// it and the account deployed with that component.
const useCounter = () => {
  const { scripts } = useScripts();
  const { components } = useComponents();
  const { accounts } = useAccounts();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  const component = script
    ? components.find(
        ({ type, scriptId }) =>
          type === "account-component" && scriptId === script.id,
      )
    : undefined;
  const counter = component
    ? accounts.find(({ components }) => components.includes(component.id))
    : undefined;
  // The counter's storage slot: its name follows the script's, so it differs
  // from one user to the next.
  const slotName =
    script && !isValidUUIDv4(script.id)
      ? MOCK_SLOT_NAME
      : storageSlotName({
          packageName: script?.name ?? "",
          traitName: "CounterContract",
          fieldName: "count_map",
        });
  return { script, component, counter, slotName };
};

export default useCounter;
