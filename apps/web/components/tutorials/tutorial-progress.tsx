import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { type TutorialStep } from "@/lib/types";
import useTutorials from "@/hooks/use-tutorials";
import { cn } from "@workspace/ui/lib/utils";

const TutorialProgressStep = ({
  step,
  index,
}: {
  step: TutorialStep;
  index: number;
}) => {
  const { tutorialStep, tutorialMaxStep, setTutorialStep } = useTutorials();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "grow-1 first:rounded-l-md last:rounded-r-md border not-first:border-l-0 border-gray-400",
            {
              "bg-green-400": index < tutorialStep || index <= tutorialMaxStep,
              "bg-yellow-400": index === tutorialStep,
              "bg-muted": index > tutorialStep && index > tutorialMaxStep,
              "cursor-pointer": index <= tutorialMaxStep,
              "cursor-not-allowed": index > tutorialMaxStep,
            }
          )}
          onClick={() =>
            index <= tutorialMaxStep ? setTutorialStep(index) : undefined
          }
        >
          &nbsp;
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Step {index + 1}: {step.title}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

const TutorialProgress = ({ steps }: { steps: TutorialStep[] }) => (
  <div className="flex h-3">
    {steps.map((step, index) => (
      <TutorialProgressStep key={step.title} step={step} index={index} />
    ))}
  </div>
);

export default TutorialProgress;
