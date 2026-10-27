import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { type ReactNode, useEffect, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import TutorialStep from "@/components/tutorials/tutorial-step";
import useTutorials from "@/hooks/use-tutorials";

const InnerTutorialLayout = ({ children }: { children: ReactNode }) => {
  const tutorialRef = useRef<PanelImperativeHandle | null>(null);
  const { tutorial, tutorialOpen } = useTutorials();
  const isMobile = useIsMobile();
  useEffect(() => {
    tutorialRef?.current?.resize(tutorialOpen ? "33%" : "0%");
  }, [tutorialOpen]);
  return isMobile ? (
    <>
      {!tutorialOpen && children}
      {tutorial && <TutorialStep tutorial={tutorial} />}
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
