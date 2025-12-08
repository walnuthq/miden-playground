import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/tutorial7/step6.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

const Step6: TutorialStep = {
  title: "Check the network counter value.",
  Content: () => {
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const component = components.find(
      ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
    );
    const counter = accounts.find(
      ({ components, storageMode }) =>
        components.includes(component?.id ?? "") && storageMode === "network"
    );
    return <Step6Content counter={counter} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step6;
