import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ type, scriptId }) =>
      type === "account-component" && scriptId.startsWith("counter-account_"),
  );
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? ""),
  );
  return !!counter;
};

const Step5: TutorialStep = {
  title: "Deploy your counter contract.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Now that your account component defines both the contract's{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
            code
          </ExternalLink>{" "}
          and its{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage">
            storage
          </ExternalLink>{" "}
          layout, it's time to deploy your counter contract on testnet.
        </p>
        <p>
          Head to the{" "}
          <TutorialLink href="/accounts">accounts page</TutorialLink>, click the{" "}
          <em>"Create new account"</em> button at the top of the page and select
          the <em>"Deploy account"</em> option.
        </p>
        <p>
          Enter a name for your contract and leave the storage mode set to{" "}
          <strong>Public</strong>. Keep <strong>No Auth</strong> as the
          authentication component: it doesn't require any signature, so anyone
          can increment the counter, just like the contract from the previous
          tutorial. Then select your account component, the one you created in
          the previous steps.
        </p>
        <p>
          Once the component is selected, the storage slots it defines are
          listed with their default values, which you can override for this
          deployment. Keep the value you set in the previous step.
        </p>
        <p>
          Finally, click the <em>"Deploy"</em> button. This takes a few moments:
          the Playground creates the Account, then funds it so that it can pay
          transaction fees. Funding the Account is its first Transaction, which
          also registers it on testnet.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Deploy your counter contract."
          titleWhenCompleted="You deployed your counter contract."
          description={
            <p>
              Click the <em>"Create new account"</em> button at the top of the
              accounts page, select the <em>"Deploy account"</em> option and
              deploy an Account using the <strong>No Auth</strong>{" "}
              authentication component and your account component.
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

export default Step5;
