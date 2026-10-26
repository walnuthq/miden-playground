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
    ({ type, scriptId }) =>
      type === "account-component" && scriptId.startsWith("counter-account_"),
  );
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? ""),
  );
  const nonce = counter?.nonce ?? 0;
  return nonce >= 2;
};

const Step6Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>
      Your counter contract is deployed, so you can now interact with it.{" "}
      <TutorialLink href={`/accounts/${counter?.identifier}`}>
        Click its name
      </TutorialLink>{" "}
      on the accounts page to open its details page, then click the{" "}
      <em>"Components"</em> tab.
    </p>
    <p>
      Under <em>"Account Components"</em>, find your component and click the{" "}
      <em>"Invoke"</em> button next to the{" "}
      <strong>
        <InlineCode>get_count</InlineCode>
      </strong>{" "}
      procedure to read the initial value of the counter. This procedure only
      reads storage, so the Playground executes it locally, without submitting a
      Transaction.
    </p>
    <p>
      Next, click the <em>"Invoke"</em> button next to the{" "}
      <strong>
        <InlineCode>increment_count</InlineCode>
      </strong>{" "}
      procedure. The Playground executes a Transaction against your counter
      contract with a transaction script that calls this procedure, which
      increments the counter by the value you chose, and submits it to testnet.
    </p>
  </>
);

const Step6: TutorialStep = {
  title: "Increment your counter contract.",
  Content: () => {
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const component = components.find(
      ({ id, type }) =>
        !defaultComponentIds.includes(id) && type === "account-component",
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? ""),
    );
    const completed = useCompleted();
    return (
      <>
        <Step6Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Increment the counter."
          titleWhenCompleted="Your increment transaction has been submitted."
          description={
            <p>
              In the <em>"Components"</em> tab of the account details page,
              click the <em>"Invoke"</em> button next to the{" "}
              <strong>increment_count</strong> procedure.
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

export default Step6;
