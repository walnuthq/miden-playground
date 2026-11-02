import type { NetworkId } from "@/lib/types/network";
import type { Project, ProjectKind } from "@/lib/types/project";
import type { Store } from "@/lib/types/store";
import { genesisBlockHeader } from "@/lib/utils/store";

// Saved projects live in their own IndexedDB database: a snapshot holds a whole
// client store (account code, note scripts…), often several MB, which is more
// than local storage takes. The name must not contain "miden" (in any case):
// `clearMidenStorage`, which runs before every store import, deletes every
// database whose name does.
const PROJECTS_DB_NAME = "PlaygroundProjects";
const PROJECTS_DB_VERSION = 1;
const PROJECTS_STORE = "projects";

export const projectKey = (kind: ProjectKind, id: string) => `${kind}:${id}`;

const openProjectsDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(PROJECTS_DB_NAME, PROJECTS_DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PROJECTS_STORE)) {
        request.result.createObjectStore(PROJECTS_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withProjects = async <T>(
  mode: IDBTransactionMode,
  run: (projects: IDBObjectStore) => IDBRequest<T>,
) => {
  const database = await openProjectsDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(PROJECTS_STORE, mode);
      const request = run(transaction.objectStore(PROJECTS_STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

export const putProject = async (project: Project) => {
  await withProjects("readwrite", (projects) =>
    projects.put(project, projectKey(project.kind, project.id)),
  );
};

export const getProject = async (kind: ProjectKind, id: string) =>
  (await withProjects<Project | undefined>("readonly", (projects) =>
    projects.get(projectKey(kind, id)),
  )) ?? null;

export const deleteProject = async (kind: ProjectKind, id: string) => {
  await withProjects("readwrite", (projects) =>
    projects.delete(projectKey(kind, id)),
  );
};

// Deletes every saved project, e.g. along with the client stores they were
// taken from.
export const deleteProjects = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }
    const request = indexedDB.deleteDatabase(PROJECTS_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });

// Whether a snapshot can be restored on the given network: the store must come
// from that network, and from the same chain (a network reset changes the
// genesis block). The SDK checks the client version itself when importing.
export const isRestorable = (project: Project, networkId: NetworkId) => {
  if (project.version !== 1 || project.networkId !== networkId) {
    return false;
  }
  const expectedGenesis = genesisBlockHeader(networkId);
  if (!expectedGenesis) {
    return true;
  }
  try {
    const store = JSON.parse(project.store) as Partial<Store>;
    const genesis = store.blockHeaders?.find(
      ({ blockNum }) => Number(blockNum) === 0,
    );
    return !genesis || genesis.header.data === expectedGenesis;
  } catch {
    return false;
  }
};
