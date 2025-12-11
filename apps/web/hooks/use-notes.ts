import useGlobalContext from "@/components/global-context/hook";
import { type NoteType, type InputNote } from "@/lib/types/note";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import {
  useWallet,
  CustomTransaction,
  TransactionType,
} from "@demox-labs/miden-wallet-adapter";
import { sleep } from "@/lib/utils";
import { clientCreateNoteFromScript } from "@/lib/web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useWebClient from "@/hooks/use-web-client";

const useNotes = () => {
  const { midenSdk } = useMidenSdk();
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
  const { client } = useWebClient();
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
      AccountId,
      TransactionRequestBuilder,
      OutputNote,
      Note,
      NoteAssets,
      FungibleAsset,
      NoteType,
      Felt,
      MidenArrays,
    } = midenSdk;
    const note =
      tutorialId === "timelock-p2id-note"
        ? Note.createP2IDENote(
            AccountId.fromHex(senderAccountId),
            AccountId.fromHex(recipientAccountId),
            new NoteAssets([
              new FungibleAsset(AccountId.fromHex(faucetAccountId), amount),
            ]),
            Number(noteInputs[2]),
            Number(noteInputs[2]),
            type === "public" ? NoteType.Public : NoteType.Private,
            new Felt(0n)
          )
        : clientCreateNoteFromScript({
            client,
            senderAccountId,
            recipientAccountId,
            script,
            type,
            faucetAccountId,
            amount,
            noteInputs,
            scripts,
            midenSdk,
          });
    const transactionRequest = new TransactionRequestBuilder()
      .withOwnOutputNotes(
        new MidenArrays.OutputNoteArray([OutputNote.full(note)])
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
    addNote,
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
