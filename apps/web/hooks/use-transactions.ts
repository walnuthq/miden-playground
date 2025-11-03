import {
  type ConsumableNoteRecord as WasmConsumableNoteRecord,
  type TransactionResult as WasmTransactionResult,
  type TransactionRequest as WasmTransactionRequest,
} from "@demox-labs/miden-sdk";
import { type NoteType } from "@/lib/types/note";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
} from "@/lib/types/transaction";
import {
  webClient,
  clientNewMintTransactionRequest,
  clientNewConsumeTransactionRequest,
  clientNewSendTransactionRequest,
  clientNewTransaction,
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
    transactionResult = null,
  }: {
    accountId?: string;
    transactionType?: TransactionType;
    step?: CreateTransactionDialogStep;
    consumableNotes?: WasmConsumableNoteRecord[];
    noteIds?: string[];
    transactionResult?: WasmTransactionResult | null;
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
    const client = await webClient(networkId, serializedMockChain);
    const transactionRequest = await clientNewMintTransactionRequest(client, {
      targetAccountId,
      faucetId,
      noteType,
      amount,
    });
    return clientNewTransaction(client, {
      accountId: faucetId,
      transactionRequest,
    });
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
    return clientNewTransaction(client, {
      accountId,
      transactionRequest,
    });
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
    return clientNewTransaction(client, {
      accountId: senderAccountId,
      transactionRequest,
    });
  };
  const newCustomTransactionRequest = async ({
    senderAccountId,
    transactionRequest,
  }: {
    senderAccountId: string;
    transactionRequest: WasmTransactionRequest;
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    return clientNewTransaction(client, {
      accountId: senderAccountId,
      transactionRequest,
    });
  };
  const submitTransaction = async (
    transactionResult: WasmTransactionResult
  ) => {
    // const { TransactionProver: WasmTransactionProver } = await import(
    //   "@demox-labs/miden-sdk"
    // );
    const client = await webClient(networkId, serializedMockChain);
    await client.submitTransaction(
      transactionResult
      // WasmTransactionProver.newRemoteProver(
      //   "https://tx-prover.testnet.miden.io"
      // )
    );
    let newSerializedMockChain = null;
    if (client.usesMockChain()) {
      await client.proveBlock();
      newSerializedMockChain = client.serializeMockChain();
    }
    const syncSummary = await client.syncState();
    console.log("blockNum", syncSummary.blockNum());
    const transactionId = transactionResult.executedTransaction().id();
    /* const transactions = await client.getTransactions(
      WasmTransactionFilter.ids([transactionResult.executedTransaction().id()])
    ); */
    const transactions = await clientGetTransactionsByIds(client, [
      transactionResult.executedTransaction().id(),
    ]);
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
    const newInputNotes = await clientGetAllInputNotes(client, inputNotes);
    // console.log("inputNotes.length", inputNotes.length);
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
