import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import type { ReactNode } from "react";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import useTutorials from "@/hooks/use-tutorials";

const TutorialStepAlert = ({
  completed,
  title,
  titleWhenCompleted,
  description,
}: {
  completed?: boolean;
  title: string;
  titleWhenCompleted?: string;
  description: ReactNode;
}) => {
  const { tutorialStep, tutorialMaxStep } = useTutorials();
  const previouslyCompleted = tutorialStep < tutorialMaxStep;
  const stepCompleted = completed || previouslyCompleted;
  return (
    <TutorialAlert>
      {stepCompleted ? (
        <CircleCheckBig color="var(--color-success)" />
      ) : (
        <CircleAlert />
      )}
      <AlertTitle>
        {completed === undefined
          ? title
          : stepCompleted
            ? titleWhenCompleted
            : title}
      </AlertTitle>
      {!stepCompleted && <AlertDescription>{description}</AlertDescription>}
    </TutorialAlert>
  );
};

export default TutorialStepAlert;
