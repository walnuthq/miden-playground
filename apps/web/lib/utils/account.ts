import type { NetworkId } from "@/lib/types/network";
import type {
  Account,
  AccountStorageMode,
  StorageItem,
} from "@/lib/types/account";
import {
  BASIC_WALLET_CODE,
  FUNGIBLE_FAUCET_CODE,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY,
  EMPTY_WORD,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils/asset";
import { midenFaucetAccountId, midenFaucetAddress } from "@/lib/constants";

export const defaultStorageItem = (): StorageItem => ({
  name: "",
  type: "value",
  item: "",
  mapEntries: [],
});

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
  updatedAt: Date.now(),
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
  components: ["auth-single-sig", "basic-wallet"],
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
  components: ["auth-single-sig", "basic-fungible-faucet"],
});

export const accountIdFromPrefixSuffix = (prefix: string, suffix: string) => {
  const prefixString = BigInt(prefix).toString(16).padStart(16, "0");
  const suffixString = BigInt(suffix).toString(16).padStart(16, "0");
  return `0x${prefixString}${suffixString}`.slice(0, 32);
};

export const midenFaucetAccount = (networkId: NetworkId) => ({
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
  id: midenFaucetAccountId(networkId),
  name: "Miden Faucet",
  address: midenFaucetAddress(networkId),
  identifier: getIdentifierPart(midenFaucetAddress(networkId)),
  routingParameters: getRoutingParametersPart(midenFaucetAddress(networkId)),
});

export const getItem = (storageItem = defaultStorageItem()) => {
  if (storageItem.type !== "value") {
    return EMPTY_WORD;
  }
  return storageItem.item;
};

export const getMapItem = (storageItem = defaultStorageItem(), key: string) => {
  if (storageItem.type !== "map") {
    return EMPTY_WORD;
  }
  const entry = storageItem.mapEntries.find((entry) => entry.key === key);
  return entry ? entry.value : EMPTY_WORD;
};
