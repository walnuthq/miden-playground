import { Wallet } from "lucide-react";
import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import TutorialAlert from "@/components/tutorials/tutorial-alert";

const WalletAlert = () => (
  <TutorialAlert>
    <Wallet />
    <AlertTitle>How to generate a transaction in your wallet?</AlertTitle>
    <AlertDescription>
      You must click on the Miden Wallet browser extension pinned icon to
      actually trigger the transaction. If the proof generation fails, you can
      retry by clicking on the history tab and consume the note again.
    </AlertDescription>
  </TutorialAlert>
);

export default WalletAlert;
