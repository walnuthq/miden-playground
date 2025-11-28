"use client";
import { type ReactNode, useEffect, useRef } from "react";
import useTutorials from "@/hooks/use-tutorials";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { type ImperativePanelHandle } from "react-resizable-panels";
import { useIsClient } from "usehooks-ts";
import TutorialStep from "@/components/tutorials/tutorial-step";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";

const InnerTutorialLayout = ({ children }: { children: ReactNode }) => {
  const tutorialRef = useRef<ImperativePanelHandle | null>(null);
  const { tutorial, tutorialOpen } = useTutorials();
  const isMobile = useIsMobile();
  useEffect(() => {
    tutorialRef?.current?.resize(tutorialOpen ? 33 : 0);
  }, [tutorialOpen]);
  return isMobile ? (
    <>
      {!tutorialOpen && children}
      {tutorial && <TutorialStep tutorial={tutorial} />}
    </>
  ) : (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel id="app" order={1} defaultSize={tutorialOpen ? 67 : 100}>
        {children}
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-transparent" />
      <ResizablePanel
        id="tutorial"
        ref={tutorialRef}
        order={2}
        defaultSize={tutorialOpen ? 33 : 0}
        className="bg-sidebar border z-60 shadow-2xl"
      >
        {tutorial && <TutorialStep tutorial={tutorial} />}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const TutorialLayout = ({ children }: { children: ReactNode }) => {
  const { tutorialId } = useTutorials();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return tutorialId ? (
    <InnerTutorialLayout>{children}</InnerTutorialLayout>
  ) : (
    children
  );
};

export default TutorialLayout;
