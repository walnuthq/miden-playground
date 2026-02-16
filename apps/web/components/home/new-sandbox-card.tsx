import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { type NetworkId, networks } from "@/lib/types/network";
import useAppState from "@/hooks/use-app-state";

const NewSandboxCard = ({ networkId }: { networkId: NetworkId }) => {
  const router = useRouter();
  const { resetState } = useAppState();
  return (
    <Card>
      <CardHeader>
        <CardTitle>New {networks[networkId]} sandbox</CardTitle>
        <CardDescription>Start a new sandbox from scratch.</CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        {networkId === "mmck" ? (
          <p>
            Choose this option to experiment on a MockChain environment not
            connected to any network. You won't need to sign transactions using
            a wallet.
          </p>
        ) : (
          <p>
            Choose this option to create a new empty sandbox connected to{" "}
            {networks[networkId]}.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => {
            resetState(networkId);
            router.push("/accounts");
          }}
        >
          Create new sandbox environment
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewSandboxCard;
