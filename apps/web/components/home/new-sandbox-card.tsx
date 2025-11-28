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
import type { NetworkId } from "@/lib/types/network";
import useWebClient from "@/hooks/use-web-client";

const NewSandboxCard = ({ networkId }: { networkId: NetworkId }) => {
  const router = useRouter();
  const { resetState } = useWebClient();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          New {networkId === "mtst" ? "testnet" : "local"} sandbox
        </CardTitle>
        <CardDescription>Start a new sandbox from scratch.</CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        {networkId === "mtst" ? (
          <p>
            Choose this option to create a new empty sandbox connected to
            testnet.
          </p>
        ) : (
          <p>
            Choose this option to experiment on a local environment not
            connected to any network. You won't need to sign transactions using
            a wallet.
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
