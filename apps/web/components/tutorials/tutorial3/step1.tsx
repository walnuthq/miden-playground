import { usePathname } from "next/navigation";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial3/step1.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  const { accountId } = useWallet();
  const { wallets } = useAccounts();
  const wallet = wallets.find(({ address }) => address === accountId);
  return pathname === `/accounts/${wallet?.address}`;
};

const Step1: TutorialStep = {
  title: "Connect your wallet to testnet.",
  Content: () => {
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ address }) => address === accountId);
    const completed = useCompleted();
    return (
      <>
        <Step1Content wallet={wallet} />
        <TutorialAlert
          completed={completed}
          title="Action required: Connect your wallet."
          titleWhenCompleted="Your wallet is connected and imported."
          description={
            <p>
              Click on the <em>"Select Wallet"</em> button in the top-right
              corner and connect your Miden Wallet to the Playground, then once
              imported, navigate to your account details page.
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

export default Step1;
