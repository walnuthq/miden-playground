import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { storageSlotName } from "@/lib/utils/component";

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
  const slotName = storageSlotName({
    packageName: script?.name ?? "",
    traitName: "CounterContract",
    fieldName: "count_map",
  });
  return { script, component, counter, slotName };
};

export default useCounter;
