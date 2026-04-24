import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import type { TutorialStep } from "@/lib/types/tutorial";
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
          className={cn("grow first:rounded-l-md last:rounded-r-md", {
            "bg-[#ff5500]": index < tutorialStep || index <= tutorialMaxStep,
            "bg-[rgba(255,85,0,0.25)] border border-black/20":
              index === tutorialStep,
            "bg-[#f9f9f9] border border-black/20":
              index > tutorialStep && index > tutorialMaxStep,
            "cursor-pointer": index <= tutorialMaxStep,
            "cursor-not-allowed": index > tutorialMaxStep,
          })}
          onClick={
            index <= tutorialMaxStep ? () => setTutorialStep(index) : undefined
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
  <div className="flex h-3 my-2">
    {steps.map((step, index) => (
      <TutorialProgressStep key={step.title} step={step} index={index} />
    ))}
  </div>
);

export default TutorialProgress;
