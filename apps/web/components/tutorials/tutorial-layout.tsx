import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { BookOpen, BookOpenCheck, ChevronUp } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import TutorialStep from "@/components/tutorials/tutorial-step";
import useTutorials, { useLoadedTutorial } from "@/hooks/use-tutorials";
import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorialStep } from "@/lib/utils/tutorial";

// On a phone the tutorial is a panel stuck to the bottom of the screen, over
// the page, which stays usable above it (and the header with it). Closed, it
// shrinks to a bar naming the step, which opens it again. In the page's flow
// (sticky, not fixed), so the page's end can scroll out from under it.
const MobileTutorialPanel = ({ tutorial }: { tutorial: Tutorial }) => {
  const { tutorialOpen, tutorialStep, nextTutorialStepDisabled, openTutorial } =
    useTutorials();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reopenedRef = useRef(false);
  const wasDisabledRef = useRef(nextTutorialStepDisabled);
  // A step's action is done (in the page, so the panel is likely closed):
  // show the step again, scrolled to its Next button.
  useEffect(() => {
    if (wasDisabledRef.current && !nextTutorialStepDisabled) {
      reopenedRef.current = true;
      openTutorial();
    }
    wasDisabledRef.current = nextTutorialStepDisabled;
  }, [nextTutorialStepDisabled, openTutorial]);
  useEffect(() => {
    if (tutorialOpen && reopenedRef.current && scrollRef.current) {
      reopenedRef.current = false;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tutorialOpen]);
  // A new step starts at its top.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on step changes.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [tutorialStep]);
  const step = tutorial.steps[tutorialStep] ?? defaultTutorialStep();
  return (
    // `id`: the e2e helpers find the panel by it, as on desktop.
    <div
      id="tutorial"
      className="sticky bottom-0 z-10 mt-auto rounded-t-xl border-t bg-background shadow-[0_-8px_24px_rgb(0_0_0/0.25)]"
    >
      {/* Mounted while closed: its step's Next button reports whether the
          step is done (`nextTutorialStepDisabled`). */}
      <div
        ref={scrollRef}
        className={cn(
          "max-h-[60dvh] overflow-y-auto",
          !tutorialOpen && "hidden",
        )}
      >
        <TutorialStep tutorial={tutorial} />
      </div>
      {!tutorialOpen && (
        <button
          type="button"
          aria-label="Open tutorial"
          onClick={openTutorial}
          className="flex h-12 w-full items-center gap-2 px-4 text-sm"
        >
          {nextTutorialStepDisabled ? (
            <BookOpen className="size-4 shrink-0" />
          ) : (
            <BookOpenCheck className="size-4 shrink-0 text-primary" />
          )}
          <span className="shrink-0 text-muted-foreground">
            Step {tutorialStep + 1} of {tutorial.steps.length}
          </span>
          <span className="truncate">{step.title}</span>
          <ChevronUp className="ml-auto size-4 shrink-0" />
        </button>
      )}
    </div>
  );
};

const InnerTutorialLayout = ({ children }: { children: ReactNode }) => {
  const tutorialRef = useRef<PanelImperativeHandle | null>(null);
  const { tutorialOpen } = useTutorials();
  const tutorial = useLoadedTutorial();
  const isMobile = useIsMobile();
  useEffect(() => {
    tutorialRef?.current?.resize(tutorialOpen ? "33%" : "0%");
  }, [tutorialOpen]);
  return isMobile ? (
    <>
      {children}
      {tutorial && <MobileTutorialPanel tutorial={tutorial} />}
    </>
  ) : (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel id="app" defaultSize={tutorialOpen ? "67%" : "100%"}>
        {children}
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-transparent" />
      <ResizablePanel
        id="tutorial"
        panelRef={tutorialRef}
        defaultSize={tutorialOpen ? "33%" : "0%"}
        className="bg-background border z-10 shadow-2xl"
      >
        {tutorial && <TutorialStep tutorial={tutorial} />}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const TutorialLayout = ({ children }: { children: ReactNode }) => {
  const { tutorialId } = useTutorials();
  return tutorialId ? (
    <InnerTutorialLayout>{children}</InnerTutorialLayout>
  ) : (
    children
  );
};

export default TutorialLayout;
