import type { TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step5Content from "@/components/tutorials/network-transactions/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

const Step5: TutorialStep = {
  title: "Check the network counter value.",
  Content: () => {
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const component = components.find(
      ({ id, type }) =>
        !defaultComponentIds.includes(id) && type === "account-component",
    );
    const counter = accounts.find(
      ({ components, isPublic }) =>
        components.includes(component?.id ?? "") &&
        isPublic &&
        components.includes("auth-network-account"),
    );
    return <Step5Content counter={counter} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step5;
