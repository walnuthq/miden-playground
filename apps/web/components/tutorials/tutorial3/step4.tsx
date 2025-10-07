import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial3/step4.mdx";
import { TEST_WALLET_ADDRESS } from "@/lib/constants";

const useCompleted = () => {
  const { accountId } = useWallet();
  const { wallets } = useAccounts();
  const recipient = wallets.find(({ address }) => address !== accountId);
  return !!recipient;
};

const Step4: TutorialStep = {
  title: "Import another wallet in the Playground.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content
          account={{
            name: "Test Wallet",
            address: TEST_WALLET_ADDRESS,
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
