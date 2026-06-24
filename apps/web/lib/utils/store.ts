import type { Store, StoreBlockHeader } from "@/lib/types/store";
import type { NetworkId } from "@/lib/types/network";

const testnetBlock0Header: StoreBlockHeader = {
  blockNum: 0,
  header: {
    __type: "Uint8Array",
    data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALNuyBJ0X3UhHyP6SIKVwrUIawxuMxwPM/JPBMMMJ9twNvYAK3/lR4xtKRA9JhAJ6cBEcBIXAInM46Fd+YsnJrwtKkVzO2ErNwxng3yekiYjFtfviE0CpiRBj+4mIgPamqnb1H8kW9+42yEEKLi4s+X26JrjL/M13gLnswACwlI6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACM1C8/LAI8JjLOuYLz088pUvWhZVkVyVJaBLUQxT+9IAMOleJpFjRauxf4qpDb8OekgJTWkZ8uVYRh5+tAcWJQkSRY5URhKOaxULdbjr2c4QAAAAAXajpq",
  },
  partialBlockchainPeaks: { __type: "Uint8Array", data: "AQ==" },
  hasClientNotes: "false",
};

const devnetBlock0Header: StoreBlockHeader = {
  blockNum: 0,
  header: {
    __type: "Uint8Array",
    data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgyexmGxH9AESifu4SVxM8Zqax50Fgr0zXwEQEOZJ+2GFLXB8Oi2nnbf2wH742k8oMbzv6Vhfr9/MH48qhSjWwGxR/+JLqNoLHzmmnqDL9jD7dzp04VjXPBnXUqwfsVH98oppn/eFKvGavJ7C8FX1l1KBhANJFhYPgrG6YgtOpTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCAUdjrzRncdLAh6j73CERrXnBxWYJagCjoBOMSeFXRgIQfaDEFEozTyjMdQmHtvc2kjWPm7yOqTcsgnl3vZocqxb2yF1WUskgCHkUW/3akwAAAAA+Ytdp",
  },
  partialBlockchainPeaks: { __type: "Uint8Array", data: "AQ==" },
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
  stateSync: [{ id: 1, blockNum: 0 }],
  blockHeaders: [blockHeaders[networkId]],
  partialBlockchainNodes: [],
  tags: [],
  foreignAccountCode: [],
  settings: [
    {
      key: "clientVersion",
      value: { __type: "Uint8Array", data: "MC4xNS4y" },
    },
    {
      key: "note_transport_cursor",
      value: { __type: "Uint8Array", data: "AAAAAAAAAAA=" },
    },
    {
      key: "rpc_limits",
      value: { __type: "Uint8Array", data: "ZAAAAOgDAADoAwAA6AMAAA==" },
    },
  ],
});

export const storeName = (networkId: NetworkId) =>
  networkId === "mmck" ? "mock_client_db" : `MidenClientDB_${networkId}`;
