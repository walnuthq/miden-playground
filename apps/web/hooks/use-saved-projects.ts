import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import useGlobalContext from "@/components/global-context/hook";
import useAppState from "@/hooks/use-app-state";
import useNetwork from "@/hooks/use-network";
import useProjects from "@/hooks/use-projects";
import { trackEvent } from "@/lib/analytics";
import { confirmWorkspaceSwitch } from "@/lib/utils/workspace-guard";

const PROJECTS_QUERY_KEY = ["projects"];

// The projects saved from the sidebar's Projects menu: saving the workspace
// (a sandbox or an example) as one, opening one, deleting the active one.
// Tutorials have their own save and resume flow (useTutorials) and are never
// listed here.
const useSavedProjects = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { networkId, switchNetwork } = useNetwork();
  const {
    projectId,
    projectName,
    saveProjectDialogOpen,
    saveProjectDialogSaveAs,
    deleteProjectDialogOpen,
    completedTutorials,
    nextState,
    dispatch,
  } = useGlobalContext();
  const { leaveTutorial, pushState, freshSandboxState } = useAppState();
  const { saveProject, loadProject, deleteProject, listProjects } =
    useProjects();
  // Most recently saved first. Read once, then refreshed after each save and
  // delete.
  const { data: projects = [] } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => listProjects("project"),
  });
  const refreshProjects = () =>
    queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
  // Saves the workspace as a new project, which becomes the active one.
  const saveProjectAs = async (name: string) => {
    const id = crypto.randomUUID();
    await saveProject(
      { kind: "project", id, name },
      { projectId: id, projectName: name },
    );
    dispatch({
      type: "SET_PROJECT",
      payload: { projectId: id, projectName: name },
    });
    await refreshProjects();
    trackEvent("save_project", { network_id: networkId });
  };
  // Saves the workspace to the active project. Without one, ask for a name
  // and call `saveProjectAs` instead.
  const saveActiveProject = async () => {
    if (!projectId) {
      throw new Error("No active project.");
    }
    await saveProject({ kind: "project", id: projectId, name: projectName });
    await refreshProjects();
    trackEvent("save_project", { network_id: networkId });
  };
  // Opens a saved project: switches to its network and queues its state and
  // store, which `popState` imports (after the client re-initialized, when
  // the network changed). The project can't be restored (deleted since, or
  // saved before a network reset): an error. A store the running client
  // refuses (written by a newer one) falls back to a fresh sandbox on the
  // project's network: the previous workspace's store is cleared by then.
  const openProject = async (id: string): Promise<{ error?: string }> => {
    if (!(await confirmWorkspaceSwitch())) {
      return {};
    }
    let project: Awaited<ReturnType<typeof loadProject>>;
    try {
      project = await loadProject("project", id);
    } catch (error) {
      // The project may well be intact: nothing says it's gone.
      console.error("ERROR: loadProject", error);
      return { error: "Its saved data couldn't be read. Try again." };
    }
    if (!project) {
      await refreshProjects();
      return { error: "It was deleted, or saved before a network reset." };
    }
    const tutorialProgress = await leaveTutorial();
    const fallbackState = freshSandboxState(project.networkId, {
      tutorialProgress,
    });
    switchNetwork(project.networkId);
    pushState({
      ...project.state,
      projectId: id,
      projectName: project.name,
      // The live ones: the snapshot's are as old as it is.
      completedTutorials,
      tutorialProgress,
      nextStore: project.store,
      fallbackState,
    });
    navigate("/accounts");
    trackEvent("load_project", { network_id: project.networkId });
    return {};
  };
  // Deletes the active project. The workspace stays open, unsaved.
  const deleteActiveProject = async () => {
    if (!projectId) {
      return;
    }
    await deleteProject("project", projectId);
    dispatch({
      type: "SET_PROJECT",
      payload: { projectId: "", projectName: "" },
    });
    await refreshProjects();
    trackEvent("delete_project", { network_id: networkId });
  };
  const openSaveProjectDialog = (saveAs: boolean) =>
    dispatch({ type: "OPEN_SAVE_PROJECT_DIALOG", payload: { saveAs } });
  const closeSaveProjectDialog = () =>
    dispatch({ type: "CLOSE_SAVE_PROJECT_DIALOG" });
  const openDeleteProjectDialog = () =>
    dispatch({ type: "OPEN_DELETE_PROJECT_DIALOG" });
  const closeDeleteProjectDialog = () =>
    dispatch({ type: "CLOSE_DELETE_PROJECT_DIALOG" });
  return {
    projectId,
    projectName,
    projects,
    // A switch is underway: there's nothing to save until its store is in.
    switching: nextState !== null,
    saveProjectAs,
    saveActiveProject,
    openProject,
    deleteActiveProject,
    saveProjectDialogOpen,
    saveProjectDialogSaveAs,
    deleteProjectDialogOpen,
    openSaveProjectDialog,
    closeSaveProjectDialog,
    openDeleteProjectDialog,
    closeDeleteProjectDialog,
  };
};

export default useSavedProjects;
