import { partition } from "lodash";
import {
  AccountId,
  AccountStorageMode,
  NoteFilterTypes,
} from "@workspace/mock-web-client";
import {
  getAccountById,
  getConsumableNotes,
  webClient,
} from "@/lib/web-client";
import useGlobalContext from "@/components/global-context/hook";
import { wasmAccountToAccount, wasmInputNoteToInputNote } from "@/lib/types";

const useAccounts = () => {
  const {
    networkId,
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
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
    const client = await webClient(networkId);
    const wallet = await client.newWallet(storageMode, true);
    const syncSummary = await client.syncState();
    const account = wasmAccountToAccount(
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
    const client = await webClient(networkId);
    const faucet = await client.newFaucet(
      storageMode,
      false,
      tokenSymbol,
      decimals,
      maxSupply
    );
    const syncSummary = await client.syncState();
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
    const client = await webClient(networkId);
    const wasmAccount = await getAccountById(client, address);
    wasmAccount.id = () => AccountId.fromBech32(address);
    const syncSummary = await client.syncState();
    const consumableNotes = await getConsumableNotes(client, address);
    const account = wasmAccountToAccount(
      wasmAccount,
      name,
      networkId,
      syncSummary.blockNum(),
      consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      )
    );
    const inputNotes = consumableNotes.map((consumableNote) =>
      wasmInputNoteToInputNote(consumableNote.inputNoteRecord(), networkId)
    );
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: { account, inputNotes, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const importConnectedWallet = async (accountId: string) => {
    const client = await webClient(networkId);
    try {
      await getAccountById(client, accountId);
      return importAccountByAddress({
        name: "Miden Account 1",
        address: accountId,
      });
    } catch (error) {
      const wallet = await client.newWallet(AccountStorageMode.public(), true);
      const serializedWallet = wallet.serialize();
      const fromHexString = (hexString: string) => {
        const chunks = hexString.match(/.{1,2}/g)!;
        return Uint8Array.from(chunks.map((byte) => Number.parseInt(byte, 16)));
      };
      const serializedImportedWallet = Uint8Array.from([
        ...fromHexString(AccountId.fromBech32(accountId).toString().slice(2)),
        ...serializedWallet.slice(15),
      ]);
      const { Account: WasmAccount, Word } = await import(
        "@demox-labs/miden-sdk"
      );
      await client.newAccount(
        // @ts-ignore
        WasmAccount.deserialize(serializedImportedWallet),
        Word.newFromU64s(BigUint64Array.from([0n, 0n, 0n, 0n])),
        true
      );
      return importAccountByAddress({
        name: "Miden Account 1",
        address: accountId,
      });
    }
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
  return {
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    accounts,
    wallets,
    faucets,
    newWallet,
    newFaucet,
    importAccountByAddress,
    importConnectedWallet,
    openCreateWalletDialog,
    closeCreateWalletDialog,
    openCreateFaucetDialog,
    closeCreateFaucetDialog,
    openImportAccountDialog,
    closeImportAccountDialog,
  };
};

export default useAccounts;
