import NextStepButton from "@/components/tutorials/next-step-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import type { Account } from "@/lib/types/account";
import { defaultComponentIds } from "@/lib/types/default-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) =>
      !defaultComponentIds.includes(id) && type === "account-component",
  );
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? ""),
  );
  return !!counter;
};

const Step3Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>
      Now that the counter contract script is compiled, let's deploy the
      contract on testnet.
    </p>
    <p>
      Head to the <TutorialLink href="/accounts">accounts page</TutorialLink>,
      click the <em>"Create new account"</em> button at the top of the page and
      select the <em>"Deploy account"</em> option.
    </p>
    <p>
      Enter a name for your contract and leave the storage mode set to{" "}
      <strong>Public</strong>. Keep <strong>No Auth</strong> as the
      authentication component, then select the{" "}
      <strong>Counter Contract</strong> account component and keep the default
      value of its{" "}
      <strong>
        <InlineCode>count_map</InlineCode>
      </strong>{" "}
      storage slot.
    </p>
    <p>
      Finally, click the <em>"Deploy"</em> button. This takes a few moments: the
      Playground creates the Account, then funds it so that it can pay
      transaction fees.
    </p>
    <p>
      The Playground knows the source code of this contract because you deployed
      it from your own script. That's why you can invoke its procedures by their
      names, such as{" "}
      <strong>
        <InlineCode>get_count</InlineCode>
      </strong>{" "}
      or{" "}
      <strong>
        <InlineCode>reset_count</InlineCode>
      </strong>
      , under the <em>"Components"</em> tab of the contract's details page.
    </p>
    <p>
      See for yourself:{" "}
      {counter ? (
        <TutorialLink href={`/accounts/${counter?.identifier}?tab=components`}>
          open the <em>"Components"</em> tab of your deployed contract
        </TutorialLink>
      ) : (
        <>
          open the <em>"Components"</em> tab of your deployed contract
        </>
      )}{" "}
      to list the components it contains. Click the script name next to{" "}
      <em>"Script"</em> to read a component's source code.
    </p>
    <p>
      Outside of tutorials, the Playground also verifies the contracts you
      deploy automatically, so that anyone can import them, read their source
      code and interact with them.
    </p>
  </>
);

const Step3: TutorialStep = {
  title: "Deploy the counter contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const component = components.find(
      ({ id, type }) =>
        !defaultComponentIds.includes(id) && type === "account-component",
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? ""),
    );
    return (
      <>
        <Step3Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Deploy the counter contract."
          titleWhenCompleted="You deployed the counter contract."
          description={
            <p>
              On the accounts page, click the <em>"Create new account"</em>{" "}
              button, select the <em>"Deploy account"</em> option and deploy a
              contract with the <strong>No Auth</strong> authentication
              component and the <strong>Counter Contract</strong> account
              component.
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
