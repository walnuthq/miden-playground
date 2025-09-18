import { type FungibleAsset } from "@/lib/types/asset";

export const accountTypes = {
  "fungible-faucet": "Fungible Faucet",
  "non-fungible-faucet": "Non Fungible Faucet",
  "regular-account-immutable-code": "Regular (immutable)",
  "regular-account-updatable-code": "Regular (updatable)",
} as const;

export type AccountType = keyof typeof accountTypes;

export const accountStorageModes = {
  private: "Private",
  public: "Public",
  network: "Network",
} as const;

export type AccountStorageMode = keyof typeof accountStorageModes;

export type Account = {
  id: string;
  name: string;
  address: string;
  type: AccountType;
  storageMode: AccountStorageMode;
  isFaucet: boolean;
  isPublic: boolean;
  isUpdatable: boolean;
  isRegularAccount: boolean;
  isNew: boolean;
  isWallet?: boolean;
  nonce: bigint;
  fungibleAssets: FungibleAsset[];
  storage: string[];
  consumableNoteIds: string[];
  components: string[];
  tokenSymbol?: string;
  updatedAt: number;
};
