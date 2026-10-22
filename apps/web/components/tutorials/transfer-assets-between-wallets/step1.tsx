import NextStepButton from "@/components/tutorials/next-step-button";
import Step1Content from "@/components/tutorials/transfer-assets-between-wallets/step1.mdx";
import useWalletB from "@/components/tutorials/transfer-assets-between-wallets/use-wallet-b";
import WalletBAlert from "@/components/tutorials/transfer-assets-between-wallets/wallet-b-alert";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step1: TutorialStep = {
  title: "Explore the accounts.",
  Content: () => {
    const { faucets } = useAccounts();
    const { walletA, walletB } = useWalletB();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    return (
      <>
        <Step1Content walletA={walletA} walletB={walletB} faucet={faucet} />
        <TutorialStepAlert
          title="Explore the accounts."
          description="Click each account to explore its current state, and confirm
            that Wallet A holds MDN tokens."
        />
        <WalletBAlert />
      </>
    );
  },
  NextStepButton: () => {
    const { walletB } = useWalletB();
    return (
      <NextStepButton
        text={walletB ? undefined : "Creating Wallet B…"}
        disabled={!walletB}
      />
    );
  },
};

export default Step1;
