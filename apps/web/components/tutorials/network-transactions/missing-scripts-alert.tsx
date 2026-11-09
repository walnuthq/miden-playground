import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { TriangleAlert } from "lucide-react";
import useNetworkCounter from "@/components/tutorials/network-transactions/use-network-counter";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";

// The steps build on the scripts the tutorial's starter fetches from the API
// (index.ts). Two kinds of run lack them: one started while the API couldn't
// be reached, and one started before the tutorial moved to compiled packages,
// whose state holds the MASM counter instead (`counter-value-contract` tells
// it apart). Neither gets them later, a resumed run keeping its saved scripts,
// so every step that needs them offers to start over. The second case goes
// with lib/mock-api.ts.
const MissingScriptsAlert = () => {
  const { scripts } = useScripts();
  const { noteScript, component } = useNetworkCounter();
  const { restartTutorial } = useTutorials();
  if (noteScript && component) {
    return null;
  }
  const outdated = scripts.some(({ id }) => id === "counter-value-contract");
  return (
    <TutorialAlert>
      <TriangleAlert />
      <AlertTitle>
        {outdated
          ? "This tutorial changed since you started it."
          : "The tutorial's scripts couldn't be loaded."}
      </AlertTitle>
      <AlertDescription>
        <p>
          {outdated
            ? "Your progress comes from an earlier version, and the steps no longer apply to it. Restart the tutorial to follow the new ones."
            : "The Playground couldn't fetch the counter's scripts when the tutorial started, and the steps need them. Restart the tutorial to try again."}
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
