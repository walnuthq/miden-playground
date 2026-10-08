import type { Store, StoreBlockHeader } from "@/lib/types/store";
import { networks, type NetworkId } from "@/lib/types/network";

// The version of the web SDK's IndexedDB store (the `idxdb-store` crate version
// it writes to the `clientVersion` setting). Bump it alongside the SDK.
const CLIENT_VERSION = "0.17.2";
// The `settings` row the SDK keeps that version in.
const SETTING_SCOPE_CLIENT = 0;
const CLIENT_VERSION_SETTING_KEY = "clientVersion";

const testnetBlock0Header: StoreBlockHeader = {
  blockNum: 0,
  header: {
    __type: "Uint8Array",
    data: "CAEVAZrDahoAIiIKIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKiIKIGiiazpzf2dLPa8g5qfkgCIk7sKuzxeql8hKqgpWYMJLMiIKIJO6yLz5JgBK+7ULtW6IHLtWs/Q4tbpsCYAjFni99JyBOiIKIC0qRXM7YSs3DGeDfJ6SJiMW1++ITQKmJEGP7iYiA9qaQiIKIKnb1H8kW9+42yEEKLi4s+X26JrjL/M13gLnswACwlI6SiIKIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUkwKIwohAxxqsUO+9UEHkFicOLdV1Wej3KTsJ7kZJcYe9YPOeXLDCiMKIQO2VFQePH+0miFE9cpHLS3GE1+h7IJb3pbb4cNtg9MVcxACWgUNBwAAAGIiCiDPiNZ6QGC3/jdzkpAJ42vp6cGPsXtsxgFArjqQAH8yFw==",
  },
  hasClientNotes: "false",
};

const devnetBlock0Header: StoreBlockHeader = {
  blockNum: 0,
  header: {
    __type: "Uint8Array",
    data: "",
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
      key: CLIENT_VERSION_SETTING_KEY,
      value: { __type: "Uint8Array", data: btoa(CLIENT_VERSION) },
    },
    // {
    //   scope: 0,
    //   key: "note_transport_cursor",
    //   value: { __type: "Uint8Array", data: "Aa1lWqM3Q5xXAAAAAAAAAAA=" },
    // },
    {
      scope: 0,
      key: "protocol_config:0xcf88d67a4060b7fe3773929009e36be9e9c18fb17b6cc60140ae3a90007f3217",
      value: {
        __type: "Uint8Array",
        data: "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",
      },
    },
    // {
    //   scope: 0,
    //   key: "rpc_limits",
    //   value: { __type: "Uint8Array", data: "ZAAAAOgDAADoAwAA6AMAAA==" },
    // },
  ],
  accountWitnesses: [],
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

const majorMinor = (version: string) => {
  const match = /^(\d+)\.(\d+)\.\d+/.exec(version);
  return match ? [Number(match[1]), Number(match[2])] : null;
};

// Mirrors the SDK's own check: a store written by an older major/minor client
// is one the SDK resets when it opens it, and so is one whose version does not
// parse. A store with no version at all is kept, as the SDK does.
const isOutdatedClientVersion = (storedVersion: string | null) => {
  if (storedVersion === null) {
    return false;
  }
  const stored = majorMinor(storedVersion);
  const [currentMajor = 0, currentMinor = 0] = majorMinor(CLIENT_VERSION) ?? [];
  if (!stored) {
    return true;
  }
  const [storedMajor = 0, storedMinor = 0] = stored;
  return (
    storedMajor < currentMajor ||
    (storedMajor === currentMajor && storedMinor < currentMinor)
  );
};

// Web SDK 0.16 re-keyed the `settings` table from `key` to `[scope+key]`, which
// Dexie can only do by dropping and recreating it — taking the `clientVersion`
// row with it. That row is what the SDK's own "reset the store on a major/minor
// client upgrade" check reads, so upgrading a pre-0.16 database leaves it with
// no stored version, which the SDK treats as a brand new store and keeps: the
// client then fails on the 0.15 rows it cannot decode ("failed to deserialize
// data from the store: invalid value: Invalid public key"). The old key path is
// the last evidence that a store predates 0.16, and Dexie erases it the moment
// the client opens the database, so this has to run first.
//
// From 0.16 on the `clientVersion` row survives, and the SDK resets a store
// written by an older major/minor client itself (e.g. a 0.16 store opened by
// 0.17). It does so silently though, so the accounts, notes and transactions
// the persisted app state lists would outlive the store backing them: the
// store is flagged here too, so both are dropped together.
const isOutdatedStore = (name: string) =>
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
        // The settings have to be read before the connection is closed, since a
        // closing connection refuses to open a transaction.
        const transaction = database.transaction(SETTINGS_TABLE, "readonly");
        const settings = transaction.objectStore(SETTINGS_TABLE);
        if (!Array.isArray(settings.keyPath)) {
          transaction.abort();
          database.close();
          resolve(true);
          return;
        }
        const versionRequest = settings.get([
          SETTING_SCOPE_CLIENT,
          CLIENT_VERSION_SETTING_KEY,
        ]);
        versionRequest.onsuccess = () => {
          const record = versionRequest.result as
            { value?: Uint8Array } | undefined;
          database.close();
          resolve(
            isOutdatedClientVersion(
              record?.value ? new TextDecoder().decode(record.value) : null,
            ),
          );
        };
        versionRequest.onerror = () => {
          database.close();
          reject(versionRequest.error);
        };
      } catch (error) {
        database.close();
        reject(error);
      }
    };
  });

// Deletes every client store written by an older major/minor web SDK, which
// the current one cannot read (pre-0.16) or resets anyway. Returns the names it
// deleted.
export const deleteOutdatedMidenStores = async () => {
  if (typeof indexedDB === "undefined") {
    return [];
  }
  const names = await midenStoreNames();
  const stores = await Promise.all(
    // Checked independently so one unreadable database cannot hide the others.
    names.map(async (name) => {
      try {
        return { name, outdated: await isOutdatedStore(name) };
      } catch (error) {
        console.error(`ERROR: isOutdatedStore ${name}`, error);
        return { name, outdated: false };
      }
    }),
  );
  const outdatedNames = stores
    .filter(({ outdated }) => outdated)
    .map(({ name }) => name);
  await Promise.all(outdatedNames.map(deleteStore));
  return outdatedNames;
};

// Deletes every client store, whatever version wrote it.
export const deleteMidenStores = async () => {
  if (typeof indexedDB === "undefined") {
    return;
  }
  const names = await midenStoreNames();
  await Promise.all(names.map(deleteStore));
};
