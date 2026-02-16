import { parseAmount } from "@/lib/utils";
import { type FungibleAsset } from "@/lib/types/asset";
import {
  FUNGIBLE_FAUCET_CODE,
  BASIC_WALLET_CODE,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY,
  MIDEN_FAUCET_ACCOUNT_ID,
  MIDEN_FAUCET_ADDRESS,
  EMPTY_WORD,
} from "@/lib/constants";

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

export const defaultStorageItem = (): StorageItem => ({
  name: "",
  type: "value",
  item: "",
  mapEntries: [],
});

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
  updatedAt: number;
};

export const defaultAccount = (): Account => ({
  id: "",
  name: "",
  address: "",
  identifier: "",
  routingParameters: "",
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
  isNew: true,
  nonce: 0,
  fungibleAssets: [],
  code: "",
  storage: [],
  consumableNoteIds: [],
  components: [],
  updatedAt: 0,
});

export const getIdentifierPart = (address: string) => {
  const [addressPart = ""] = address.split("_");
  return addressPart;
};

export const getRoutingParametersPart = (address: string) => {
  const [, routingParametersPart = ""] = address.split("_");
  return routingParametersPart;
};

export const formatAddress = (
  address: string,
  networkId: string,
  walletFormat = false,
) => {
  const addressPart = getIdentifierPart(address);
  return `${networkId}${addressPart.slice(networkId.length).slice(0, walletFormat ? 2 : 8)}…${addressPart.slice(walletFormat ? -4 : -8)}`;
};

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
  components: ["falcon-512-rpo-auth", "basic-wallet"],
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
  code: FUNGIBLE_FAUCET_CODE,
  components: ["falcon-512-rpo-auth", "basic-fungible-faucet"],
});

export const accountIdFromPrefixSuffix = (prefix: string, suffix: string) => {
  const prefixString = BigInt(prefix).toString(16).padStart(16, "0");
  const suffixString = BigInt(suffix).toString(16).padStart(16, "0");
  return `0x${prefixString}${suffixString}`.slice(0, 32);
};

export const midenFaucetAccount = () => ({
  ...basicFungibleFaucetAccount({
    storageMode: "public",
    symbol: "MIDEN",
    decimals: FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
    maxSupply: parseAmount(
      FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY.toString(),
      FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
    ).toString(),
    totalSupply: "0",
  }),
  id: MIDEN_FAUCET_ACCOUNT_ID,
  name: "Miden Faucet",
  address: MIDEN_FAUCET_ADDRESS,
  identifier: getIdentifierPart(MIDEN_FAUCET_ADDRESS),
  routingParameters: getRoutingParametersPart(MIDEN_FAUCET_ADDRESS),
});

export const getItem = (storage: StorageItem[], index: number) => {
  const storageItem = storage[index];
  if (!storageItem || storageItem.type !== "value") {
    return EMPTY_WORD;
  }
  return storageItem.item;
};

export const getMapItem = (storageItem: StorageItem, key: string) => {
  if (storageItem.type !== "map") {
    return EMPTY_WORD;
  }
  const entry = storageItem.mapEntries.find((entry) => entry.key === key);
  return entry ? entry.value : EMPTY_WORD;
};
