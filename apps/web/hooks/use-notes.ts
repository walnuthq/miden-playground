import {
  AccountId as WasmAccountId,
  FungibleAsset as WasmFungibleAsset,
  Note as WasmNote,
  NoteArray as WasmNoteArray,
  NoteAssets as WasmNoteAssets,
  NoteAttachment as WasmNoteAttachment,
  NoteType as WasmNoteType,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
} from "@miden-sdk/miden-sdk";
import {
  CustomTransaction,
  TransactionType,
  useWallet,
} from "@miden-sdk/miden-wallet-adapter";
import { useMiden } from "@miden-sdk/react";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useParaTransaction from "@/hooks/use-para-transaction";
import useScripts from "@/hooks/use-scripts";
import { verifyNoteFromPackageId } from "@/lib/api";
import type { NetworkId } from "@/lib/types/network";
import type { InputNote, NoteType } from "@/lib/types/note";
import {
  clientCreateNoteFromScript,
  clientGetNotesById,
  clientImportNoteFile,
  randomWord,
} from "@/lib/web-client";

// The verification service imports a note from the node to verify its script,
// so it can only be asked once the note is committed: check for it every few
// seconds, for as long as a transaction can take to be committed.
const NOTE_COMMIT_POLL_INTERVAL = 3_000;
const NOTE_COMMIT_POLL_ATTEMPTS = 60;

const verifyNoteOnceCommitted = async ({
  networkId,
  noteId,
  packageId,
}: {
  networkId: NetworkId;
  noteId: string;
  packageId: string;
}) => {
  for (let attempt = 0; attempt < NOTE_COMMIT_POLL_ATTEMPTS; attempt += 1) {
    const notes = await clientGetNotesById({
      networkId,
      noteIds: [noteId],
    }).catch(() => []);
    if (notes.length > 0) {
      return verifyNoteFromPackageId({ networkId, noteId, packageId });
    }
    await new Promise((resolve) =>
      setTimeout(resolve, NOTE_COMMIT_POLL_INTERVAL),
    );
  }
  throw new Error(`Note ${noteId} wasn't committed: its script isn't verified`);
};

const useNotes = () => {
  const { networkId } = useNetwork();
  const {
    tutorialId,
    inputNotes,
    exportNoteDialogOpen,
    importNoteDialogOpen,
    createNoteDialogOpen,
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId,
    dispatch,
  } = useGlobalContext();
  const { client } = useMiden();
  const { accounts, isParaWallet } = useAccounts();
  const { scripts } = useScripts();
  const { requestTransaction } = useWallet();
  const { submitWithPara } = useParaTransaction();
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
    isNetworkNote,
    faucetAccountId,
    amount,
    noteStorage,
  }: {
    senderAccountId: string;
    recipientAccountId: string;
    scriptId: string;
    type: NoteType;
    isNetworkNote: boolean;
    faucetAccountId: string;
    amount: bigint;
    noteStorage: string[];
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
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
        : await clientCreateNoteFromScript({
            client,
            senderAccountId,
            recipientAccountId,
            isNetworkNote,
            script,
            type,
            faucetAccountId,
            amount,
            noteStorage,
            scripts,
          });
    // console.log(note.script().root());
    // Verified once submitted: the verification service imports the note
    // from the node. Read its ID now: the note array below takes the note.
    const noteId = note.id().toString();
    const verifyNote = () => {
      if (!tutorialId) {
        verifyNoteOnceCommitted({
          networkId,
          noteId,
          packageId: script.id,
        }).catch((error) => console.error("ERROR: verifyNote", error));
      }
    };
    let transactionRequestBuilder =
      new WasmTransactionRequestBuilder().withOwnOutputNotes(
        new WasmNoteArray([note]),
      );
    if (senderAccount.components.includes("auth-guarded-multisig")) {
      transactionRequestBuilder =
        transactionRequestBuilder.withFeeConversionSalt(randomWord());
    }
    const transactionRequest = transactionRequestBuilder.build();
    // Resolves to whether the transaction was submitted: Para reports a
    // rejected signature as null, Bread Wallet throws.
    if (isParaWallet(senderAccount)) {
      const submitted = !!(await submitWithPara(transactionRequest));
      if (submitted) {
        verifyNote();
      }
      return submitted;
    }
    if (!requestTransaction) {
      return false;
    }
    const customTransaction = new CustomTransaction(
      senderAccount.address,
      recipientAccount.address,
      transactionRequest,
    );
    const txId = await requestTransaction({
      type: TransactionType.Custom,
      payload: customTransaction,
    });
    console.info({ txId });
    verifyNote();
    return true;
  };
  const importNoteFromFile = async ({
    noteId,
    noteFileBytes,
  }: {
    noteId: string;
    noteFileBytes: Uint8Array;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const inputNote = await clientImportNoteFile({
      client,
      noteId,
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
