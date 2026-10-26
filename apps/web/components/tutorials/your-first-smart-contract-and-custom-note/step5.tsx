import NextStepButton from "@/components/tutorials/next-step-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const { components } = useComponents();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  const component = components.find(({ scriptId }) => scriptId === script?.id);
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
          Now that both scripts are compiled, it's time to deploy the counter
          contract on testnet and interact with it using a Note.
        </p>
        <p>
          When you moved on from step 2, the Playground created a{" "}
          <strong>Counter Contract</strong> account component from your{" "}
          <strong>counter-account</strong> script. Its storage layout defines a
          single map slot,{" "}
          <strong>
            <InlineCode>
              counter_account::counter_contract::count_map
            </InlineCode>
          </strong>
          , which holds the initial count, <strong>0</strong>, under key{" "}
          <strong>1</strong>.
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
          can make your counter contract consume an increment note. Then select
          the <strong>Counter Contract</strong> account component.
        </p>
        <p>
          Once the component is selected, its{" "}
          <strong>
            <InlineCode>
              counter_account::counter_contract::count_map
            </InlineCode>
          </strong>{" "}
          storage slot is listed with its default value, <strong>1:0</strong>:
          keep it, so that the counter starts at <strong>0</strong>.
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
              authentication component and the <strong>Counter Contract</strong>{" "}
              account component.
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
