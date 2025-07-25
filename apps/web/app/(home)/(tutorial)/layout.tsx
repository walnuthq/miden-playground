"use client";
import { type ReactNode } from "react";
import useTutorials from "@/hooks/use-tutorials";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { useIsClient } from "usehooks-ts";
import TutorialStep from "@/components/tutorials/tutorial-step";

const TutorialLayout = ({ children }: { children: ReactNode }) => {
  const { tutorial } = useTutorials();
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={67}>{children}</ResizablePanel>
      <ResizableHandle withHandle className="bg-transparent" />
      <ResizablePanel
        defaultSize={33}
        className="bg-sidebar border rounded-md z-60"
      >
        {tutorial && <TutorialStep tutorial={tutorial} />}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const Layout = ({ children }: { children: ReactNode }) => {
  const { tutorialId } = useTutorials();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return tutorialId ? <TutorialLayout>{children}</TutorialLayout> : children;
};

export default Layout;
