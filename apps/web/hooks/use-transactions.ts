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
  webClient,
  clientExecuteTransaction,
  clientNewMintTransactionRequest,
  clientNewConsumeTransactionRequest,
  clientNewSendTransactionRequest,
  wasmAccountToAccount,
  wasmTransactionToTransaction,
  clientGetAllInputNotes,
  clientGetConsumableNotes,
  clientGetTransactionsByIds,
} from "@/lib/web-client";
import useGlobalContext from "@/components/global-context/hook";

const useTransactions = () => {
  const {
    accounts,
    createTransactionDialogOpen,
    createTransactionDialogAccountId,
    createTransactionDialogTransactionType,
    createTransactionDialogStep,
    createTransactionDialogConsumableNotes,
    createTransactionDialogNoteIds,
    createTransactionDialogTransactionRequest,
    createTransactionDialogTransactionResult,
    inputNotes,
    transactions,
    networkId,
    serializedMockChain,
    dispatch,
  } = useGlobalContext();
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
    const client = await webClient(networkId, serializedMockChain);
    const transactionRequest = await clientNewMintTransactionRequest(client, {
      targetAccountId,
      faucetId,
      noteType,
      amount,
    });
    const transactionResult = await clientExecuteTransaction(client, {
      accountId: faucetId,
      transactionRequest,
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
    const client = await webClient(networkId, serializedMockChain);
    const transactionRequest = await clientNewConsumeTransactionRequest(
      client,
      noteIds
    );
    const transactionResult = await clientExecuteTransaction(client, {
      accountId,
      transactionRequest,
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
    const client = await webClient(networkId, serializedMockChain);
    const transactionRequest = await clientNewSendTransactionRequest(client, {
      senderAccountId,
      targetAccountId,
      faucetId,
      noteType,
      amount,
    });
    const transactionResult = await clientExecuteTransaction(client, {
      accountId: senderAccountId,
      transactionRequest,
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
    const client = await webClient(networkId, serializedMockChain);
    const transactionResult = await clientExecuteTransaction(client, {
      accountId: senderAccountId,
      transactionRequest,
    });
    return { transactionRequest, transactionResult };
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
    const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
    const client = await webClient(networkId, serializedMockChain);
    const transactionId = await client.submitNewTransaction(
      WasmAccountId.fromHex(accountId),
      transactionRequest
    );
    let newSerializedMockChain = null;
    if (client.usesMockChain()) {
      await client.proveBlock();
      newSerializedMockChain = client.serializeMockChain();
    }
    const syncSummary = await client.syncState();
    const transactionIdHex = transactionId.toHex();
    const transactions = await clientGetTransactionsByIds(client, [
      transactionId,
    ]);
    const transactionRecord = transactions.find(
      (tx) => tx.id().toHex() === transactionIdHex
    );
    const nextAccount = await client.getAccount(
      WasmAccountId.fromHex(accountId)
    );
    const previousAccount = accounts.find(
      ({ id }) => id === nextAccount?.id().toString()
    );
    if (!transactionRecord || !nextAccount || !previousAccount) {
      throw new Error("Transaction record or account not found");
    }
    const newInputNotes = await clientGetAllInputNotes(client, inputNotes);
    const consumableNoteIds: Record<string, string[]> = {};
    for (const account of accounts) {
      const consumableNotes = await clientGetConsumableNotes(
        client,
        account.id
      );
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      );
      consumableNoteIds[account.id] = noteIds;
    }
    const transaction = await wasmTransactionToTransaction(
      transactionRecord,
      transactionResult
    );
    const account = await wasmAccountToAccount({
      wasmAccount: nextAccount,
      name: previousAccount.name,
      components: previousAccount.components,
      networkId,
      updatedAt: syncSummary.blockNum(),
      consumableNoteIds: consumableNoteIds[previousAccount.id],
    });
    dispatch({
      type: "SUBMIT_TRANSACTION",
      payload: {
        transaction,
        account,
        consumableNoteIds,
        inputNotes: newInputNotes,
        blockNum: syncSummary.blockNum(),
        serializedMockChain: newSerializedMockChain,
      },
    });
    return transactionRecord;
  };
  return {
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
    submitNewTransaction,
  };
};

export default useTransactions;
