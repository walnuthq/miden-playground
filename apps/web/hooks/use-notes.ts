import useGlobalContext from "@/components/global-context/hook";
import { type NoteType } from "@/lib/types/note";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import {
  useWallet,
  CustomTransaction,
  TransactionType,
} from "@demox-labs/miden-wallet-adapter";
import { sleep } from "@/lib/utils";
import { clientCreateNoteFromScript, webClient } from "@/lib/web-client";

const useNotes = () => {
  const {
    networkId,
    serializedMockChain,
    inputNotes,
    exportNoteDialogOpen,
    importNoteDialogOpen,
    createNoteDialogOpen,
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId,
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
      OutputNote: WasmOutputNote,
      Note: WasmNote,
      NoteAssets: WasmNoteAssets,
      FungibleAsset: WasmFungibleAsset,
      NoteType: WasmNoteType,
      Felt: WasmFelt,
      MidenArrays: WasmMidenArrays,
    } = await import("@demox-labs/miden-sdk");
    const client = await webClient(networkId, serializedMockChain);
    const note =
      scriptId === "counter-note"
        ? await clientCreateNoteFromScript({
            client,
            senderAccountId,
            recipientAccountId,
            type,
            script,
            scripts,
          })
        : WasmNote.createP2IDENote(
            WasmAccountId.fromHex(senderAccountId),
            WasmAccountId.fromHex(recipientAccountId),
            new WasmNoteAssets([
              new WasmFungibleAsset(
                WasmAccountId.fromHex(faucetAccountId),
                amount
              ),
            ]),
            Number(noteInputs[2]),
            Number(noteInputs[2]),
            type === "public" ? WasmNoteType.Public : WasmNoteType.Private,
            new WasmFelt(0n)
          );
    const transactionRequest = new WasmTransactionRequestBuilder()
      .withOwnOutputNotes(
        new WasmMidenArrays.OutputNoteArray([WasmOutputNote.full(note)])
      )
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
  };
  const openVerifyNoteScriptDialog = (noteId: string) =>
    dispatch({
      type: "OPEN_VERIFY_NOTE_SCRIPT_DIALOG",
      payload: { noteId },
    });
  const closeVerifyNoteScriptDialog = () =>
    dispatch({
      type: "CLOSE_VERIFY_NOTE_SCRIPT_DIALOG",
    });
  const verifyNoteScript = async ({
    noteId,
    scriptId,
  }: {
    noteId: string;
    scriptId: string;
  }) => {
    const note = inputNotes.find(({ id }) => id === noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    const script = scripts.find(({ id }) => id === scriptId);
    if (!script) {
      throw new Error("Script not found");
    }
    await sleep(400);
    const verified = note.scriptRoot === script.root;
    if (verified) {
      dispatch({ type: "VERIFY_NOTE_SCRIPT", payload: { noteId, scriptId } });
    }
    return verified;
  };
  return {
    inputNotes,
    exportNoteDialogOpen,
    importNoteDialogOpen,
    createNoteDialogOpen,
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId,
    openExportNoteDialog,
    closeExportNoteDialog,
    openImportNoteDialog,
    closeImportNoteDialog,
    openCreateNoteDialog,
    closeCreateNoteDialog,
    newNote,
    openVerifyNoteScriptDialog,
    closeVerifyNoteScriptDialog,
    verifyNoteScript,
  };
};

export default useNotes;
