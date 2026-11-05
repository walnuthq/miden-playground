import { useExportStore } from "@miden-sdk/react";
import useGlobalContext from "@/components/global-context/hook";
import useNetwork from "@/hooks/use-network";
import type { NetworkId } from "@/lib/types/network";
import type { Project, ProjectKind } from "@/lib/types/project";
import type { State } from "@/lib/types/state";
import {
  deleteProject,
  getProject,
  isRestorable,
  listProjects,
  putProject,
} from "@/lib/utils/project";
import { stateDeserializer, stateSerializer } from "@/lib/utils/state";

type ProjectRef = { kind: ProjectKind; id: string; name: string };

// Saves and loads projects: the app state together with the client store it
// describes. Restoring one is up to the caller, with `pushState` and the
// loaded store as `nextStore`, so the store is imported like any other.
const useProjects = () => {
  const { networkId } = useNetwork();
  const { exportStore } = useExportStore();
  const { dispatch: _dispatch, ...state } = useGlobalContext();
  // A snapshot of the current state and client store. `stateOverrides` go
  // into the serialized state: a Save as stamps the new project's id and name
  // into its snapshot before the dispatch that sets them has applied.
  const snapshotProject = async (
    { kind, id, name }: ProjectRef,
    stateOverrides: Partial<State> = {},
  ): Promise<Project> => ({
    version: 1,
    kind,
    id,
    name,
    networkId,
    savedAt: Date.now(),
    state: stateSerializer({ ...state, ...stateOverrides }),
    store: await exportStore(),
  });
  const saveProject = async (
    ref: ProjectRef,
    stateOverrides?: Partial<State>,
  ) => {
    const project = await snapshotProject(ref, stateOverrides);
    await putProject(project);
    return project;
  };
  // The saved project's state and store dump, or null when there is none or
  // it can't be restored (deleted then) on its network, or on
  // `expectedNetworkId` when given (a tutorial's: its snapshot must come from
  // the network the tutorial runs on).
  const loadProject = async (
    kind: ProjectKind,
    id: string,
    expectedNetworkId?: NetworkId,
  ) => {
    const project = await getProject(kind, id);
    if (!project) {
      return null;
    }
    if (!isRestorable(project, expectedNetworkId ?? project.networkId)) {
      await deleteProject(kind, id);
      return null;
    }
    return {
      name: project.name,
      networkId: project.networkId,
      state: stateDeserializer(project.state),
      store: project.store,
      savedAt: project.savedAt,
    };
  };
  return {
    snapshotProject,
    saveProject,
    loadProject,
    deleteProject,
    listProjects,
  };
};

export default useProjects;
