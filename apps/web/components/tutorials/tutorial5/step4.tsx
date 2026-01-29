import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial5/step4.mdx";
import useComponents from "@/hooks/use-components";

const useCompleted = () => {
  const { components } = useComponents();
  const component = components.find(
    ({ type, scriptId }) =>
      type === "account" && scriptId.startsWith("counter-contract_"),
  );
  const storageSlotsLength = component?.storageSlots.length ?? 0;
  const storageSlot = component?.storageSlots.find(
    ({ type, value }) => type === "map" && value.includes("1:"),
  );
  return storageSlotsLength === 1 && !!storageSlot;
};

const Step4: TutorialStep = {
  title: "Create a Storage Slot.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create a Storage Slot."
          titleWhenCompleted="You created a Storage Slot."
          description={
            <p>
              Click on the <em>"Add storage slot"</em> button and create a{" "}
              <strong>StorageMap</strong> slot with the initial counter value
              stored at key <strong>1</strong>.
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
