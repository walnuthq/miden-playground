import { X } from "lucide-react";
import useTutorials from "@/hooks/use-tutorials";
import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorialStep } from "@/lib/utils/tutorial";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import TutorialProgress from "@/components/tutorials/tutorial-progress";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import MobileAlert from "@/components/tutorials/mobile-alert";
import { cn } from "@workspace/ui/lib/utils";
import DefaultNextStepButton from "@/components/tutorials/next-step-button";
import MockChainAlert from "@/components/tutorials/mockchain-alert";
import MidenWalletAlert from "@/components/tutorials/miden-wallet-alert";
import useNetwork from "@/hooks/use-network";

const TutorialStep = ({ tutorial }: { tutorial: Tutorial }) => {
  const isMobile = useIsMobile();
  const { networkId } = useNetwork();
  const { tutorialStep, tutorialOpen, previousTutorialStep, closeTutorial } =
    useTutorials();
  const step = tutorial.steps[tutorialStep] ?? defaultTutorialStep();
  const NextStepButton = step.NextStepButton ?? DefaultNextStepButton;
  return (
    <div
      className={cn("flex-1 flex-col p-4", {
        flex: tutorialOpen,
        hidden: !tutorialOpen,
      })}
    >
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="bg-[#f9f9f9] border-black/20 text-black/27"
        >
          Step {tutorialStep + 1} of {tutorial.steps.length}
        </Badge>
        <Button variant="ghost" size="icon" onClick={closeTutorial}>
          <X />
        </Button>
      </div>
      <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
        {tutorial.title}
      </h3>
      <p className="text-sm">{step.title}</p>
      <TutorialProgress steps={tutorial.steps} />
      <div className="flex flex-col gap-2">
        {tutorialStep === 0 && (
          <>
            {isMobile && <MobileAlert />}
            {networkId === "mmck" && <MockChainAlert />}
            {networkId !== "mmck" && !window.midenWallet && (
              <MidenWalletAlert />
            )}
          </>
        )}
        {isMobile && tutorialStep === 0 && <MobileAlert />}
        <step.Content />
      </div>
      <div className="flex items-center gap-4 pt-4">
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
