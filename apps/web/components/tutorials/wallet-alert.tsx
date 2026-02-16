import { Wallet } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

const WalletAlert = () => (
  <Alert>
    <Wallet />
    <AlertTitle>How to generate a transaction in your wallet?</AlertTitle>
    <AlertDescription>
      You must click on the Miden Wallet browser extension pinned icon to
      actually trigger the transaction. If the proof generation fails, you can
      retry by clicking on the history tab and consume the note again.
    </AlertDescription>
  </Alert>
);

export default WalletAlert;
