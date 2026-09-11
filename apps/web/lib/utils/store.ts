import type { Store, StoreBlockHeader } from "@/lib/types/store";
import { networks, type NetworkId } from "@/lib/types/network";

const testnetBlock0Header: StoreBlockHeader = {
  blockNum: 0,
  header: {
    __type: "Uint8Array",
    data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGiiazpzf2dLPa8g5qfkgCIk7sKuzxeql8hKqgpWYMJLr/1ixzi3MqIgTTMzSALNeGF/l7rPb2cOaCKcZ7iuTBUtKkVzO2ErNwxng3yekiYjFtfviE0CpiRBj+4mIgPamqnb1H8kW9+42yEEKLi4s+X26JrjL/M13gLnswACwlI6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADrFBSA7XCrPSvzux7I6ENYxByhEEWuy72ViBxaL5XKQwUDP1KzM2YJ4VSPnlnSwplYsaAcf3OqoLdhrIqoFJQq/k4Dvz0vCjJr4ho3JgVyBm6MyktoP4N33OPujJwzurtwbUoYEB+lIsF0sWXv1PcKA4UHAAAAngShag==",
  },
  hasClientNotes: "false",
};

const devnetBlock0Header: StoreBlockHeader = {
  blockNum: 0,
  header: {
    __type: "Uint8Array",
    data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGiiazpzf2dLPa8g5qfkgCIk7sKuzxeql8hKqgpWYMJL7KfY5FV9yXwQjouaAIrF/oMeK/K2htPQXIzMiQNivQktKkVzO2ErNwxng3yekiYjFtfviE0CpiRBj+4mIgPamqnb1H8kW9+42yEEKLi4s+X26JrjL/M13gLnswACwlI6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADrFBSA7XCrPSvzux7I6ENYxByhEEWuy72ViBxaL5XKQwMDKz4bJfX6SUVhwsp495k/3jMZ+9zDw0nTUSR9Br6KeGAFq+BNKS8K8QLrttFWDa4AAAAA3DqDag==",
  },
  hasClientNotes: "false",
};

const blockHeaders = {
  mtst: testnetBlock0Header,
  mdev: devnetBlock0Header,
  mlcl: testnetBlock0Header,
  mmck: testnetBlock0Header,
} as const;

export const defaultStore = (networkId: NetworkId): Store => ({
  accountCode: [],
  latestAccountStorage: [],
  historicalAccountStorage: [],
  latestStorageMapEntries: [],
  historicalStorageMapEntries: [],
  latestAccountAssets: [],
  historicalAccountAssets: [],
  accountAuth: [],
  accountKeyMapping: [],
  latestAccountHeaders: [],
  historicalAccountHeaders: [],
  addresses: [],
  transactions: [],
  transactionScripts: [],
  inputNotes: [],
  outputNotes: [],
  notesScripts: [],
  blockchainCheckpoint: [
    {
      id: 1,
      blockNum: 0,
      partialBlockchainPeaks: { __type: "Uint8Array", data: "" },
    },
  ],
  blockHeaders: [blockHeaders[networkId]],
  partialBlockchainNodes: [],
  tags: [],
  foreignAccountCode: [],
  settings: [
    {
      scope: 0,
      key: "clientVersion",
      value: { __type: "Uint8Array", data: "MC4xNi4w" },
    },
  ],
});

export const storeName = (networkId: NetworkId) =>
  networkId === "mmck" ? "mock_client_db" : `MidenClientDB_${networkId}`;

// The web client opens its IndexedDB as `MidenClientDB_{network}`, alongside the
// mock chain's own database (see `storeName` above).
const MIDEN_STORE_DB_PREFIX = "MidenClientDB";
const SETTINGS_TABLE = "settings";

const midenStoreNames = async () => {
  if (typeof indexedDB.databases !== "function") {
    // Firefox only shipped `databases()` in 126; probe the names we can build.
    return (Object.keys(networks) as NetworkId[]).map(storeName);
  }
  const databases = await indexedDB.databases();
  return databases
    .map(({ name }) => name)
    .filter((name) => name !== undefined)
    .filter(
      (name) =>
        name.startsWith(MIDEN_STORE_DB_PREFIX) || name === storeName("mmck"),
    );
};

const deleteStore = (name: string) =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn(
        `ERROR: deleting IndexedDB "${name}" was blocked, close the other tabs using it`,
      );
      resolve();
    };
  });

// Web SDK 0.16 re-keyed the `settings` table from `key` to `[scope+key]`, which
// Dexie can only do by dropping and recreating it — taking the `clientVersion`
// row with it. That row is what the SDK's own "reset the store on a major/minor
// client upgrade" check reads, so upgrading a pre-0.16 database leaves it with
// no stored version, which the SDK treats as a brand new store and keeps: the
// client then fails on the 0.15 rows it cannot decode ("failed to deserialize
// data from the store: invalid value: Invalid public key"). The old key path is
// the last evidence that a store predates 0.16, and Dexie erases it the moment
// the client opens the database, so this has to run first.
const isLegacyStore = (name: string) =>
  new Promise<boolean>((resolve, reject) => {
    const request = indexedDB.open(name);
    let created = false;
    request.onupgradeneeded = () => {
      created = true;
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      try {
        if (created) {
          // Opening a database that does not exist creates an empty one; undo it.
          database.close();
          deleteStore(name).then(() => resolve(false), reject);
          return;
        }
        if (!database.objectStoreNames.contains(SETTINGS_TABLE)) {
          database.close();
          resolve(true);
          return;
        }
        // The key path has to be read before the connection is closed, since a
        // closing connection refuses to open a transaction.
        const transaction = database.transaction(SETTINGS_TABLE, "readonly");
        const { keyPath } = transaction.objectStore(SETTINGS_TABLE);
        transaction.abort();
        database.close();
        resolve(!Array.isArray(keyPath));
      } catch (error) {
        database.close();
        reject(error);
      }
    };
  });

// Deletes every client store written before web SDK 0.16, which that version
// can no longer read. Returns the names it deleted.
export const deleteLegacyMidenStores = async () => {
  if (typeof indexedDB === "undefined") {
    return [];
  }
  const names = await midenStoreNames();
  const stores = await Promise.all(
    // Checked independently so one unreadable database cannot hide the others.
    names.map(async (name) => {
      try {
        return { name, legacy: await isLegacyStore(name) };
      } catch (error) {
        console.error(`ERROR: isLegacyStore ${name}`, error);
        return { name, legacy: false };
      }
    }),
  );
  const legacyNames = stores
    .filter(({ legacy }) => legacy)
    .map(({ name }) => name);
  await Promise.all(legacyNames.map(deleteStore));
  return legacyNames;
};

// Deletes every client store, whatever version wrote it.
export const deleteMidenStores = async () => {
  if (typeof indexedDB === "undefined") {
    return;
  }
  const names = await midenStoreNames();
  await Promise.all(names.map(deleteStore));
};
