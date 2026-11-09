import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { TriangleAlert } from "lucide-react";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";
import { basicWalletScript } from "@/lib/tutorials/basic-wallet";

// A run started before the tutorial moved to the real compiler has none of
// what the steps now build on: a script created from the API's P2ID Note
// example (its own came from lib/mock-api.ts), the Rust basic wallet (which
// tells such a run apart: it's in the tutorial's starting state) and a Test
// Wallet deployed with it. It can't be brought up to date, so every step that
// asks for something offers to start over. Goes with lib/mock-api.ts.
const OutdatedRunAlert = () => {
  const { scripts } = useScripts();
  const { restartTutorial } = useTutorials();
  if (scripts.some(({ id }) => id === basicWalletScript.id)) {
    return null;
  }
  return (
    <TutorialAlert>
      <TriangleAlert />
      <AlertTitle>This tutorial changed since you started it.</AlertTitle>
      <AlertDescription>
        <p>
          Your progress comes from an earlier version, and the steps no longer
          apply to it. Restart the tutorial to follow the new ones.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => restartTutorial("timelock-p2id-note")}
        >
          Restart tutorial
        </Button>
      </AlertDescription>
    </TutorialAlert>
  );
};

export default OutdatedRunAlert;
