import { COUNT_READER_NAME } from "@/components/tutorials/foreign-procedure-invocation/starter";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { counterContractAccountId } from "@/lib/constants";
import { COUNTER_EXAMPLE_ID } from "@/lib/utils/counter-example";

// The slots the steps read, as the sources name them: count_reader.masm's
// `word("count_reader::count")` and counter_account.masm's
// `word("counter_account::count_map")`.
export const COUNT_READER_SLOT_NAME = "count_reader::count";
export const COUNTER_SLOT_NAME = "counter_account::count_map";

// What the steps build on: the two scripts the starter adds (index.ts), found
// by name since their ids are the API's, the Counter Contract it pre-imports
// and the Count Reader the user deploys in step 4.
const useCountReader = () => {
  const { scripts } = useScripts();
  const { accounts } = useAccounts();
  const countReaderScript = scripts.find(
    ({ name, type }) =>
      type === "account-component" && name === COUNT_READER_NAME,
  );
  const counterScript = scripts.find(
    ({ name, type }) =>
      type === "account-component" && name === COUNTER_EXAMPLE_ID,
  );
  const countReader = countReaderScript
    ? accounts.find(({ components }) =>
        components.includes(countReaderScript.id),
      )
    : undefined;
  const counter = accounts.find(
    ({ id }) => id === counterContractAccountId("mtst"),
  );
  return { countReaderScript, counterScript, countReader, counter };
};

export default useCountReader;
