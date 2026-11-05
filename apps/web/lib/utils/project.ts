import type { NetworkId } from "@/lib/types/network";
import type { Project, ProjectKind, ProjectMeta } from "@/lib/types/project";
import type { Store } from "@/lib/types/store";
import { genesisBlockHeader } from "@/lib/utils/store";

// Saved projects live in their own IndexedDB database: a snapshot holds a whole
// client store (account code, note scripts…), often several MB, which is more
// than local storage takes. The name must not contain "miden" (in any case):
// `clearMidenStorage`, which runs before every store import, deletes every
// database whose name does.
const PROJECTS_DB_NAME = "PlaygroundProjects";
// Version 2 added the `meta` store (the projects list reads it alone, never
// the snapshots): the upgrade creates whichever store is missing, on a fresh
// database or a version 1 one. Tutorial snapshots saved by version 1 have no
// meta entry; they aren't listed, and load and delete as before.
const PROJECTS_DB_VERSION = 2;
const PROJECTS_STORE = "projects";
const META_STORE = "meta";

export const projectKey = (kind: ProjectKind, id: string) => `${kind}:${id}`;

const openProjectsDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(PROJECTS_DB_NAME, PROJECTS_DB_VERSION);
    request.onupgradeneeded = () => {
      for (const store of [PROJECTS_STORE, META_STORE]) {
        if (!request.result.objectStoreNames.contains(store)) {
          request.result.createObjectStore(store);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// Runs `run` in one transaction over both stores, resolving with its request's
// result once the transaction completes (so a write is on disk).
const withProjects = async <T>(
  mode: IDBTransactionMode,
  run: (projects: IDBObjectStore, meta: IDBObjectStore) => IDBRequest<T>,
) => {
  const database = await openProjectsDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(
        [PROJECTS_STORE, META_STORE],
        mode,
      );
      const request = run(
        transaction.objectStore(PROJECTS_STORE),
        transaction.objectStore(META_STORE),
      );
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

const projectMeta = ({
  kind,
  id,
  name,
  networkId,
  savedAt,
}: Project): ProjectMeta => ({ kind, id, name, networkId, savedAt });

export const putProject = async (project: Project) => {
  const key = projectKey(project.kind, project.id);
  await withProjects("readwrite", (projects, meta) => {
    meta.put(projectMeta(project), key);
    return projects.put(project, key);
  });
};

export const getProject = async (kind: ProjectKind, id: string) =>
  (await withProjects<Project | undefined>("readonly", (projects) =>
    projects.get(projectKey(kind, id)),
  )) ?? null;

export const deleteProject = async (kind: ProjectKind, id: string) => {
  const key = projectKey(kind, id);
  await withProjects("readwrite", (projects, meta) => {
    meta.delete(key);
    return projects.delete(key);
  });
};

// The saved projects of a kind, most recently saved first.
export const listProjects = async (kind: ProjectKind) =>
  (
    await withProjects<ProjectMeta[]>("readonly", (_projects, meta) =>
      meta.getAll(),
    )
  )
    .filter((project) => project.kind === kind)
    .sort((a, b) => b.savedAt - a.savedAt);

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
