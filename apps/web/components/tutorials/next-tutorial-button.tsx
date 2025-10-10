import { Button } from "@workspace/ui/components/button";
import useTutorials from "@/hooks/use-tutorials";
import tutorials from "@/components/tutorials";

const NextTutorialButton = ({ disabled = false }: { disabled?: boolean }) => {
  const { tutorialId, nextTutorial } = useTutorials();
  const tutorial = tutorials.find(({ id }) => id === tutorialId);
  if (!tutorial) {
    return null;
  }
  return (
    <Button className="grow-2" disabled={disabled} onClick={nextTutorial}>
      {tutorial.number < tutorials.length
        ? "Next tutorial"
        : "Back to tutorials list"}
    </Button>
  );
};

export default NextTutorialButton;
