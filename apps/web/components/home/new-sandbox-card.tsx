import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router";
import useAppState from "@/hooks/use-app-state";
import { type NetworkId, networks } from "@/lib/types/network";

const NewSandboxCard = ({ networkId }: { networkId: NetworkId }) => {
  const navigate = useNavigate();
  const { resetState } = useAppState();
  return (
    <Card>
      <CardHeader className="gap-0">
        <CardTitle className="text-xl">
          New {networks[networkId]} sandbox
        </CardTitle>
        <CardDescription>Start a new sandbox from scratch.</CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        {networkId === "mm" ? (
          <div className="flex flex-col gap-2">
            <p>
              Choose this option to create a new empty sandbox connected to
              Miden Partner Mainnet, using your Bread Wallet.
            </p>
            <Alert>
              <TriangleAlert />
              <AlertTitle>Real funds</AlertTitle>
              <AlertDescription>
                Partner Mainnet is invite-only: you need a Bread Wallet set up
                on Mainnet with an invite code. Transactions pay fees in real
                USDCX from your wallet, and the network will be reset before
                public mainnet.
              </AlertDescription>
            </Alert>
          </div>
        ) : networkId === "mmck" ? (
          <p>
            Choose this option to experiment on a MockChain environment not
            connected to any network. You won't need to sign transactions using
            a wallet.
          </p>
        ) : (
          <p>
            Choose this option to create a new empty sandbox connected to{" "}
            {networkId === "mlcl"
              ? "a local node"
              : networks[networkId].toLowerCase()}
            .
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full bg-muted/50"
          onClick={() => {
            resetState(networkId);
            navigate("/accounts");
          }}
        >
          Create new {networks[networkId]} sandbox
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewSandboxCard;
