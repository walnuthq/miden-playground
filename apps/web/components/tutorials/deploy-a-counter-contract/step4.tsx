import CopyButton from "@/components/lib/copy-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList, InlineCode } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useComponents from "@/hooks/use-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { components } = useComponents();
  const component = components.find(
    ({ type, scriptId }) =>
      type === "account-component" && scriptId.startsWith("counter-account_"),
  );
  const storageSlotsLength = component?.storageSlots.length ?? 0;
  const storageSlot = component?.storageSlots.find(
    ({ type, value }) => type === "map" && value.includes("1:"),
  );
  return storageSlotsLength === 1 && !!storageSlot;
};

const Step4: TutorialStep = {
  title: "Add the counter storage slot.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>An account component is made of two parts:</p>
        <BulletList>
          <li>
            Its <strong>code</strong>: a library of procedures that can read and
            write the component's storage. Here, it's the script you compiled in
            the previous step.
          </li>
          <li>
            Its <strong>storage layout</strong>: the list of storage slots the
            component uses, each with a type and an optional default value.
          </li>
        </BulletList>
        <p>
          Your component already has its code, so let's define its storage
          layout. Click the <em>"Add storage slot"</em> button and enter{" "}
          <strong>
            <InlineCode>
              counter_contract::counter_contract::count_map
            </InlineCode>
          </strong>{" "}
          <CopyButton
            content="Copy Storage Slot Name"
            copy="counter_contract::counter_contract::count_map"
          />{" "}
          as the slot name. It must match the name the contract code uses to
          access the slot: you can find it in the{" "}
          <strong>
            <InlineCode>COUNTER_SLOT</InlineCode>
          </strong>{" "}
          constant of the script's <em>"MASM"</em> tab.
        </p>
        <p>
          Select the <strong>Map</strong> type, then click{" "}
          <em>"Add key-value pair"</em> to set the initial value of the counter:
          enter <strong>1</strong> as the key, the fixed key used by the
          contract, and the initial count as the value, for example{" "}
          <strong>0</strong>.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Add the counter storage slot."
          titleWhenCompleted="You added the counter storage slot."
          description={
            <p>
              Click the <em>"Add storage slot"</em> button and create a{" "}
              <strong>Map</strong> slot with the initial counter value stored at
              key <strong>1</strong>.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step4;
