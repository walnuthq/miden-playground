import { EllipsisVertical } from "lucide-react";
import NextStepButton from "@/components/tutorials/next-step-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import type { Account } from "@/lib/types/account";
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
  return counter?.consumableNoteIds.length === 0;
};

const Step7Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>
      In the previous step, you published an increment note on testnet. Your
      counter contract must now consume it to actually increment its counter.
    </p>
    <p>
      Open your{" "}
      <TutorialLink href={`/accounts/${counter?.identifier}`}>
        counter contract's details page
      </TutorialLink>
      . Under <em>"Consumable Notes"</em>, click the{" "}
      <EllipsisVertical className="size-4 inline" /> icon button at the end of
      your Note's row and select the <em>"Consume note with …"</em> option.
    </p>
    <p>
      A <em>"Preview consume transaction"</em> dialog shows up with the effects
      of the Transaction, including the change to the counter's{" "}
      <strong>
        <InlineCode>count_map</InlineCode>
      </strong>{" "}
      storage slot. Click the <em>"Submit"</em> button to submit the Transaction
      to testnet.
    </p>
    <p>
      Your counter contract uses the <strong>No Auth</strong> authentication
      component, so you don't need to sign this Transaction. Once it's
      submitted, the Note is consumed and disappears from the consumable notes.
    </p>
  </>
);

const Step7: TutorialStep = {
  title: "Consume the increment note.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const { scripts } = useScripts();
    const { components } = useComponents();
    const script = scripts.find(
      ({ id, type }) =>
        !defaultScriptIds.includes(id) && type === "account-component",
    );
    const component = components.find(
      ({ scriptId }) => scriptId === script?.id,
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? ""),
    );
    return (
      <>
        <Step7Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Consume the increment note."
          titleWhenCompleted="Your increment note has been consumed."
          description={
            <p>
              Under <em>"Consumable Notes"</em> on your counter contract's
              details page, click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button at the
              end of your Note's row and select the{" "}
              <em>"Consume note with …"</em> option.
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

export default Step7;
