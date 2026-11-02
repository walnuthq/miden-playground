import { useExportStore } from "@miden-sdk/react";
import useGlobalContext from "@/components/global-context/hook";
import useNetwork from "@/hooks/use-network";
import type { NetworkId } from "@/lib/types/network";
import type { Project, ProjectKind } from "@/lib/types/project";
import {
  deleteProject,
  getProject,
  isRestorable,
  putProject,
} from "@/lib/utils/project";
import { stateDeserializer, stateSerializer } from "@/lib/utils/state";

// Saves and loads projects: the app state together with the client store it
// describes. Restoring one is up to the caller, with `pushState` and the
// loaded store as `nextStore`, so the store is imported like any other.
const useProjects = () => {
  const { networkId } = useNetwork();
  const { exportStore } = useExportStore();
  const { dispatch: _dispatch, ...state } = useGlobalContext();
  // A snapshot of the current state and client store.
  const snapshotProject = async (
    kind: ProjectKind,
    id: string,
  ): Promise<Project> => ({
    version: 1,
    kind,
    id,
    networkId,
    savedAt: Date.now(),
    state: stateSerializer(state),
    store: await exportStore(),
  });
  const saveProject = async (kind: ProjectKind, id: string) => {
    const project = await snapshotProject(kind, id);
    await putProject(project);
    return project;
  };
  // The saved project's state and store dump, or null when there is none or
  // it can't be restored on the network (deleted then).
  const loadProject = async (
    kind: ProjectKind,
    id: string,
    projectNetworkId: NetworkId,
  ) => {
    const project = await getProject(kind, id);
    if (!project) {
      return null;
    }
    if (!isRestorable(project, projectNetworkId)) {
      await deleteProject(kind, id);
      return null;
    }
    return {
      state: stateDeserializer(project.state),
      store: project.store,
      savedAt: project.savedAt,
    };
  };
  return { snapshotProject, saveProject, loadProject, deleteProject };
};

export default useProjects;
