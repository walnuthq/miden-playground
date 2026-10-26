import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  return connectedWallet?.name === "Para Wallet";
};

const Step3: TutorialStep = {
  title: "Connect a Para Wallet to the Playground.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Your Bread Wallet is funded. Before sending tokens to the Para Wallet,
          you need to create it and import it into the Playground.
        </p>
        <p>
          The Playground signs Transactions with one wallet at a time, so start
          by disconnecting Bread Wallet: click your wallet address button in the
          top-right corner and select <em>"Disconnect"</em>. Your Bread Wallet
          stays listed on the accounts page.
        </p>
        <p>
          Then click the <em>"Select Wallet"</em> button and select{" "}
          <em>"Para Wallet"</em>. In the Para modal, enter your email address
          and type the verification code Para sends you by email.
        </p>
        <p>
          Para creates a wallet for your email address and the Playground
          derives a <strong>Public</strong> Miden account from it. Once the Para
          Wallet appears on the{" "}
          <TutorialLink href="/accounts">accounts page</TutorialLink> with the{" "}
          <strong>Public</strong> storage mode, you can proceed to the next
          step.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Connect a Para Wallet."
          titleWhenCompleted="Your Para Wallet is connected and imported."
          description={
            <p>
              Disconnect Bread Wallet, then click the <em>"Select Wallet"</em>{" "}
              button, select <em>"Para Wallet"</em> and log in with your email
              address.
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
