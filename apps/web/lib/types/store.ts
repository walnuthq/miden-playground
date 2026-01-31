type StoreAccountAsset = {
  root: string;
  vaultKey: string;
  faucetIdPrefix: string;
  asset: string;
};

type StoreAccountAuth = { pubKey: string; secretKey: string };

type StoreAccountCode = { root: string; code: number[] };

type StoreAccountStorage = {
  commitment: string;
  slotIndex: number;
  slotValue: string;
  slotType: number;
};

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

type StoreAddress = { address: number[]; id: string };

type StoreBlockHeader = {
  blockNum: string;
  header: number[];
  partialBlockchainPeaks: number[];
  hasClientNotes: string;
};

type StoreForeignAccountCode = { accountId: string; codeRoot: string };

type StoreInputNote = {
  noteId: string;
  stateDiscriminant: number;
  assets: number[];
  serialNumber: number[];
  inputs: number[];
  scriptRoot: string;
  nullifier: string;
  serializedCreatedAt: string;
  state: number[];
};

type StoreNoteScript = { scriptRoot: string; serializedNoteScript: number[] };

type StoreOutputNote = {
  noteId: string;
  recipientDigest: string;
  assets: number[];
  metadata: number[];
  stateDiscriminant: number;
  nullifier?: string;
  expectedHeight: number;
  state: number[];
};

type StorePartialBlockchainNode = { id: string; node: string };

type StoreSetting = { key: string; value: number[] };

type StoreStateSync = { id: number; blockNum: string };

type StoreStorageMapEntry = { root: string; key: string; value: string };

type StoreTag = {
  id?: number;
  tag: string;
  sourceNoteId?: string;
  sourceAccountId?: string;
};

type StoreTrackedAccount = { id: string };

type StoreTransactionScript = { scriptRoot: string; txScript?: number[] };

type StoreTransaction = {
  id: string;
  details: number[];
  blockNum: number;
  scriptRoot?: string;
  statusVariant: number;
  status: number[];
};

export type Store = {
  accountAssets: StoreAccountAsset[];
  accountAuth: StoreAccountAuth[];
  accountCode: StoreAccountCode[];
  accountStorage: StoreAccountStorage[];
  accounts: StoreAccount[];
  addresses: StoreAddress[];
  blockHeaders: StoreBlockHeader[];
  foreignAccountCode: StoreForeignAccountCode[];
  inputNotes: StoreInputNote[];
  notesScripts: StoreNoteScript[];
  outputNotes: StoreOutputNote[];
  partialBlockchainNodes: StorePartialBlockchainNode[];
  settings: StoreSetting[];
  stateSync: StoreStateSync[];
  storageMapEntries: StoreStorageMapEntry[];
  tags: StoreTag[];
  trackedAccounts: StoreTrackedAccount[];
  transactionScripts: StoreTransactionScript[];
  transactions: StoreTransaction[];
};

export const defaultStore = (): Store => ({
  accountAssets: [],
  accountAuth: [],
  accountCode: [],
  accountStorage: [],
  accounts: [],
  addresses: [],
  blockHeaders: [],
  foreignAccountCode: [],
  inputNotes: [],
  notesScripts: [],
  outputNotes: [],
  partialBlockchainNodes: [],
  settings: [{ key: "note_transport_cursor", value: [0, 0, 0, 0, 0, 0, 0, 0] }],
  stateSync: [{ id: 1, blockNum: "0" }],
  storageMapEntries: [],
  tags: [],
  trackedAccounts: [],
  transactionScripts: [],
  transactions: [],
});

export const deleteStore = () =>
  new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase("MidenClientDB");
    deleteRequest.onsuccess = resolve;
  });

// export const storeSerializer = (store: Store) => JSON.stringify(store);
