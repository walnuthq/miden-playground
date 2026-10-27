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
import { BadgeCheck, ChevronsUpDown } from "lucide-react";
// import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
// import useProjects from "@/hooks/use-projects";
import Logo from "@/components/lib/logo";
import tutorials from "@/components/tutorials";
import useAppState from "@/hooks/use-app-state";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";
import useTutorials from "@/hooks/use-tutorials";
import examples from "@/lib/examples";
import { networks } from "@/lib/types/network";

const ProjectSwitcher = () => {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { networkId } = useNetwork();
  const { resetState } = useAppState();
  const { tutorial, completedTutorials, startTutorial } = useTutorials();
  const { example, launchExample } = useExamples();
  // const { saveProject, loadProject } = useProjects();
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
            <div className="bg-background border flex aspect-square size-8 items-center justify-center rounded-lg">
              <Logo className="size-6" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Miden Playground</span>
              <span className="truncate text-xs">
                {tutorial
                  ? `${tutorial.title}`
                  : example
                    ? `${example.title}`
                    : `${networks[networkId]} sandbox`}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
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
