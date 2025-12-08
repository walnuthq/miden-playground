import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial7/step3.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  );
  const counter = accounts.find(
    ({ components, storageMode }) =>
      components.includes(component?.id ?? "") && storageMode === "network"
  );
  const nonce = counter?.nonce ?? 0n;
  return nonce > 0n;
};

const Step3: TutorialStep = {
  title: "Register your network Counter on-chain.",
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
              Click on the <em>"Invoke"</em> button from your newly deployed
              network account to register and commit its state on-chain.
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
