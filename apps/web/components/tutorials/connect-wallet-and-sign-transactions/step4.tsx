import type { TutorialStep } from "@/lib/types/tutorial";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step4.mdx";
import { testWalletAddress } from "@/lib/constants";

const useCompleted = () => {
  const { wallets, connectedWallet } = useAccounts();
  const recipient = wallets.find(
    ({ address }) => connectedWallet && address !== connectedWallet.address,
  );
  return !!recipient;
};

const Step4: TutorialStep = {
  title: "Import another wallet in the Playground.",
  Content: () => {
    const { networkId } = useNetwork();
    const completed = useCompleted();
    return (
      <>
        <Step4Content
          account={{
            name: "Test Wallet",
            address: testWalletAddress(networkId),
          }}
        />
        <TutorialAlert
          completed={completed}
          title="Action required: Import the recipient wallet."
          titleWhenCompleted="Recipient wallet has been imported."
          description={
            <p>
              Click on the <em>"Create new account"</em> button on top of the
              accounts page and select the <em>"Import account"</em> option to
              import another wallet in the Playground.
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
