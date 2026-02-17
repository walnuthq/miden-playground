"use client";
// import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, BadgeCheck } from "lucide-react";
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
import tutorials from "@/components/tutorials";
import useTutorials from "@/hooks/use-tutorials";
// import useProjects from "@/hooks/use-projects";
import { useIsClient } from "usehooks-ts";
import { networks } from "@/lib/types/network";
// import { cn } from "@workspace/ui/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import useAppState from "@/hooks/use-app-state";

const ProjectSwitcher = () => {
  const isClient = useIsClient();
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { networkId } = useGlobalContext();
  const { resetState } = useAppState();
  const { tutorial, completedTutorials, startTutorial } = useTutorials();
  // const { saveProject, loadProject } = useProjects();
  if (!isClient) {
    return null;
  }
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
                  {tutorial
                    ? `${tutorial.title}`
                    : `${networks[networkId]} sandbox`}
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
            <DropdownMenuItem
              onClick={() => {
                resetState("mtst");
                router.push("/accounts");
              }}
            >
              New Testnet sandbox
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                resetState("mmck");
                router.push("/accounts");
              }}
            >
              New MockChain sandbox
            </DropdownMenuItem>
            {process.env.NODE_ENV === "development" && (
              <DropdownMenuItem
                onClick={() => {
                  resetState("mlcl");
                  router.push("/accounts");
                }}
              >
                New Local sandbox
              </DropdownMenuItem>
            )}
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
                      onClick={() => startTutorial(tutorial.id)}
                    >
                      <BadgeCheck
                        className={cn("size-4 text-transparent", {
                          "text-green-500": completedTutorials.has(tutorial.id),
                        })}
                      />{" "}
                      {tutorial.number}. {tutorial.title}
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
