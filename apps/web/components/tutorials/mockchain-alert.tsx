import { FlaskConical } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

const MockChainAlert = () => (
  <Alert>
    <FlaskConical />
    <AlertTitle>This tutorial uses a MockChain.</AlertTitle>
    <AlertDescription>
      All actions in this tutorial will be performed on a MockChain, an
      environment simulating the Miden network. You won't need a Miden Wallet to
      sign transactions.
    </AlertDescription>
  </Alert>
);

export default MockChainAlert;
