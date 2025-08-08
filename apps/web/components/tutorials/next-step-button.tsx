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
      className="grow-2"
      disabled={disabled}
      onClick={onClick ?? nextTutorialStep}
    >
      {text}
    </Button>
  );
};

export default NextStepButton;
