import { type FungibleAsset } from "@/lib/types/asset";
import { FUNGIBLE_FAUCET_CODE, BASIC_WALLET_CODE } from "@/lib/constants";

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
  isWallet: boolean;
  nonce: bigint;
  fungibleAssets: FungibleAsset[];
  code: string;
  storage: string[];
  consumableNoteIds: string[];
  components: string[];
  tokenSymbol?: string;
  updatedAt: number;
};

export const defaultAccount = (): Account => ({
  id: "",
  name: "",
  address: "",
  type: "fungible-faucet",
  storageMode: "private",
  isFaucet: false,
  isPublic: false,
  isUpdatable: false,
  isRegularAccount: false,
  isNew: false,
  isWallet: false,
  nonce: 0n,
  fungibleAssets: [],
  code: "",
  storage: [],
  consumableNoteIds: [],
  components: [],
  updatedAt: 0,
});

export const basicWalletAccount = ({
  storageMode,
}: {
  storageMode: AccountStorageMode;
}): Account => ({
  ...defaultAccount(),
  storageMode,
  isPublic: storageMode === "public",
  type: "regular-account-updatable-code",
  isRegularAccount: true,
  isUpdatable: true,
  isWallet: true,
  code: BASIC_WALLET_CODE,
  components: ["basic-auth", "basic-wallet"],
});

export const basicFungibleFaucetAccount = ({
  storageMode,
  tokenSymbol,
}: {
  storageMode: AccountStorageMode;
  tokenSymbol: string;
}): Account => ({
  ...defaultAccount(),
  type: "fungible-faucet",
  storageMode,
  isFaucet: true,
  isPublic: storageMode === "public",
  isNew: true,
  code: FUNGIBLE_FAUCET_CODE,
  components: ["basic-fungible-faucet"],
  tokenSymbol,
});
