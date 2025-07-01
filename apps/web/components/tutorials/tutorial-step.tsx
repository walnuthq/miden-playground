import useTutorials from "@/hooks/use-tutorials";
import { type Tutorial } from "@/lib/types";
import { Badge } from "@workspace/ui/components/badge";

const TutorialStep = ({ tutorial }: { tutorial: Tutorial }) => {
  const { tutorialStep } = useTutorials();
  const step = tutorial.steps[tutorialStep];
  if (!step) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          {tutorial.title}
        </h3>
        <Badge>
          Step {tutorialStep + 1}/{tutorial.steps.length}
        </Badge>
      </div>
      {step.content}
      <step.NextStepButton />
    </div>
  );
};

export default TutorialStep;
