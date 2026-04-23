type SerializedUint8Array = { __type: "Uint8Array"; data: string };

type StoreAccountCode = { root: string; code: SerializedUint8Array };

type StoreLatestAccountStorage = {
  accountId: string;
  slotName: string;
  slotValue: string;
  slotType: number;
};

type StoreHistoricalAccountStorage = {
  accountId: string;
  replacedAtNonce: string;
  slotName: string;
  oldSlotValue: string;
  slotType: number;
};

type StoreLatestStorageMapEntry = {
  accountId: string;
  slotName: string;
  key: string;
  value: string;
};

type StoreHistoricalStorageMapEntry = {
  accountId: string;
  replacedAtNonce: string;
  slotName: string;
  key: string;
  oldValue: string;
};

type StoreLatestAccountAsset = {
  accountId: string;
  vaultKey: string;
  asset: string;
};

type StoreHistoricalAccountAsset = {
  accountId: string;
  replacedAtNonce: string;
  vaultKey: string;
  oldAsset: string | null;
};

type StoreAccountAuth = { pubKeyCommitmentHex: string; secretKeyHex: string };

type StoreAccountKeyMapping = {
  accountIdHex: string;
  pubKeyCommitmentHex: string;
};

type StoreLatestAccountHeaders = {
  id: string;
  codeRoot: string;
  storageRoot: string;
  vaultRoot: string;
  nonce: string;
  committed: boolean;
  accountSeed?: SerializedUint8Array;
  accountCommitment: string;
  locked: boolean;
};

type StoreHistoricalAccountHeaders = {
  id: string;
  replacedAtNonce: string;
  codeRoot: string;
  storageRoot: string;
  vaultRoot: string;
  nonce: string;
  committed: boolean;
  accountSeed?: SerializedUint8Array;
  accountCommitment: string;
  locked: boolean;
};

type StoreAddress = { id: string; address: SerializedUint8Array };

type StoreTransaction = {
  id: string;
  details: SerializedUint8Array;
  blockNum: number;
  scriptRoot: string;
  statusVariant: number;
  status: SerializedUint8Array;
};

type StoreTransactionScript = {
  scriptRoot: string;
  txScript: SerializedUint8Array;
};

type StoreInputNote = {
  noteId: string;
  assets: SerializedUint8Array;
  serialNumber: SerializedUint8Array;
  inputs: SerializedUint8Array;
  scriptRoot: string;
  nullifier: string;
  state: SerializedUint8Array;
  stateDiscriminant: number;
  serializedCreatedAt: string;
  consumedBlockHeight: number;
  consumedTxOrder: number;
  consumerAccountId: string;
};

type StoreOutputNote = {
  noteId: string;
  assets: SerializedUint8Array;
  recipientDigest: string;
  metadata: SerializedUint8Array;
  nullifier: string;
  expectedHeight: number;
  stateDiscriminant: number;
  state: SerializedUint8Array;
};

type StoreNoteScript = {
  scriptRoot: string;
  serializedNoteScript: SerializedUint8Array;
};

type StoreStateSync = { id: number; blockNum: number };

export type StoreBlockHeader = {
  blockNum: number;
  header: SerializedUint8Array;
  partialBlockchainPeaks: SerializedUint8Array;
  hasClientNotes: string;
};

type StorePartialBlockchainNode = { id: number; node: string };

type StoreTag = {
  id: number;
  tag: string;
  sourceNoteId: string;
  sourceAccountId: string;
};

type StoreForeignAccountCode = { accountId: string; codeRoot: string };

type StoreSetting = { key: string; value: SerializedUint8Array };

export type Store = {
  accountCode: StoreAccountCode[];
  latestAccountStorage: StoreLatestAccountStorage[];
  historicalAccountStorage: StoreHistoricalAccountStorage[];
  latestStorageMapEntries: StoreLatestStorageMapEntry[];
  historicalStorageMapEntries: StoreHistoricalStorageMapEntry[];
  latestAccountAssets: StoreLatestAccountAsset[];
  historicalAccountAssets: StoreHistoricalAccountAsset[];
  accountAuth: StoreAccountAuth[];
  accountKeyMapping: StoreAccountKeyMapping[];
  latestAccountHeaders: StoreLatestAccountHeaders[];
  historicalAccountHeaders: StoreHistoricalAccountHeaders[];
  addresses: StoreAddress[];
  transactions: StoreTransaction[];
  transactionScripts: StoreTransactionScript[];
  inputNotes: StoreInputNote[];
  outputNotes: StoreOutputNote[];
  notesScripts: StoreNoteScript[];
  stateSync: StoreStateSync[];
  blockHeaders: StoreBlockHeader[];
  partialBlockchainNodes: StorePartialBlockchainNode[];
  tags: StoreTag[];
  foreignAccountCode: StoreForeignAccountCode[];
  settings: StoreSetting[];
};
