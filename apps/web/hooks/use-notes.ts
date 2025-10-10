import useGlobalContext from "@/components/global-context/hook";
import { type NoteType } from "@/lib/types/note";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import {
  useWallet,
  CustomTransaction,
  TransactionType,
} from "@demox-labs/miden-wallet-adapter";
import { TEST_WALLET_ACCOUNT_ID } from "@/lib/constants";

const useNotes = () => {
  const {
    inputNotes,
    exportNoteDialogOpen,
    importNoteDialogOpen,
    createNoteDialogOpen,
    dispatch,
  } = useGlobalContext();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const { requestTransaction } = useWallet();
  const openExportNoteDialog = () =>
    dispatch({ type: "OPEN_EXPORT_NOTE_DIALOG" });
  const closeExportNoteDialog = () =>
    dispatch({ type: "CLOSE_EXPORT_NOTE_DIALOG" });
  const openImportNoteDialog = () =>
    dispatch({ type: "OPEN_IMPORT_NOTE_DIALOG" });
  const closeImportNoteDialog = () =>
    dispatch({ type: "CLOSE_IMPORT_NOTE_DIALOG" });
  const openCreateNoteDialog = () =>
    dispatch({ type: "OPEN_CREATE_NOTE_DIALOG" });
  const closeCreateNoteDialog = () =>
    dispatch({ type: "CLOSE_CREATE_NOTE_DIALOG" });
  const newNote = async ({
    senderAccountId,
    recipientAccountId,
    scriptId,
    type,
    faucetAccountId,
    amount,
    noteInputs,
  }: {
    senderAccountId: string;
    recipientAccountId: string;
    scriptId: string;
    type: NoteType;
    faucetAccountId: string;
    amount: bigint;
    noteInputs: string[];
  }) => {
    if (!requestTransaction) {
      return;
    }
    const senderAccount = accounts.find(({ id }) => id === senderAccountId);
    if (!senderAccount) {
      throw new Error("Sender account not found");
    }
    const recipientAccount = accounts.find(
      ({ id }) => id === recipientAccountId
    );
    if (!recipientAccount) {
      throw new Error("Recipient account not found");
    }
    const script = scripts.find(({ id }) => id === scriptId);
    if (!script) {
      throw new Error("Script not found");
    }
    const {
      AccountId: WasmAccountId,
      TransactionRequestBuilder: WasmTransactionRequestBuilder,
      OutputNotesArray: WasmOutputNotesArray,
      OutputNote: WasmOutputNote,
      Note: WasmNote,
      NoteAssets: WasmNoteAssets,
      FungibleAsset: WasmFungibleAsset,
      NoteType: WasmNoteType,
      Felt: WasmFelt,
    } = await import("@demox-labs/miden-sdk");
    const note = WasmNote.createP2IDENote(
      WasmAccountId.fromHex(senderAccountId),
      WasmAccountId.fromHex(recipientAccountId),
      new WasmNoteAssets([
        new WasmFungibleAsset(WasmAccountId.fromHex(faucetAccountId), amount),
      ]),
      Number(noteInputs[2]),
      Number(noteInputs[2]),
      type === "public" ? WasmNoteType.Public : WasmNoteType.Private,
      new WasmFelt(0n)
    );
    /* const note = await createNoteFromScript({
      senderAccountId,
      recipientAccountId,
      type,
      script,
      scripts,
    }); */
    console.log("Note ID:", note.id().toString());
    const transactionRequest = new WasmTransactionRequestBuilder()
      .withOwnOutputNotes(new WasmOutputNotesArray([WasmOutputNote.full(note)]))
      .build();
    const customTransaction = new CustomTransaction(
      senderAccount.address,
      recipientAccount.address,
      transactionRequest
    );
    const txId = await requestTransaction({
      type: TransactionType.Custom,
      payload: customTransaction,
    });
    console.log({ txId });
    // const transactionResult = await client.newTransaction(
    //   WasmAccountId.fromHex(senderAccountId),
    //   transactionRequest
    // );
    // const executedTransaction = transactionResult.executedTransaction();
    // console.log(executedTransaction.outputNotes().numNotes());
  };
  return {
    inputNotes,
    exportNoteDialogOpen,
    importNoteDialogOpen,
    createNoteDialogOpen,
    openExportNoteDialog,
    closeExportNoteDialog,
    openImportNoteDialog,
    closeImportNoteDialog,
    openCreateNoteDialog,
    closeCreateNoteDialog,
    newNote,
  };
};

export default useNotes;
