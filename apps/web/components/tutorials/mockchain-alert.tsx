import { FlaskConical } from "lucide-react";
import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import TutorialAlert from "@/components/tutorials/tutorial-alert";

const MockChainAlert = () => (
  <TutorialAlert>
    <FlaskConical />
    <AlertTitle>This tutorial uses a MockChain.</AlertTitle>
    <AlertDescription>
      All actions in this tutorial will be performed on a MockChain, an
      environment simulating the Miden network. You won't need a Miden Wallet to
      sign transactions.
    </AlertDescription>
  </TutorialAlert>
);

export default MockChainAlert;
