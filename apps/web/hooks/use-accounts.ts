import { partition } from "lodash";
import {
  AccountId,
  AccountStorageMode,
  Account as WasmAccount,
} from "@workspace/mock-web-client";
import { mockWebClient } from "@/lib/mock-web-client";
import useGlobalContext from "@/components/global-context/hook";
import { wasmAccountToAccount } from "@/lib/types";

const useAccounts = () => {
  const {
    networkId,
    createWalletDialogOpen,
    createFaucetDialogOpen,
    accounts,
    dispatch,
  } = useGlobalContext();
  const [faucets, wallets] = partition(accounts, (account) => account.isFaucet);
  const newWallet = async ({
    name,
    storageMode,
  }: {
    name: string;
    storageMode: AccountStorageMode;
  }) => {
    const client = await mockWebClient();
    const wallet = await client.newWallet(storageMode, true);
    const syncSummary = await client.syncState();
    // const blockHeader = await client.getLatestEpochBlock();
    // console.log("commitment:", blockHeader.commitment().toHex());
    // console.log("chainCommitment:", blockHeader.chainCommitment().toHex());
    const account = wasmAccountToAccount(
      wallet,
      name,
      networkId,
      syncSummary.blockNum()
    );
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, syncSummary },
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
    const client = await mockWebClient();
    const faucet = await client.newFaucet(
      storageMode,
      false,
      tokenSymbol,
      decimals,
      maxSupply
    );
    const syncSummary = await client.syncState();
    // const blockHeader = await client.getLatestEpochBlock();
    // console.log("commitment:", blockHeader.commitment().toHex());
    // console.log("chainCommitment:", blockHeader.chainCommitment().toHex());
    const account = wasmAccountToAccount(
      faucet,
      name,
      networkId,
      syncSummary.blockNum(),
      [],
      tokenSymbol
    );
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, syncSummary },
    });
    return account;
  };
  const importAccount = async (wasmAccount: WasmAccount) => {
    const client = await mockWebClient();
    // const serialized = wasmAccount.serialize();
    // console.log(serialized);
    // await client.importAccount(wasmAccount.serialize());
    const accountId = wasmAccount.id();
    wasmAccount.id = () => {
      return AccountId.fromHex(accountId.toString());
    };
    const syncSummary = await client.syncState();
    const account = wasmAccountToAccount(
      wasmAccount,
      "Imported Wallet",
      "mtst", //networkId,
      syncSummary.blockNum()
    );
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, syncSummary },
    });
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
  return {
    createWalletDialogOpen,
    createFaucetDialogOpen,
    accounts,
    wallets,
    faucets,
    newWallet,
    newFaucet,
    importAccount,
    openCreateFaucetDialog,
    closeCreateFaucetDialog,
    openCreateWalletDialog,
    closeCreateWalletDialog,
  };
};

export default useAccounts;
