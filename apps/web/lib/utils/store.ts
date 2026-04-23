import type { Store, StoreBlockHeader } from "@/lib/types/store";
import type { NetworkId } from "@/lib/types/network";

const testnetBlock0Header: StoreBlockHeader = {
  blockNum: 0,
  header: {
    __type: "Uint8Array",
    data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgyexmGxH9AESifu4SVxM8Zqax50Fgr0zXwEQEOZJ+2dQCYU9XV+V5i6BY8OFmZ7jkPI+rKDC/QaBya4PkjE9sGxR/+JLqNoLHzmmnqDL9jD7dzp04VjXPBnXUqwfsVH98oppn/eFKvGavJ7C8FX1l1KBhANJFhYPgrG6YgtOpTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCAUdjrzRncdLAh6j73CERrXnBxWYJagCjoBOMSeFXRgMOleJpFjRauxf4qpDb8OekgJTWkZ8uVYRh5+tAcWJQkQp9F17WPsUgD7LO2G9qpQAAAADu1uVp",
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
    { key: "clientVersion", value: { __type: "Uint8Array", data: "MC4xNC40" } },
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
