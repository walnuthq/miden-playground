import type { Store, StoreBlockHeader } from "@/lib/types/store";
import type { NetworkId } from "@/lib/types/network";

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
