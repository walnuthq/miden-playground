"use client";
import { useEffect } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
  // DropdownMenuGroup,
  // DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import Logo from "@/components/lib/logo";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials/tutorials";
import useTutorials from "@/hooks/use-tutorials";
// import useProjects from "@/hooks/use-projects";
import { useIsClient } from "usehooks-ts";
import useTransactions from "@/hooks/use-transactions";

const ProjectSwitcher = () => {
  const isClient = useIsClient();
  const { isMobile } = useSidebar();
  const { resetState } = useGlobalContext();
  const { tutorial, tutorialId, startTutorial, loadTutorial } = useTutorials();
  const { transactions } = useTransactions();
  // const { saveProject, loadProject } = useProjects();
  useEffect(() => {
    if (tutorialId && transactions.length === 0) {
      console.log("loading", tutorialId);
      loadTutorial(tutorialId);
    }
  }, [tutorialId]);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                <Logo className="size-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Miden Playground</span>
                <span className="truncate text-xs">
                  {isClient ? (
                    tutorial ? (
                      tutorial.title
                    ) : (
                      "Empty sandbox"
                    )
                  ) : (
                    <>&nbsp;</>
                  )}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuItem onClick={() => resetState()}>
              New empty sandbox
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={() => loadTutorial("transfer-assets-between-wallets")}
            >
              Load tutorial
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            {/* <DropdownMenuSub>
              <DropdownMenuSubTrigger>Projects</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => saveProject()}>
                    Save project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadProject()}>
                    Load project
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub> */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tutorials</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {tutorials.map((tutorial) => (
                    <DropdownMenuItem
                      key={tutorial.id}
                      onClick={async () => {
                        startTutorial(tutorial.id);
                        //await sleep(2000);
                        //loadTutorial(tutorial.id);
                        /*sleep(2000).then(() => {
                          loadTutorial(tutorial.id);
                        });*/
                      }}
                    >
                      {tutorial.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default ProjectSwitcher;
