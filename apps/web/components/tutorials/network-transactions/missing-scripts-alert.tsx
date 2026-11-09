import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { TriangleAlert } from "lucide-react";
import useNetworkCounter from "@/components/tutorials/network-transactions/use-network-counter";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import useTutorials from "@/hooks/use-tutorials";

// The steps build on the scripts the tutorial's starter fetches from the API
// (index.ts). A run started while the API couldn't be reached lacks them, and
// never gets them later, a resumed run keeping its saved scripts: every step
// that needs them offers to start over.
const MissingScriptsAlert = () => {
  const { noteScript, component } = useNetworkCounter();
  const { restartTutorial } = useTutorials();
  if (noteScript && component) {
    return null;
  }
  return (
    <TutorialAlert>
      <TriangleAlert />
      <AlertTitle>The tutorial's scripts couldn't be loaded.</AlertTitle>
      <AlertDescription>
        <p>
          The Playground couldn't fetch the counter's scripts when the tutorial
          started, and the steps need them. Restart the tutorial to try again.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => restartTutorial("network-transactions")}
        >
          Restart tutorial
        </Button>
      </AlertDescription>
    </TutorialAlert>
  );
};

export default MissingScriptsAlert;
