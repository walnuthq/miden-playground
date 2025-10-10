import { Wallet } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

const MidenWalletAlert = () => (
  <Alert>
    <Wallet />
    <AlertTitle>
      You need to install{" "}
      <a
        href="https://miden.fi/"
        className="text-primary font-medium underline underline-offset-4 inline-flex items-center gap-1"
        target="_blank"
        rel="noopener noreferrer"
      >
        Miden Wallet
      </a>
      .
    </AlertTitle>
    <AlertDescription>
      To complete this tutorial, make sure you have installed and configured
      your Miden Wallet, then pin it to your browser for easy access.
    </AlertDescription>
  </Alert>
);

export default MidenWalletAlert;
