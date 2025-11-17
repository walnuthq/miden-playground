import useTutorials from "@/hooks/use-tutorials";
import { type Tutorial, defaultTutorialStep } from "@/lib/types/tutorial";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import TutorialProgress from "@/components/tutorials/tutorial-progress";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import MobileAlert from "@/components/tutorials/mobile-alert";
import { cn } from "@workspace/ui/lib/utils";
import DefaultNextStepButton from "@/components/tutorials/next-step-button";
import useGlobalContext from "@/components/global-context/hook";
import MockChainAlert from "@/components/tutorials/mockchain-alert";
import MidenWalletAlert from "@/components/tutorials/miden-wallet-alert";

const TutorialStep = ({ tutorial }: { tutorial: Tutorial }) => {
  const isMobile = useIsMobile();
  const { networkId } = useGlobalContext();
  const { tutorialStep, tutorialOpen, previousTutorialStep } = useTutorials();
  const step = tutorial.steps[tutorialStep] ?? defaultTutorialStep();
  const NextStepButton = step.NextStepButton ?? DefaultNextStepButton;
  return (
    <div
      className={cn("flex-1 flex-col gap-4 p-4", {
        flex: tutorialOpen,
        hidden: !tutorialOpen,
      })}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {tutorial.title} tutorial
          </h3>
          <p className="text-muted-foreground text-sm">{step.title}</p>
        </div>
        <Badge>
          Step {tutorialStep + 1} / {tutorial.steps.length}
        </Badge>
      </div>
      <TutorialProgress steps={tutorial.steps} />
      <div className="flex flex-col gap-4">
        {tutorialStep === 0 && (
          <>
            {isMobile && <MobileAlert />}
            {networkId === "mlcl" && <MockChainAlert />}
            {networkId === "mtst" && !window.midenWallet && (
              <MidenWalletAlert />
            )}
          </>
        )}
        {isMobile && tutorialStep === 0 && <MobileAlert />}
        <step.Content />
      </div>
      <div className="flex items-center gap-4">
        {tutorialStep > 0 && (
          <Button
            className="grow"
            variant="outline"
            onClick={previousTutorialStep}
          >
            Back
          </Button>
        )}
        <NextStepButton />
      </div>
    </div>
  );
};

export default TutorialStep;
