import { useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import useTutorials from "@/hooks/use-tutorials";

const NextStepButton = ({
  text = "Next step",
  disabled = false,
  onClick,
}: {
  text?: string;
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const {
    tutorialStep,
    tutorialMaxStep,
    nextTutorialStepDisabled,
    setNextTutorialStepDisabled,
    nextTutorialStep,
  } = useTutorials();
  useEffect(() => {
    if (nextTutorialStepDisabled !== disabled) {
      setNextTutorialStepDisabled(disabled);
    }
  }, [disabled, nextTutorialStepDisabled, setNextTutorialStepDisabled]);
  return (
    <Button
      className="relative grow-2 bg-[#ff5500]"
      disabled={disabled && tutorialStep === tutorialMaxStep}
      onClick={onClick ?? nextTutorialStep}
    >
      {text}
    </Button>
  );
};

export default NextStepButton;
