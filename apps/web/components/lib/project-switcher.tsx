import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  // DropdownMenuGroup,
  // DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { BadgeCheck, CircleDashed } from "lucide-react";
// import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ProjectSwitcherButtonContent,
  projectTitle,
} from "@/components/lib/project-switcher-view";
import tutorials from "@/components/tutorials";
import useAppState from "@/hooks/use-app-state";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";
import useTutorials from "@/hooks/use-tutorials";
import examples from "@/lib/examples";

// The project switcher with its menu (tutorials, examples, new sandboxes).
// `ProjectSwitcherView` (SDK-free) is the button alone, for the app shell.
const ProjectSwitcher = () => {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { networkId } = useNetwork();
  const { resetState } = useAppState();
  const { tutorial, completedTutorials, tutorialStatus, startTutorial } =
    useTutorials();
  const { example, launchExample } = useExamples();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <ProjectSwitcherButtonContent
              title={projectTitle({
                tutorialId: tutorial?.id ?? "",
                exampleId: example?.id ?? "",
                networkId,
              })}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tutorials</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {tutorials.map((tutorial) => {
                    const status = tutorialStatus(tutorial.id);
                    return (
                      <DropdownMenuItem
                        key={tutorial.id}
                        onClick={() => startTutorial(tutorial.id)}
                      >
                        <BadgeCheck
                          className={cn("size-4 text-transparent", {
                            "text-green-500": completedTutorials.has(
                              tutorial.id,
                            ),
                          })}
                        />{" "}
                        {tutorial.number}. {tutorial.title}
                        {status && (
                          <span
                            className="ml-auto flex items-center gap-1 pl-2 text-xs text-muted-foreground"
                            title="In progress"
                          >
                            <CircleDashed className="size-3" />
                            {status.step + 1}/{tutorial.steps.length}
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Examples</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {examples.map((example) => (
                    <DropdownMenuItem
                      key={example.id}
                      onClick={async () => {
                        const toastId = toast.loading(
                          `Launching ${example.title}…`,
                        );
                        const { error } = await launchExample(example.id);
                        if (error !== undefined) {
                          toast.error("Example couldn't be launched.", {
                            id: toastId,
                            description: error,
                          });
                        } else {
                          toast.dismiss(toastId);
                        }
                      }}
                    >
                      {example.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                resetState("mtst");
                navigate("/accounts");
              }}
            >
              New Testnet sandbox
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                resetState("mm");
                navigate("/accounts");
              }}
            >
              New Mainnet sandbox
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={() => {
                resetState("mdev");
                navigate("/accounts");
              }}
            >
              New Devnet sandbox
            </DropdownMenuItem> */}
            {/* <DropdownMenuItem
              onClick={() => {
                resetState("mmck");
                navigate("/accounts");
              }}
            >
              New MockChain sandbox
            </DropdownMenuItem> */}
            {/* import.meta.env.DEV && (
              <DropdownMenuItem
                onClick={() => {
                  resetState("mlcl");
                  navigate("/accounts");
                }}
              >
                New Local sandbox
              </DropdownMenuItem>
            ) */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default ProjectSwitcher;
