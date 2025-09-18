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
      className="relative grow-2"
      disabled={disabled}
      onClick={onClick ?? nextTutorialStep}
    >
      {text}
      {!disabled && tutorialStep === tutorialMaxStep && (
        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f50] opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-[#f50]" />
        </span>
      )}
    </Button>
  );
};

export default NextStepButton;
