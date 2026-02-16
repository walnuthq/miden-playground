import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step7Content from "@/components/tutorials/tutorial11/step7.mdx";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { storageSlotName } from "@/lib/types/component";
import { defaultStorageItem, getMapItem } from "@/lib/types/account";
import { EMPTY_WORD } from "@/lib/constants";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "account",
  );
  if (!counter) {
    return false;
  }
  const count = getMapItem(
    counter.storage.find(
      ({ name }) =>
        name ===
        storageSlotName({
          packageName: script?.name ?? "",
          fieldName: "count_map",
        }),
    ) ?? defaultStorageItem(),
    "0x0000000000000000000000000000000000000000000000000100000000000000",
  );
  return counter.nonce > 0 && count === EMPTY_WORD;
};

const Step7: TutorialStep = {
  title: "Interact with the verified contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step7Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Interact with the contract."
          titleWhenCompleted="You interacted with the contract."
          description={
            <p>
              Click on the <em>"Invoke"</em> button next to the{" "}
              <strong>increment-count</strong> procedure to interact with the
              verified contract, then call the <strong>reset-count</strong>{" "}
              procedure to set the counter value back to zero.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextTutorialButton disabled={!completed} />;
  },
};

export default Step7;
