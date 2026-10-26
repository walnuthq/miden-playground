import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import type { Account } from "@/lib/types/account";
import { defaultComponentIds } from "@/lib/types/default-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step5Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>
      Your Note has been consumed by a network transaction, which incremented
      the network counter from <strong>0</strong> to <strong>1</strong>.
    </p>
    <p>
      Open the{" "}
      <TutorialLink href={`/accounts/${counter?.identifier}`}>
        network counter
      </TutorialLink>
      's page and click the <em>"Components"</em> tab. Under{" "}
      <em>"Account Components"</em>, the value of the{" "}
      <strong>
        <InlineCode>counter_contract::counter_contract::count</InlineCode>
      </strong>{" "}
      storage slot is now <strong>1</strong>.
    </p>
    <p>
      Congratulations! You have successfully deployed a network smart contract
      and triggered a network transaction with a custom note.
    </p>
  </>
);

const Step5: TutorialStep = {
  title: "Read the updated counter value.",
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
