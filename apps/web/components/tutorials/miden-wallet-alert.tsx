import { Wallet } from "lucide-react";
import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import TutorialAlert from "@/components/tutorials/tutorial-alert";

const MidenWalletAlert = () => (
  <TutorialAlert>
    <Wallet />
    <AlertTitle>
      You need to install{" "}
      <a
        href="https://chromewebstore.google.com/detail/miden-wallet/ablmompanofnodfdkgchkpmphailefpb?hl=en"
        className="text-primary font-medium underline underline-offset-4 inline-flex items-center gap-1"
        target="_blank"
        rel="noreferrer"
      >
        Miden Wallet
      </a>
      .
    </AlertTitle>
    <AlertDescription>
      To complete this tutorial, make sure you have installed and configured
      your Miden Wallet, then pin it to your browser for easy access.
    </AlertDescription>
  </TutorialAlert>
);

export default MidenWalletAlert;
