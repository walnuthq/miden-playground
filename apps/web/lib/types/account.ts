import { type FungibleAsset } from "@/lib/types/asset";
import { FUNGIBLE_FAUCET_CODE, BASIC_WALLET_CODE } from "@/lib/constants";
import { stringToFeltArray } from "@/lib/utils";

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
}: {
  storageMode: AccountStorageMode;
}): Account => ({
  ...defaultAccount(),
  type: "fungible-faucet",
  storageMode,
  isFaucet: true,
  isPublic: storageMode === "public",
  isNew: true,
  code: FUNGIBLE_FAUCET_CODE,
  components: ["basic-fungible-faucet"],
});

export const accountIdFromPrefixSuffix = (prefix: bigint, suffix: bigint) => {
  const prefixString = prefix.toString(16).padStart(16, "0");
  const suffixString = suffix.toString(16).padStart(16, "0");
  return `0x${prefixString}${suffixString}`.slice(0, 32);
};

export const decodeFeltToSymbol = (encodedFelt: bigint) => {
  const ALPHABET_LENGTH = 26n;
  let decodedString = "";
  let remainingValue = encodedFelt;
  const tokenLen = remainingValue % ALPHABET_LENGTH;
  remainingValue /= ALPHABET_LENGTH;
  for (let i = 0; i < tokenLen; i++) {
    const digit = Number(remainingValue % ALPHABET_LENGTH);
    const char = digit + "A".charCodeAt(0);
    decodedString += String.fromCharCode(char);
    remainingValue /= ALPHABET_LENGTH;
  }
  return decodedString.split("").reverse().join("");
};

export const decodeFungibleFaucetMetadata = (account?: Account) => {
  if (!account || !account.isFaucet) {
    return {
      totalSupply: 0n,
      maxSupply: 0n,
      decimals: 0n,
      tokenSymbol: "",
    };
  }
  const [, , , totalSupply] = stringToFeltArray(account.storage[0]!);
  const [maxSupply, decimals, tokenSymbol] = stringToFeltArray(
    account.storage[2]!
  );
  return {
    totalSupply: totalSupply!,
    maxSupply: maxSupply!,
    decimals: decimals!,
    tokenSymbol: decodeFeltToSymbol(tokenSymbol!),
  };
};
