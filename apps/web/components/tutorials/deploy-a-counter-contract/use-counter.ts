import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";

// What the user builds along the tutorial: the script created in step 1 (its
// id is the API's UUID and its name theirs to choose) and the account deployed
// with it as a component.
const useCounter = () => {
  const { scripts } = useScripts();
  const { accounts } = useAccounts();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  const counter = script
    ? accounts.find(({ components }) => components.includes(script.id))
    : undefined;
  return { script, counter };
};

export default useCounter;
