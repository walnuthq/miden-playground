import type { FungibleAsset } from "@/lib/types/asset";
import type {
  DetectedMultisigConfig,
  Proposal,
} from "@openzeppelin/miden-multisig-client";

export const accountTypes = {
  "fungible-faucet": "Fungible Faucet",
  "non-fungible-faucet": "Non Fungible Faucet",
  "regular-account-immutable-code": "Regular (immutable)",
  "regular-account-updatable-code": "Regular (updatable)",
} as const;

export type AccountType = keyof typeof accountTypes;

export const accountStorageModes = {
  public: "Public",
  network: "Network",
  private: "Private",
} as const;

export type AccountStorageMode = keyof typeof accountStorageModes;

export type StorageItem = {
  name: string;
  type: "value" | "map";
  item: string;
  mapEntries: { key: string; value: string }[];
};

export type AccountMultisig = {
  config: Omit<DetectedMultisigConfig, "vaultBalances"> & {
    vaultBalances: FungibleAsset[];
  };
  proposals: Proposal[];
};

export type Account = {
  id: string;
  name: string;
  address: string;
  identifier: string;
  routingParameters: string;
  type: AccountType;
  storageMode: AccountStorageMode;
  isFaucet: boolean;
  symbol: string;
  decimals: number;
  maxSupply: string;
  totalSupply: string;
  isPublic: boolean;
  isUpdatable: boolean;
  isRegularAccount: boolean;
  isNew: boolean;
  nonce: number;
  fungibleAssets: FungibleAsset[];
  code: string;
  storage: StorageItem[];
  consumableNoteIds: string[];
  components: string[];
  multisig?: AccountMultisig;
  updatedAt: number;
};
