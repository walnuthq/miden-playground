import { Button } from "@workspace/ui/components/button";
import { tutorialMetas } from "@/components/tutorials/meta";
import useTutorials from "@/hooks/use-tutorials";

const NextTutorialButton = ({ disabled = false }: { disabled?: boolean }) => {
  const { tutorialMeta: tutorial, nextTutorial } = useTutorials();
  if (!tutorial) {
    return null;
  }
  return (
    <Button className="grow-2" disabled={disabled} onClick={nextTutorial}>
      {tutorial.number < tutorialMetas.length
        ? "Next tutorial"
        : "Back to tutorials list"}
    </Button>
  );
};

export default NextTutorialButton;
