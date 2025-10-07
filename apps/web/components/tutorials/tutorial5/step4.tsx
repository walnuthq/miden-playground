import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial5/step4.mdx";
import useComponents from "@/hooks/use-components";
import defaultComponents from "@/lib/types/default-components";

const useCompleted = () => {
  const { components } = useComponents();
  const defaultComponentIds = defaultComponents.map(({ id }) => id);
  const component = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  );
  const storageSlot = component?.storageSlots.find(
    ({ type, value }) => type === "map" && value.includes("1:")
  );
  return !!storageSlot;
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
