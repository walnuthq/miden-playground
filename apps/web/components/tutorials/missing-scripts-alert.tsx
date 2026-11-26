import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { TriangleAlert } from "lucide-react";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import useTutorials from "@/hooks/use-tutorials";
import type { TutorialId } from "@/lib/types/tutorial";

// For a tutorial whose steps build on the scripts its starter fetches from the
// API (`Tutorial.starter`). A run started while the API couldn't be reached
// lacks them, and never gets them later, a resumed run keeping its saved
// scripts: every step that needs them offers to start over.
const MissingScriptsAlert = ({
  tutorialId,
  loaded,
  scripts,
}: {
  tutorialId: TutorialId;
  // Whether the workspace holds the scripts.
  loaded: boolean;
  // What they are, for the alert's text ("the counter's scripts").
  scripts: string;
}) => {
  const { restartTutorial } = useTutorials();
  if (loaded) {
    return null;
  }
  return (
    <TutorialAlert>
      <TriangleAlert />
      <AlertTitle>The tutorial's scripts couldn't be loaded.</AlertTitle>
      <AlertDescription>
        <p>
          The steps need {scripts}, which the Playground couldn't fetch when the
          tutorial started. Restart the tutorial to try again.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => restartTutorial(tutorialId)}
        >
          Restart tutorial
        </Button>
      </AlertDescription>
    </TutorialAlert>
  );
};

export default MissingScriptsAlert;
