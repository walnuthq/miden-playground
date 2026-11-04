import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { TriangleAlert } from "lucide-react";

// Partner Mainnet only creates the accounts on its allowlist (each registered
// with an invite code) and network accounts, and the playground doesn't
// register accounts: wallets and faucets can't be created there.
const MainnetAllowlistAlert = () => (
  <Alert>
    <TriangleAlert />
    <AlertTitle>Not available on Partner Mainnet</AlertTitle>
    <AlertDescription>
      Partner Mainnet only accepts new accounts registered with an invite code.
      Use your Bread Wallet account, or deploy a network account.
    </AlertDescription>
  </Alert>
);

export default MainnetAllowlistAlert;
