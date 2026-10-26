import { useEffect, useState } from "react";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const [initialNonce, setInitialNonce] = useState(0);
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
  const currentNonce = counter?.nonce ?? 0;
  useEffect(() => {
    if (initialNonce === 0) {
      setInitialNonce(currentNonce);
    }
  }, [initialNonce, currentNonce]);
  return initialNonce !== 0 && currentNonce > initialNonce;
};

const Step4: TutorialStep = {
  title: "Create the network note.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Let's create the network note by executing a Transaction. Your wallet
          signs this Transaction, so make sure it's connected to the Playground
          before continuing.
        </p>
        <p>
          From the <TutorialLink href="/notes">notes page</TutorialLink>, click
          the <em>"Add note"</em> button and select the <em>"Create note"</em>{" "}
          option.
        </p>
        <p>
          A <em>"Create Note"</em> dialog shows up to help you configure the
          note creation transaction. Set the recipient account to the network
          counter you deployed in step 2, select the{" "}
          <strong>counter-note</strong> script, leave the note type set to{" "}
          <strong>Public</strong> and turn on the <em>"Network note"</em>{" "}
          toggle.
        </p>
        <p>
          Don't add any note assets or note storage: the Note doesn't need to
          carry assets or take any parameters.
        </p>
        <p>
          Once you're done, click the <em>"Create"</em> button and confirm the
          Transaction in your wallet right away. To create a network note, the
          Transaction reads the fee charged by the network account, which makes
          it expire about a minute after it's executed.
        </p>
        <p>
          It takes some time for the network transaction builder to pick up your
          Note and consume it.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the network note."
          titleWhenCompleted="Your network note has been consumed."
          description={
            <p>
              Create a network note targeting your network counter with the{" "}
              <em>"Create Note"</em> dialog, confirm the Transaction in your
              wallet, then wait for the network to consume the Note.
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

export default Step4;
