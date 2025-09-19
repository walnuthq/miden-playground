import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/deploy-a-counter-contract/step4.mdx";
import useComponents from "@/hooks/use-components";
import defaultComponents from "@/components/global-context/default-components";

const Step4: TutorialStep = {
  title: "Create a Storage Slot.",
  Content: () => {
    const { components } = useComponents();
    const defaultComponentIds = defaultComponents.map(({ id }) => id);
    const component = components.find(
      ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
    );
    const storageSlot = component?.storageSlots.find(
      ({ type, value }) => type === "map" && value.includes("1:")
    );
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={!!storageSlot}
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
    const { components } = useComponents();
    const defaultComponentIds = defaultComponents.map(({ id }) => id);
    const component = components.find(
      ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
    );
    const storageSlot = component?.storageSlots.find(
      ({ type, value }) => type === "map" && value.includes("1:")
    );
    return <NextStepButton disabled={!storageSlot} />;
  },
};

export default Step4;
