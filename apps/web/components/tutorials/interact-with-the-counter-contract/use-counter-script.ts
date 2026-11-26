import useScripts from "@/hooks/use-scripts";
import { COUNTER_EXAMPLE_ID } from "@/lib/utils/counter-example";

// The counter-account script the tutorial's starter adds (index.ts), found by
// name: its id is the API's.
const useCounterScript = () => {
  const { scripts } = useScripts();
  return scripts.find(
    ({ name, type }) =>
      type === "account-component" && name === COUNTER_EXAMPLE_ID,
  );
};

export default useCounterScript;
