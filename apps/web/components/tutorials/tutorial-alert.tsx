import { type ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import useTutorials from "@/hooks/use-tutorials";

const TutorialAlert = ({
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
    <Alert>
      {stepCompleted ? (
        <CircleCheckBig color="var(--color-green-500)" />
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
    </Alert>
  );
};

export default TutorialAlert;
