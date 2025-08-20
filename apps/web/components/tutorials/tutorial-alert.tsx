import { type ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { CircleAlert, CircleCheckBig } from "lucide-react";

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
}) => (
  <Alert>
    {completed ? (
      <CircleCheckBig color="var(--color-green-500)" />
    ) : (
      <CircleAlert />
    )}
    <AlertTitle>
      {completed === undefined ? title : completed ? titleWhenCompleted : title}
    </AlertTitle>
    {!completed && <AlertDescription>{description}</AlertDescription>}
  </Alert>
);

export default TutorialAlert;
