import { BookOpen, BookOpenCheck } from "lucide-react";
import useTutorials from "@/hooks/use-tutorials";
import { Toggle } from "@workspace/ui/components/toggle";

const TutorialToggle = () => {
  const {
    tutorialOpen,
    nextTutorialStepDisabled,
    openTutorial,
    closeTutorial,
  } = useTutorials();
  return (
    <Toggle
      variant="outline"
      aria-label="Toggle tutorial"
      pressed={tutorialOpen}
      onPressedChange={(pressed) =>
        pressed ? openTutorial() : closeTutorial()
      }
    >
      {nextTutorialStepDisabled ? (
        <BookOpen className="size-4" />
      ) : (
        <BookOpenCheck className="size-4" />
      )}
    </Toggle>
  );
};

export default TutorialToggle;
