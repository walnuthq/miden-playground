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
    const accountId = AccountId.fromBech32(address);
    const wasmAccount = await getAccountById(client, accountId);
    wasmAccount.id = () => AccountId.fromHex(accountId.toString());
    const syncSummary = await client.syncState();
    const consumableNotes = await getConsumableNotes(client, accountId);
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
  const updateConsumableNotes = async () => {
    const client = await webClient(networkId);
    const syncSummary = await client.syncState();
    // const inputNotes: InputNote[] = [];
    const consumableNoteIds: Record<string, string[]> = {};
    for (const account of accounts) {
      const consumableNotes = await getConsumableNotes(
        client,
        AccountId.fromHex(account.id)
      );
      /* inputNotes.push(
        ...consumableNotes.map((consumableNote) =>
          wasmInputNoteToInputNote(consumableNote.inputNoteRecord(), networkId)
        )
      ); */
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      );
      // console.log(account.id, noteIds);
      consumableNoteIds[account.id] = noteIds;
    }
    const { NoteFilter: WasmNoteFilter } = await import(
      "@demox-labs/miden-sdk"
    );
    const inputNotes = await client.getInputNotes(
      new WasmNoteFilter(NoteFilterTypes.All)
    );
    dispatch({
      type: "UPDATE_CONSUMABLE_NOTES",
      payload: {
        consumableNoteIds,
        inputNotes: inputNotes.map((inputNoteRecord) =>
          wasmInputNoteToInputNote(inputNoteRecord, networkId)
        ),
        blockNum: syncSummary.blockNum(),
      },
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
    updateConsumableNotes,
    openCreateWalletDialog,
    closeCreateWalletDialog,
    openCreateFaucetDialog,
    closeCreateFaucetDialog,
    openImportAccountDialog,
    closeImportAccountDialog,
  };
};

export default useAccounts;
