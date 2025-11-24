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
  public: "Public",
  network: "Network",
  private: "Private",
} as const;

export type AccountStorageMode = keyof typeof accountStorageModes;

export type Account = {
  id: string;
  name: string;
  address: string;
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
  nonce: bigint;
  fungibleAssets: FungibleAsset[];
  code: string;
  storage: string[];
  consumableNoteIds: string[];
  components: string[];
  updatedAt: number;
};

export const defaultAccount = (): Account => ({
  id: "",
  name: "",
  address: "",
  type: "fungible-faucet",
  storageMode: "private",
  isFaucet: false,
  symbol: "",
  decimals: 0,
  maxSupply: "",
  totalSupply: "",
  isPublic: false,
  isUpdatable: false,
  isRegularAccount: false,
  isNew: false,
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
  code: BASIC_WALLET_CODE,
  components: ["basic-auth", "basic-wallet"],
});

export const basicFungibleFaucetAccount = ({
  storageMode,
  symbol,
  decimals,
  maxSupply,
  totalSupply,
}: {
  storageMode: AccountStorageMode;
  symbol: string;
  decimals: number;
  maxSupply: string;
  totalSupply: string;
}): Account => ({
  ...defaultAccount(),
  type: "fungible-faucet",
  storageMode,
  isFaucet: true,
  symbol,
  decimals,
  maxSupply,
  totalSupply,
  isPublic: storageMode === "public",
  isNew: true,
  code: FUNGIBLE_FAUCET_CODE,
  components: ["basic-fungible-faucet"],
});

export const accountIdFromPrefixSuffix = (prefix: string, suffix: string) => {
  const prefixString = BigInt(prefix).toString(16).padStart(16, "0");
  const suffixString = BigInt(suffix).toString(16).padStart(16, "0");
  return `0x${prefixString}${suffixString}`.slice(0, 32);
};

export const newWallet = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 15, 166, 136, 15, 130,
  230, 228, 162, 17, 47, 31, 41, 52, 252, 98, 162, 226, 119, 195, 26, 113, 131,
  172, 20, 129, 81, 116, 184, 27, 83, 143, 134, 77, 65, 83, 84, 0, 0, 0, 0, 15,
  1, 7, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 13, 11, 41, 41, 41, 41, 48, 0, 0, 0,
  0, 0, 0, 0, 48, 178, 98, 32, 6, 170, 240, 39, 101, 1, 149, 172, 33, 225, 161,
  187, 112, 137, 125, 93, 161, 61, 139, 16, 2, 244, 185, 16, 245, 1, 15, 122,
  121, 0, 0, 0, 0, 0, 0, 0, 128, 173, 221, 56, 163, 223, 140, 190, 122, 168,
  234, 225, 178, 180, 214, 63, 24, 79, 180, 144, 160, 27, 78, 36, 203, 37, 193,
  116, 175, 186, 192, 8, 17, 1, 0, 0, 0, 0, 0, 0, 0, 4, 143, 164, 85, 239, 74,
  96, 86, 245, 66, 1, 1, 237, 167, 56, 65, 103, 222, 140, 75, 185, 83, 165, 150,
  71, 39, 123, 9, 4, 237, 37, 12, 0, 0, 0, 0, 0, 0, 0, 128, 111, 182, 161, 240,
  104, 9, 31, 34, 161, 4, 176, 193, 144, 74, 110, 217, 207, 241, 203, 255, 133,
  94, 32, 28, 206, 129, 228, 214, 122, 34, 145, 18, 3, 0, 0, 128, 0, 0, 0, 0,
  151, 39, 28, 67, 127, 151, 21, 179, 127, 224, 34, 222, 2, 131, 160, 147, 163,
  248, 159, 93, 188, 145, 137, 112, 201, 60, 90, 179, 152, 184, 99, 211, 0, 0,
  0, 0, 0, 0, 0, 128, 111, 75, 219, 220, 75, 19, 215, 237, 147, 61, 89, 13, 136,
  172, 157, 251, 152, 2, 12, 158, 145, 118, 151, 132, 91, 94, 22, 147, 149, 183,
  106, 1, 0, 0, 0, 0, 0, 0, 0, 128, 14, 64, 107, 6, 126, 210, 188, 215, 222,
  116, 92, 166, 81, 127, 81, 159, 209, 169, 190, 36, 95, 145, 51, 71, 172, 103,
  60, 161, 219, 48, 193, 214, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 2, 151, 39, 28, 67,
  127, 151, 21, 179, 127, 224, 34, 222, 2, 131, 160, 147, 163, 248, 159, 93,
  188, 145, 137, 112, 201, 60, 90, 179, 152, 184, 99, 211, 0, 1, 14, 64, 107, 6,
  126, 210, 188, 215, 222, 116, 92, 166, 81, 127, 81, 159, 209, 169, 190, 36,
  95, 145, 51, 71, 172, 103, 60, 161, 219, 48, 193, 214, 0, 0, 111, 75, 219,
  220, 75, 19, 215, 237, 147, 61, 89, 13, 136, 172, 157, 251, 152, 2, 12, 158,
  145, 118, 151, 132, 91, 94, 22, 147, 149, 183, 106, 1, 0, 0, 1, 0, 0, 0, 0, 0,
  0, 0, 0,
];
