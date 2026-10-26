import { useEffect, useState } from "react";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { counterContractAddress } from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const [initialNonce, setInitialNonce] = useState(0);
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const counter = accounts.find(
    ({ address }) => address === counterContractAddress(networkId),
  );
  const currentNonce = counter?.nonce ?? 0;
  useEffect(() => {
    if (initialNonce === 0) {
      setInitialNonce(currentNonce);
    }
  }, [initialNonce, currentNonce]);
  return initialNonce !== 0 && currentNonce > initialNonce;
};

const Step5: TutorialStep = {
  title: "Invoke the counter contract procedures.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          The counter contract has been imported into the Playground, so you can
          now interact with it.
        </p>
        <p>
          First, click the <em>"Components"</em> tab on the account details page
          to list the counter contract's{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
            account components
          </ExternalLink>
          .
        </p>
        <p>
          Under <em>"Account Components"</em>, find the{" "}
          <em>"Counter Contract"</em> component and click the <em>"Invoke"</em>{" "}
          button next to the{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          procedure to read the current value of the counter. This procedure
          only reads storage, so the Playground executes it locally, without
          submitting a Transaction.
        </p>
        <p>
          Next, click the <em>"Invoke"</em> button next to the{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedure. The Playground executes a Transaction against the counter
          contract with a transaction script that calls this procedure, which
          increments the counter by one, and submits it to testnet.
        </p>
        <p>
          Under <em>"Authentication Components"</em>, notice that the counter
          contract uses the <em>"No Auth"</em>{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code#authentication">
            authentication component
          </ExternalLink>
          : it doesn't require any signature, which is why anyone can increment
          its counter.
        </p>
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

export default Step5;
