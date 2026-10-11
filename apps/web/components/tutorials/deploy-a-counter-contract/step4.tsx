import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/deploy-a-counter-contract/step4.mdx";
import useComponents from "@/hooks/use-components";

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
        <Step4Content />
        <TutorialAlert
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
