import {
  type ConsumableNoteRecord as WasmConsumableNoteRecordType,
  type TransactionResult as WasmTransactionResultType,
  type TransactionRequest as WasmTransactionRequestType,
} from "@demox-labs/miden-sdk";
import { type NoteType } from "@/lib/types/note";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
} from "@/lib/types/transaction";
import {
  // webClient,
  clientExecuteTransaction,
  clientNewMintTransactionRequest,
  clientNewConsumeTransactionRequest,
  clientNewSendTransactionRequest,
  wasmAccountToAccount,
  wasmTransactionToTransaction,
  clientGetAllInputNotes,
  clientGetConsumableNotes,
  clientGetTransactionsByIds,
  clientSubmitNewTransaction,
  clientGetAccountById,
  clientReadWord,
} from "@/lib/web-client";
import { type Export } from "@/lib/types/script";
import useGlobalContext from "@/components/global-context/hook";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useWebClient from "@/hooks/use-web-client";

const useTransactions = () => {
  const { midenSdk } = useMidenSdk();
  const {
    accounts,
    submittingTransaction,
    createTransactionDialogOpen,
    createTransactionDialogAccountId,
    createTransactionDialogTransactionType,
    createTransactionDialogStep,
    createTransactionDialogConsumableNotes,
    createTransactionDialogNoteIds,
    createTransactionDialogTransactionRequest,
    createTransactionDialogTransactionResult,
    inputNotes: previousInputNotes,
    scripts,
    transactions,
    networkId,
    dispatch,
  } = useGlobalContext();
  const { client } = useWebClient();
  const openCreateTransactionDialog = ({
    accountId = "",
    transactionType = "consume",
    step = "select",
    consumableNotes = [],
    noteIds = [],
    transactionRequest = null,
    transactionResult = null,
  }: {
    accountId?: string;
    transactionType?: TransactionType;
    step?: CreateTransactionDialogStep;
    consumableNotes?: WasmConsumableNoteRecordType[];
    noteIds?: string[];
    transactionRequest?: WasmTransactionRequestType | null;
    transactionResult?: WasmTransactionResultType | null;
  }) =>
    dispatch({
      type: "OPEN_CREATE_TRANSACTION_DIALOG",
      payload: {
        accountId,
        transactionType,
        step,
        consumableNotes,
        noteIds,
        transactionRequest,
        transactionResult,
      },
    });
  const closeCreateTransactionDialog = () =>
    dispatch({
      type: "CLOSE_CREATE_TRANSACTION_DIALOG",
    });
  const newMintTransactionRequest = async ({
    targetAccountId,
    faucetId,
    noteType,
    amount,
  }: {
    targetAccountId: string;
    faucetId: string;
    noteType: NoteType;
    amount: bigint;
  }) => {
    const transactionRequest = clientNewMintTransactionRequest({
      client,
      targetAccountId,
      faucetId,
      noteType,
      amount,
      midenSdk,
    });
    const transactionResult = await clientExecuteTransaction({
      client,
      accountId: faucetId,
      transactionRequest,
      midenSdk,
    });
    return { transactionRequest, transactionResult };
  };
  const newConsumeTransactionRequest = async ({
    accountId,
    noteIds,
  }: {
    accountId: string;
    noteIds: string[];
  }) => {
    const transactionRequest = clientNewConsumeTransactionRequest({
      client,
      noteIds,
    });
    const transactionResult = await clientExecuteTransaction({
      client,
      accountId,
      transactionRequest,
      midenSdk,
    });
    return { transactionRequest, transactionResult };
  };
  const newSendTransactionRequest = async ({
    senderAccountId,
    targetAccountId,
    faucetId,
    noteType,
    amount,
  }: {
    senderAccountId: string;
    targetAccountId: string;
    faucetId: string;
    noteType: NoteType;
    amount: bigint;
  }) => {
    const transactionRequest = clientNewSendTransactionRequest({
      client,
      senderAccountId,
      targetAccountId,
      faucetId,
      noteType,
      amount,
      midenSdk,
    });
    const transactionResult = await clientExecuteTransaction({
      client,
      accountId: senderAccountId,
      transactionRequest,
      midenSdk,
    });
    return { transactionRequest, transactionResult };
  };
  const newCustomTransactionRequest = async ({
    senderAccountId,
    transactionRequest,
  }: {
    senderAccountId: string;
    transactionRequest: WasmTransactionRequestType;
  }) => {
    const transactionResult = await clientExecuteTransaction({
      client,
      accountId: senderAccountId,
      transactionRequest,
      midenSdk,
    });
    return { transactionRequest, transactionResult };
  };
  const readWord = async ({
    accountId,
    procedureExport,
  }: {
    accountId: string;
    procedureExport: Export;
  }) => {
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    await client.syncState();
    try {
      const word = await clientReadWord({
        client,
        accountId,
        procedureExport,
        midenSdk,
      });
      dispatch({ type: "TRANSACTION_SUBMITTED" });
      return word;
    } catch (error) {
      console.error(error);
      dispatch({ type: "TRANSACTION_SUBMITTED" });
      throw error;
    }
  };
  const submitNewTransaction = async ({
    accountId,
    transactionRequest,
    transactionResult,
  }: {
    accountId: string;
    transactionRequest: WasmTransactionRequestType;
    transactionResult: WasmTransactionResultType;
  }) => {
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const transactionId = await clientSubmitNewTransaction({
      client,
      accountId,
      transactionRequest,
      midenSdk,
    });
    let newSerializedMockChain = null;
    if (client.usesMockChain()) {
      await client.proveBlock();
      newSerializedMockChain = client.serializeMockChain();
    }
    const syncSummary = await client.syncState();
    const transactionIdHex = transactionId.toHex();
    const transactions = await clientGetTransactionsByIds({
      client,
      transactionIds: [transactionId],
      midenSdk,
    });
    const transactionRecord = transactions.find(
      (tx) => tx.id().toHex() === transactionIdHex,
    );
    const nextAccount = await clientGetAccountById({
      client,
      accountId,
      midenSdk,
    });
    const previousAccount = accounts.find(
      ({ id }) => id === nextAccount?.id().toString(),
    );
    if (!transactionRecord || !nextAccount || !previousAccount) {
      throw new Error("Transaction record or account not found");
    }
    const inputNotes = await clientGetAllInputNotes({
      client,
      previousInputNotes,
      scripts,
      midenSdk,
    });
    const consumableNoteIds: Record<string, string[]> = {};
    for (const account of accounts) {
      const consumableNotes = await clientGetConsumableNotes({
        client,
        accountId: account.id,
        midenSdk,
      });
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString(),
      );
      consumableNoteIds[account.id] = noteIds;
    }
    const transaction = wasmTransactionToTransaction({
      record: transactionRecord,
      result: transactionResult,
      midenSdk,
    });
    const account = wasmAccountToAccount({
      wasmAccount: nextAccount,
      name: previousAccount.name,
      components: previousAccount.components,
      networkId,
      updatedAt: syncSummary.blockNum(),
      consumableNoteIds: consumableNoteIds[previousAccount.id],
      midenSdk,
    });
    dispatch({
      type: "SUBMIT_TRANSACTION",
      payload: {
        transaction,
        account,
        consumableNoteIds,
        inputNotes,
        blockNum: syncSummary.blockNum(),
        serializedMockChain: newSerializedMockChain,
      },
    });
    return transactionRecord;
  };
  return {
    submittingTransaction,
    createTransactionDialogOpen,
    createTransactionDialogAccountId,
    createTransactionDialogTransactionType,
    createTransactionDialogStep,
    createTransactionDialogConsumableNotes,
    createTransactionDialogNoteIds,
    createTransactionDialogTransactionRequest,
    createTransactionDialogTransactionResult,
    transactions,
    openCreateTransactionDialog,
    closeCreateTransactionDialog,
    newMintTransactionRequest,
    newConsumeTransactionRequest,
    newSendTransactionRequest,
    newCustomTransactionRequest,
    readWord,
    submitNewTransaction,
  };
};

export default useTransactions;
