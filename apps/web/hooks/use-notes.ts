import {
  AccountId as WasmAccountId,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
  Note as WasmNote,
  NoteAssets as WasmNoteAssets,
  FungibleAsset as WasmFungibleAsset,
  NoteType as WasmNoteType,
  NoteAttachment as WasmNoteAttachment,
  NoteArray as WasmNoteArray,
} from "@miden-sdk/miden-sdk";
import { useMiden } from "@miden-sdk/react";
import useGlobalContext from "@/components/global-context/hook";
import type { NoteType, InputNote } from "@/lib/types/note";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import {
  useWallet,
  CustomTransaction,
  TransactionType,
} from "@miden-sdk/miden-wallet-adapter";
import { toBase64 } from "@/lib/utils";
import {
  clientCreateNoteFromScript,
  clientImportNoteFile,
} from "@/lib/web-client";
import { verifyNoteFromPackageId } from "@/lib/api";
import useNetwork from "@/hooks/use-network";

const useNotes = () => {
  const { networkId } = useNetwork();
  const {
    tutorialId, // TODO
    inputNotes,
    exportNoteDialogOpen,
    importNoteDialogOpen,
    createNoteDialogOpen,
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId,
    dispatch,
  } = useGlobalContext();
  const { client } = useMiden();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const { requestTransaction } = useWallet();
  const addNote = (inputNote: InputNote) =>
    dispatch({ type: "ADD_NOTE", payload: { inputNote } });
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
    noteStorage,
  }: {
    senderAccountId: string;
    recipientAccountId: string;
    scriptId: string;
    type: NoteType;
    faucetAccountId: string;
    amount: bigint;
    noteStorage: string[];
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    if (!requestTransaction) {
      return;
    }
    const senderAccount = accounts.find(({ id }) => id === senderAccountId);
    if (!senderAccount) {
      throw new Error("Sender account not found");
    }
    const recipientAccount = accounts.find(
      ({ id }) => id === recipientAccountId,
    );
    if (!recipientAccount) {
      throw new Error("Recipient account not found");
    }
    const script = scripts.find(({ id }) => id === scriptId);
    if (!script) {
      throw new Error("Script not found");
    }
    const note =
      tutorialId === "timelock-p2id-note"
        ? WasmNote.createP2IDENote(
            WasmAccountId.fromHex(senderAccountId),
            WasmAccountId.fromHex(recipientAccountId),
            new WasmNoteAssets([
              new WasmFungibleAsset(
                WasmAccountId.fromHex(faucetAccountId),
                amount,
              ),
            ]),
            Number(noteStorage[2]),
            Number(noteStorage[2]),
            type === "public" ? WasmNoteType.Public : WasmNoteType.Private,
            new WasmNoteAttachment(),
          )
        : clientCreateNoteFromScript({
            client,
            senderAccountId,
            recipientAccountId,
            networkRecipient: recipientAccount.storageMode === "network",
            script,
            type,
            faucetAccountId,
            amount,
            noteStorage,
            scripts,
          });
    if (!tutorialId) {
      verifyNoteFromPackageId({
        networkId,
        noteId: note.id().toString(),
        note: toBase64(note.serialize()),
        packageId: script.id,
      });
    }
    const transactionRequest = new WasmTransactionRequestBuilder()
      .withOwnOutputNotes(new WasmNoteArray([note]))
      .build();
    const customTransaction = new CustomTransaction(
      senderAccount.address,
      recipientAccount.address,
      transactionRequest,
    );
    const txId = await requestTransaction({
      type: TransactionType.Custom,
      payload: customTransaction,
    });
    console.log({ txId });
  };
  const importNoteFromFile = async (noteFileBytes: Uint8Array) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const inputNote = await clientImportNoteFile({
      client,
      noteFileBytes,
      scripts,
    });
    addNote(inputNote);
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
  return {
    inputNotes,
    exportNoteDialogOpen,
    importNoteDialogOpen,
    createNoteDialogOpen,
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId,
    addNote,
    openExportNoteDialog,
    closeExportNoteDialog,
    openImportNoteDialog,
    closeImportNoteDialog,
    openCreateNoteDialog,
    closeCreateNoteDialog,
    newNote,
    importNoteFromFile,
    openVerifyNoteScriptDialog,
    closeVerifyNoteScriptDialog,
  };
};

export default useNotes;
