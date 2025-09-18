type StoreBlob = { __type: "Blob"; data: string };

type StoreAccountCode = { root: string; code: number[] };

type StoreAccountStorage = { root: string; slots: StoreBlob };

type StoreAccountVault = { root: string; assets: StoreBlob };

type StoreAccountAuth = { pubKey: string; secretKey: string };

type StoreAccount = {
  id: string;
  codeRoot: string;
  storageRoot: string;
  vaultRoot: string;
  nonce: string;
  committed: boolean;
  accountSeed?: number[];
  accountCommitment: string;
  locked: boolean;
};

type StoreStateSync = { id: number; blockNum: string };

type StoreBlockHeader = {
  blockNum: string;
  header: StoreBlob;
  partialBlockchainPeaks: StoreBlob;
  hasClientNotes: string;
};

type StoreTransaction = {
  id: string;
  details: StoreBlob;
  scriptRoot: string;
  blockNum: number;
  statusVariant: number;
  status: StoreBlob;
};

type StoreTransactionScript = { scriptRoot: string; txScript: StoreBlob };

type StoreInputNote = {
  noteId: string;
  assets: StoreBlob;
  serialNumber: StoreBlob;
  inputs: StoreBlob;
  scriptRoot: string;
  nullifier: string;
  state: StoreBlob;
  stateDiscriminant: number;
  serializedCreatedAt: string;
};

type StoreOutputNote = {
  noteId: string;
  assets: StoreBlob;
  recipientDigest: string;
  metadata: StoreBlob;
  nullifier: string;
  expectedHeight: number;
  stateDiscriminant: number;
  state: StoreBlob;
};

type StoreNoteScript = { scriptRoot: string; serializedNoteScript: StoreBlob };

type StorePartialBlockchainNode = { id: string; node: string };

type StoreTag = {
  id: number;
  tag: string;
  sourceNoteId: string;
  sourceAccountId: string;
};

export type Store = {
  accountCode: StoreAccountCode[];
  accountStorage: StoreAccountStorage[];
  accountVaults: StoreAccountVault[];
  accountAuth: StoreAccountAuth[];
  accounts: StoreAccount[];
  transactions: StoreTransaction[];
  transactionScripts: StoreTransactionScript[];
  inputNotes: StoreInputNote[];
  outputNotes: StoreOutputNote[];
  notesScripts: StoreNoteScript[];
  stateSync: StoreStateSync[];
  blockHeaders: StoreBlockHeader[];
  partialBlockchainNodes: StorePartialBlockchainNode[];
  tags: StoreTag[];
  // TODO
  foreignAccountCode: string[];
};

export const defaultStore = (): Store => ({
  accountCode: [],
  accountStorage: [],
  accountVaults: [],
  accountAuth: [],
  accounts: [],
  transactions: [],
  transactionScripts: [],
  inputNotes: [],
  outputNotes: [],
  notesScripts: [],
  stateSync: [{ id: 1, blockNum: "0" }],
  blockHeaders: [],
  partialBlockchainNodes: [],
  tags: [],
  foreignAccountCode: [],
});

export const deleteStore = () =>
  new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase("MidenClientDB");
    deleteRequest.onsuccess = resolve;
  });

// export const storeSerializer = (store: Store) => JSON.stringify(store);
