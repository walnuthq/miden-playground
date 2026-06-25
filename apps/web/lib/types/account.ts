import type { FungibleAsset } from "@/lib/types/asset";
import type {
  DetectedMultisigConfig,
  Proposal,
} from "@openzeppelin/miden-multisig-client";

export const accountStorageModes = {
  public: "Public",
  private: "Private",
} as const;

export type AccountStorageMode = keyof typeof accountStorageModes;

export enum AuthScheme {
  AuthEcdsaK256Keccak = 1,
  AuthRpoFalcon512 = 2,
}

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
  isFaucet: boolean;
  symbol: string;
  decimals: number;
  maxSupply: string;
  totalSupply: string;
  isPublic: boolean;
  isPrivate: boolean;
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
