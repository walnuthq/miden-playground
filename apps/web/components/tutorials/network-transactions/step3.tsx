import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/network-transactions/step3.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

const useCompleted = () => {
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
  const nonce = counter?.nonce ?? 0;
  return nonce > 0;
};

const Step3: TutorialStep = {
  title: "Register your network Counter on-chain.",
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
    const completed = useCompleted();
    return (
      <>
        <Step3Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Register the network account on-chain."
          titleWhenCompleted="You registered the network account."
          description={
            <p>
              Create a new custom transaction on your newly deployed network
              account to register and commit its state on-chain.
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

export default Step3;
