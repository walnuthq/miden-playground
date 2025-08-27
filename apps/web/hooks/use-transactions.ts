import {
  AccountId,
  type TransactionResult,
  TransactionFilter,
  NoteFilter,
  NoteFilterTypes,
  type NoteType,
  type ConsumableNoteRecord,
  type TransactionRequest,
} from "@workspace/mock-web-client";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
  wasmTransactionToTransaction,
} from "@/lib/types";
import { webClient } from "@/lib/web-client";
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
    createTransactionDialogTransactionResult,
    transactions,
    networkId,
    dispatch,
  } = useGlobalContext();
  const openCreateTransactionDialog = ({
    accountId = "",
    transactionType = "consume",
    step = "select",
    consumableNotes = [],
    noteIds = [],
    transactionResult = null,
  }: {
    accountId?: string;
    transactionType?: TransactionType;
    step?: CreateTransactionDialogStep;
    consumableNotes?: ConsumableNoteRecord[];
    noteIds?: string[];
    transactionResult?: TransactionResult | null;
  }) =>
    dispatch({
      type: "OPEN_CREATE_TRANSACTION_DIALOG",
      payload: {
        accountId,
        transactionType,
        step,
        consumableNotes,
        noteIds,
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
    const client = await webClient(networkId);
    // const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
    // const AccountIdClass = networkId === "mtst" ? WasmAccountId : AccountId;
    const transactionRequest = client.newMintTransactionRequest(
      /*Wasm*/ AccountId.fromHex(targetAccountId),
      /*Wasm*/ AccountId.fromHex(faucetId),
      noteType,
      amount
    );
    return client.newTransaction(
      /*Wasm*/ AccountId.fromHex(faucetId),
      transactionRequest
    );
  };
  const newConsumeTransactionRequest = async ({
    accountId,
    noteIds,
  }: {
    accountId: string;
    noteIds: string[];
  }) => {
    const client = await webClient(networkId);
    const transactionRequest = client.newConsumeTransactionRequest(noteIds);
    return client.newTransaction(
      AccountId.fromHex(accountId),
      transactionRequest
    );
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
    const client = await webClient(networkId);
    const transactionRequest = client.newSendTransactionRequest(
      AccountId.fromHex(senderAccountId),
      AccountId.fromHex(targetAccountId),
      AccountId.fromHex(faucetId),
      noteType,
      amount
    );
    return client.newTransaction(
      AccountId.fromHex(senderAccountId),
      transactionRequest
    );
  };
  const newCustomTransactionRequest = async ({
    senderAccountId,
    transactionRequest,
  }: {
    senderAccountId: string;
    transactionRequest: TransactionRequest;
  }) => {
    const client = await webClient(networkId);
    return client.newTransaction(
      AccountId.fromHex(senderAccountId),
      transactionRequest
    );
  };
  const submitTransaction = async (transactionResult: TransactionResult) => {
    const client = await webClient(networkId);
    await client.submitTransaction(transactionResult);
    // if (client.usesMockChain()) {
    //   await client.proveBlock();
    //   const serializedMockChain = client.serializeMockChain();
    //   localStorage.setItem(
    //     "serializedMockChain",
    //     serializedMockChain.toString()
    //   );
    // }
    const syncSummary = await client.syncState();
    const transactionId = transactionResult.executedTransaction().id();
    // const {
    //   TransactionFilter: WasmTransactionFilter,
    //   NoteFilter: WasmNoteFilter,
    //   AccountId: WasmAccountId,
    // } = await import("@demox-labs/miden-sdk-next");
    const transactions = await client.getTransactions(
      /*Wasm*/ TransactionFilter.ids([
        transactionResult.executedTransaction().id(),
      ])
    );
    // console.log('Transactions:', transactions.length);
    const transactionRecord = transactions.find(
      (tx) => tx.id().toHex() === transactionId.toHex()
    );
    const nextAccount = await client.getAccount(
      transactionResult.executedTransaction().accountId()
    );
    const previousAccount = accounts.find(
      ({ id }) => id === nextAccount?.id().toString()
    );
    if (!transactionRecord || !nextAccount || !previousAccount) {
      throw new Error("Transaction record or account not found");
    }
    const inputNotes = await client.getInputNotes(
      new /*Wasm*/ NoteFilter(NoteFilterTypes.All)
    );
    // console.log("inputNotes.length", inputNotes.length);
    const consumableNoteIds: Record<string, string[]> = {};
    for (const account of accounts) {
      const consumableNotes = await client.getConsumableNotes(
        /*Wasm*/ AccountId.fromHex(account.id)
      );
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      );
      consumableNoteIds[account.id] = noteIds;
    }
    dispatch({
      type: "SUBMIT_TRANSACTION",
      payload: {
        transaction: wasmTransactionToTransaction(
          transactionRecord,
          transactionResult,
          networkId
        ),
        account: wasmAccountToAccount(
          nextAccount,
          previousAccount.name,
          networkId,
          syncSummary.blockNum(),
          consumableNoteIds[previousAccount.id],
          previousAccount.tokenSymbol
        ),
        consumableNoteIds,
        inputNotes: inputNotes.map((inputNoteRecord) =>
          wasmInputNoteToInputNote(inputNoteRecord, networkId)
        ),
        blockNum: syncSummary.blockNum(),
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
    createTransactionDialogTransactionResult,
    transactions,
    openCreateTransactionDialog,
    closeCreateTransactionDialog,
    newMintTransactionRequest,
    newConsumeTransactionRequest,
    newSendTransactionRequest,
    newCustomTransactionRequest,
    submitTransaction,
  };
};

export default useTransactions;
