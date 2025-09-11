import { partition } from "lodash";
import {
  clientGetAccountByAddress,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
  webClient,
  clientNewWallet,
  clientNewFaucet,
  clientImportNewWallet,
  clientDeployAccount,
} from "@/lib/web-client";
import useGlobalContext from "@/components/global-context/hook";
import {
  type Component,
  type AccountStorageMode,
  type AccountType,
} from "@/lib/types";
import useScripts from "@/hooks/use-scripts";
import {
  MIDEN_FAUCET_ADDRESS,
  COUNTER_CONTRACT_ADDRESS,
} from "@/lib/constants";

const useAccounts = () => {
  const {
    networkId,
    serializedMockChain,
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    deployAccountDialogOpen,
    accounts,
    dispatch,
  } = useGlobalContext();
  const { scripts } = useScripts();
  const [faucets, wallets] = partition(accounts, (account) => account.isFaucet);
  const newWallet = async ({
    name,
    storageMode,
  }: {
    name: string;
    storageMode: AccountStorageMode;
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const wallet = await clientNewWallet(client, {
      storageMode,
      mutable: true,
    });
    const syncSummary = await client.syncState();
    const account = await wasmAccountToAccount(
      wallet,
      name,
      networkId,
      syncSummary.blockNum()
    );
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const newFaucet = async ({
    name,
    storageMode,
    tokenSymbol,
    decimals,
    maxSupply,
  }: {
    name: string;
    storageMode: AccountStorageMode;
    tokenSymbol: string;
    decimals: number;
    maxSupply: bigint;
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const faucet = await clientNewFaucet(client, {
      storageMode,
      nonFungible: false,
      tokenSymbol,
      decimals,
      maxSupply,
    });
    const syncSummary = await client.syncState();
    const account = await wasmAccountToAccount(
      faucet,
      name,
      networkId,
      syncSummary.blockNum(),
      [],
      tokenSymbol
    );
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const importAccountByAddress = async ({
    name,
    address,
  }: {
    name: string;
    address: string;
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const wasmAccount = await clientGetAccountByAddress(client, address);
    const syncSummary = await client.syncState();
    const consumableNotes = await clientGetConsumableNotes(
      client,
      wasmAccount.id().toString()
    );
    const account = await wasmAccountToAccount(
      wasmAccount,
      name,
      networkId,
      syncSummary.blockNum(),
      consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      )
    );
    if (address === MIDEN_FAUCET_ADDRESS) {
      // MDN Faucet
      account.components = [];
    } else if (address === COUNTER_CONTRACT_ADDRESS) {
      // Counter Contract
      account.components = ["no-auth", "counter-contract"];
    } else {
      // Basic Wallet
      account.components = ["basic-auth", "basic-wallet"];
    }
    const inputNotes = await Promise.all(
      consumableNotes.map((consumableNote) =>
        wasmInputNoteToInputNote(consumableNote.inputNoteRecord())
      )
    );
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: { account, inputNotes, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const importConnectedWallet = async (address: string) => {
    const client = await webClient(networkId, serializedMockChain);
    try {
      await clientGetAccountByAddress(client, address);
      return importAccountByAddress({
        name: "Miden Account 1",
        address,
      });
    } catch (error) {
      await clientImportNewWallet(client, address);
      return importAccountByAddress({
        name: "Miden Account 1",
        address,
      });
    }
  };
  const deployAccount = async ({
    name,
    accountType,
    storageMode,
    components,
  }: {
    name: string;
    accountType: AccountType;
    storageMode: AccountStorageMode;
    components: Component[];
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const wasmAccount = await clientDeployAccount(client, {
      accountType,
      storageMode,
      components,
      scripts,
    });
    const syncSummary = await client.syncState();
    const account = await wasmAccountToAccount(
      wasmAccount,
      name,
      networkId,
      syncSummary.blockNum()
    );
    account.components = components.map(({ id }) => id);
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const openCreateWalletDialog = () =>
    dispatch({
      type: "OPEN_CREATE_WALLET_DIALOG",
    });
  const closeCreateWalletDialog = () =>
    dispatch({
      type: "CLOSE_CREATE_WALLET_DIALOG",
    });
  const openCreateFaucetDialog = () =>
    dispatch({
      type: "OPEN_CREATE_FAUCET_DIALOG",
    });
  const closeCreateFaucetDialog = () =>
    dispatch({
      type: "CLOSE_CREATE_FAUCET_DIALOG",
    });
  const openImportAccountDialog = () =>
    dispatch({
      type: "OPEN_IMPORT_ACCOUNT_DIALOG",
    });
  const closeImportAccountDialog = () =>
    dispatch({
      type: "CLOSE_IMPORT_ACCOUNT_DIALOG",
    });
  const openDeployAccountDialog = () =>
    dispatch({
      type: "OPEN_DEPLOY_ACCOUNT_DIALOG",
    });
  const closeDeployAccountDialog = () =>
    dispatch({
      type: "CLOSE_DEPLOY_ACCOUNT_DIALOG",
    });
  return {
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    deployAccountDialogOpen,
    accounts,
    wallets,
    faucets,
    newWallet,
    newFaucet,
    importAccountByAddress,
    importConnectedWallet,
    deployAccount,
    openCreateWalletDialog,
    closeCreateWalletDialog,
    openCreateFaucetDialog,
    closeCreateFaucetDialog,
    openImportAccountDialog,
    closeImportAccountDialog,
    openDeployAccountDialog,
    closeDeployAccountDialog,
  };
};

export default useAccounts;
