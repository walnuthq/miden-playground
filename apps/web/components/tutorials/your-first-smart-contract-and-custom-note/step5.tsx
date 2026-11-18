import { Plus } from "lucide-react";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ButtonName, InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  const counter = accounts.find(({ components }) =>
    components.includes(script?.id ?? ""),
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
          Your compiled <strong>counter-account</strong> script is an account
          component: its code, and its storage layout, which the compiler
          derived from the storage struct. It defines a single map slot,{" "}
          <strong>
            <InlineCode>
              counter_account::counter_contract::count_map
            </InlineCode>
          </strong>
          , which holds the count under key <strong>1</strong>.
        </p>
        <p>
          Head to the{" "}
          <TutorialLink href="/accounts">accounts page</TutorialLink>, click the{" "}
          <ButtonName icon={Plus}>Create new account</ButtonName> button at the
          top of the page and select the <em>"Deploy account"</em> option.
        </p>
        <p>
          Enter a name for your contract and leave the storage mode set to{" "}
          <strong>Public</strong>. Keep <strong>No Auth</strong> as the
          authentication component: it doesn't require any signature, so anyone
          can make your counter contract consume an increment note. Then select{" "}
          <strong>counter-account</strong> as the account component.
        </p>
        <p>
          Once it's selected, its{" "}
          <strong>
            <InlineCode>
              counter_account::counter_contract::count_map
            </InlineCode>
          </strong>{" "}
          storage slot is listed, with no entries: a key that was never written
          reads as zero, so the counter starts at <strong>0</strong>. Leave it
          as it is.
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
              Click the <ButtonName icon={Plus}>Create new account</ButtonName>{" "}
              button at the top of the accounts page, select the{" "}
              <em>"Deploy account"</em> option and deploy an Account using the{" "}
              <strong>No Auth</strong> authentication component and{" "}
              <strong>counter-account</strong> as the account component.
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
