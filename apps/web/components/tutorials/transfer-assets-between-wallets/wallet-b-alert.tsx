import { Button } from "@workspace/ui/components/button";
import useWalletB from "@/components/tutorials/transfer-assets-between-wallets/use-wallet-b";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";

// Shown while creating Wallet B or requesting its fee note has failed.
const WalletBAlert = () => {
  const { failed, retry } = useWalletB();
  if (!failed) {
    return null;
  }
  return (
    <TutorialStepAlert
      title="Wallet B couldn't be set up."
      description={
        <>
          <p>
            The Playground couldn't create Wallet B or request the tokens it
            needs to pay transaction fees.
          </p>
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        </>
      }
    />
  );
};

export default WalletBAlert;
