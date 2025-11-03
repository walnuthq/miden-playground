import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial2/step1.mdx";

const Step1: TutorialStep = {
  title: "Exploring the accounts.",
  Content: () => {
    const { wallets, faucets } = useAccounts();
    const walletA = wallets.find(({ name }) => name === "Wallet A");
    const walletB = wallets.find(({ name }) => name === "Wallet B");
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    return (
      <>
        <Step1Content walletA={walletA} walletB={walletB} faucet={faucet} />
        <TutorialAlert
          title="Explore the accounts"
          description="Click on each account to explore its current state. Confirm that
            Wallet A holds 100 MDN tokens and Wallet B has no assets."
        />
      </>
    );
  },
};

export default Step1;
