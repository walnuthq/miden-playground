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
import {
  BadgeCheck,
  Check,
  CircleDashed,
  Copy,
  Save,
  Trash2,
} from "lucide-react";
// import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ProjectSwitcherButtonContent,
  projectTitle,
} from "@/components/lib/project-switcher-view";
import { tutorialMetas } from "@/components/tutorials/meta";
import useAppState from "@/hooks/use-app-state";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";
import useSavedProjects from "@/hooks/use-saved-projects";
import useTutorials from "@/hooks/use-tutorials";
import examples from "@/lib/examples";
import { type NetworkId, networks } from "@/lib/types/network";
import type { ProjectMeta } from "@/lib/types/project";
import { confirmWorkspaceSwitch } from "@/lib/utils/workspace-guard";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// The project switcher with its menu (tutorials, examples, saved projects,
// new sandboxes). `ProjectSwitcherView` (SDK-free) is the button alone, for
// the app shell.
const ProjectSwitcher = () => {
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const { networkId } = useNetwork();
  const { resetState } = useAppState();
  const { tutorialId, completedTutorials, tutorialStatus, startTutorial } =
    useTutorials();
  const { example, launchExample } = useExamples();
  const {
    projectId,
    projectName,
    projects,
    switching,
    saveActiveProject,
    openProject,
    openSaveProjectDialog,
    openDeleteProjectDialog,
  } = useSavedProjects();
  // The Save dialog (Save as, and Save without an active project) and the
  // delete confirmation render next to the sidebar (AppSidebar), not here: on
  // a phone the sidebar is a sheet, which unmounts this switcher when it
  // closes, and it closes so the dialog shows over the page, not the sheet.
  const openSaveDialog = (saveAs: boolean) => {
    setOpenMobile(false);
    openSaveProjectDialog(saveAs);
  };
  const openDeleteDialog = () => {
    setOpenMobile(false);
    openDeleteProjectDialog();
  };
  const title = projectTitle({
    projectName,
    tutorialId,
    exampleId: example?.id ?? "",
    networkId,
  });
  const save = async () => {
    if (!projectId) {
      openSaveDialog(false);
      return;
    }
    try {
      await saveActiveProject();
      toast.success("Project saved.", { description: projectName });
    } catch (error) {
      console.error("ERROR: saveActiveProject", error);
      toast.error("The project couldn't be saved.", {
        description: errorMessage(error),
      });
    }
  };
  const open = async (project: ProjectMeta) => {
    // Already open: carry on where it is. Reloading its last save would throw
    // away what changed since. (During a switch, it's a way back.)
    if (project.id === projectId && !switching) {
      setOpenMobile(false);
      navigate("/accounts");
      return;
    }
    const toastId = toast.loading(`Opening ${project.name}…`);
    const { error } = await openProject(project.id);
    if (error !== undefined) {
      toast.error(`${project.name} couldn't be opened.`, {
        id: toastId,
        description: error,
      });
    } else {
      toast.dismiss(toastId);
    }
  };
  const newSandbox = async (newNetworkId: NetworkId) => {
    if (await confirmWorkspaceSwitch()) {
      resetState(newNetworkId);
      navigate("/accounts");
    }
  };
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
            <ProjectSwitcherButtonContent title={title} />
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
                  {tutorialMetas.map((tutorial) => {
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
                            {status.step + 1}/{tutorial.stepCount}
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Projects</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {/* Saving is for sandboxes and examples: a tutorial saves
                      itself when left, and resumes from its card. Any
                      workspace can open a project. */}
                  {tutorialId === "" && (
                    <>
                      <DropdownMenuItem disabled={switching} onClick={save}>
                        <Save className="size-4" /> Save
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={switching}
                        onClick={() => openSaveDialog(true)}
                      >
                        <Copy className="size-4" /> Save as…
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!projectId || switching}
                        onClick={openDeleteDialog}
                      >
                        <Trash2 className="size-4" /> Delete project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {projects.length === 0 && (
                    <DropdownMenuItem disabled>
                      No saved projects
                    </DropdownMenuItem>
                  )}
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => open(project)}
                    >
                      <Check
                        className={cn("size-4 text-transparent", {
                          "text-green-500": project.id === projectId,
                        })}
                      />{" "}
                      {project.name} {/* Opening it switches to its network. */}
                      <span className="ml-auto pl-2 text-xs text-muted-foreground">
                        {networks[project.networkId]}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => newSandbox("mtst")}>
              New Testnet sandbox
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => newSandbox("mm")}>
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
