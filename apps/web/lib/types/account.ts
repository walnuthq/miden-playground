import type {
  DetectedMultisigConfig,
  Proposal,
} from "@openzeppelin/miden-multisig-client";
import type { FungibleAsset } from "@/lib/types/asset";

export const accountStorageModes = {
  public: "Public",
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
  // The ids of the scripts the account's code holds as components: built-ins
  // (`basic-wallet`, `auth-no-auth`…) and the workspace's or verified
  // packages. Named for the account's components; states persisted when
  // components were an entity of their own held those entities' ids, which
  // `stateDeserializer` maps to their scripts' (lib/utils/state.ts).
  components: string[];
  multisig?: AccountMultisig;
  updatedAt: number;
};
