import { Plus } from "lucide-react";
import CopyButton from "@/components/lib/copy-button";
import useCounter from "@/components/tutorials/deploy-a-counter-contract/use-counter";
import NextStepButton from "@/components/tutorials/next-step-button";
import {
  BulletList,
  ButtonName,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";
import { stringToKeyValues } from "@/lib/utils/component";

// The compiled code looks the slot up by its name, and the counter under key
// 1 (a number input, so "01" is the same key).
const useCompleted = () => {
  const { component, slotName } = useCounter();
  const storageSlots = component?.storageSlots ?? [];
  const storageSlot = storageSlots.find(
    ({ name, type, value }) =>
      name === slotName &&
      type === "map" &&
      stringToKeyValues(value).some(({ key }) => Number(key) === 1),
  );
  return storageSlots.length === 1 && !!storageSlot;
};

// The slot name is as long as the user's script name and has no place to
// break: `wrap-anywhere` keeps it inside the panel.
const Step4: TutorialStep = {
  title: "Add the counter storage slot.",
  Content: () => {
    const completed = useCompleted();
    const { script, slotName } = useCounter();
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
          layout. Click the{" "}
          <ButtonName icon={Plus}>Add storage slot</ButtonName> button and enter{" "}
          <strong className="wrap-anywhere">
            <InlineCode>{slotName}</InlineCode>
          </strong>{" "}
          <CopyButton content="Copy Storage Slot Name" copy={slotName} /> as the
          slot name.
        </p>
        <p>
          Storage slots are identified by their name, which the compiler derives
          from your code in three parts, separated by{" "}
          <strong>
            <InlineCode>::</InlineCode>
          </strong>
          :
        </p>
        <BulletList>
          <li>
            the name of your script, <strong>{script?.name}</strong>, where any
            character other than a letter, a digit or an underscore becomes an
            underscore;
          </li>
          <li>
            the name of the component's trait,{" "}
            <strong>
              <InlineCode>CounterContract</InlineCode>
            </strong>
            , in snake case;
          </li>
          <li>
            the name of the field in the storage struct,{" "}
            <strong>
              <InlineCode>count_map</InlineCode>
            </strong>
            .
          </li>
        </BulletList>
        <p>
          The slot you add must have exactly this name: it's the one the
          compiled code looks up, so the contract wouldn't find its counter in a
          slot named differently.
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
              Click the <ButtonName icon={Plus}>Add storage slot</ButtonName>{" "}
              button and create a <strong>Map</strong> slot named{" "}
              <strong className="wrap-anywhere">
                <InlineCode>{slotName}</InlineCode>
              </strong>
              , with the initial counter value stored at key <strong>1</strong>.
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
