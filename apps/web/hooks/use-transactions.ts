import {
  AccountId,
  type TransactionResult,
  TransactionFilter,
  NoteFilter,
  NoteFilterTypes,
  type NoteType,
  type ConsumableNoteRecord,
} from "@workspace/mock-web-client";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
  wasmTransactionToTransaction,
} from "@/lib/types";
import { mockWebClient } from "@/lib/mock-web-client";
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
  /* const openConsumeDialog = async (accountId: AccountId) => {
    const client = await mockWebClient();
    // const transactions = await client.getTransactions(TransactionFilter.all());
    // transactions.forEach((transaction) => {
    // 	console.log('Transaction ID:', transaction.id().toHex());
    // 	console.log('Account ID:', transaction.accountId().toString());
    // 	console.log(transaction.transactionStatus().isDiscarded());
    // });
    // console.log('Transactions:', transactions.length);
    // console.log(accountId.toString());
    // const n = await client.getConsumableNotes(
    // 	AccountId.fromHex('0xe8f1b1e24ebf0520000083c480c106')
    // );
    // console.log(n.length);
    // const inputNotes = await client.getInputNotes(new NoteFilter(NoteFilterTypes.All));
    // inputNotes.forEach((inputNote) => {
    // 	console.log('Note ID:', inputNote.id().toString());
    // 	console.log('consumerTransactionId:', inputNote.consumerTransactionId());
    // 	console.log('assets:', inputNote.details().assets().fungibleAssets()[0].amount());
    // 	console.log('isAuthenticated:', inputNote.isAuthenticated());
    // 	console.log('isConsumed:', inputNote.isConsumed());
    // 	console.log('isProcessing:', inputNote.isProcessing());
    // 	console.log('noteType:', inputNote.metadata()?.noteType());
    // 	console.log('sender:', inputNote.metadata()?.sender().toString());
    // 	console.log('tag:', inputNote.metadata()?.tag());
    // });
    // const outputNotes = await client.getOutputNotes(new NoteFilter(NoteFilterTypes.All));
    // console.log(outputNotes);
    // const outputNote = await client.getOutputNote(outputNotes[0]);
    // console.log(outputNote);
    const consumableNotes = await client.getConsumableNotes(accountId);
    // const note = consumableNotes[0];
    // console.log(note.noteConsumability().at(0)?.accountId().toString());
    // console.log(note.inputNoteRecord().id().toString());
    // console.log(note.inputNoteRecord().consumerTransactionId());
    // console.log(note.inputNoteRecord().details().assets().fungibleAssets()[0].amount());
    // console.log(
    // 	note.inputNoteRecord().details().assets().fungibleAssets()[0].faucetId().toString()
    // );
    // console.log(
    // 	note.inputNoteRecord().details().recipient()
    // );
    // console.log(note.inputNoteRecord().metadata()?.noteType());
    // console.log(note.inputNoteRecord().state());
    // const consumableNoteIds = consumableNotes.map((note) => note.inputNoteRecord().id().toString());
    dispatch({
      type: "OPEN_CONSUME_DIALOG",
      payload: { consumableNotes },
    });
  }; */
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
    const client = await mockWebClient();
    const transactionRequest = client.newMintTransactionRequest(
      AccountId.fromHex(targetAccountId),
      AccountId.fromHex(faucetId),
      noteType,
      amount
    );
    return client.newTransaction(
      AccountId.fromHex(faucetId),
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
    const client = await mockWebClient();
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
    const client = await mockWebClient();
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
  const submitTransaction = async (transactionResult: TransactionResult) => {
    const client = await mockWebClient();
    await client.submitTransaction(transactionResult);
    const syncSummary = await client.syncState();
    // const blockHeader = await client.getLatestEpochBlock();
    // console.log("blockNum", blockHeader.blockNum());
    // console.log("commitment:", blockHeader.commitment().toHex());
    // console.log("chainCommitment:", blockHeader.chainCommitment().toHex());
    // console.log('Transaction submitted');
    const transactionId = transactionResult.executedTransaction().id();
    // console.log('Transaction ID:', transactionId.toHex());
    // const accountId = transactionResult.executedTransaction().accountId().toString();
    // console.log('Account ID:', accountId);
    const transactions = await client.getTransactions(
      TransactionFilter.ids([transactionResult.executedTransaction().id()])
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
      new NoteFilter(NoteFilterTypes.All)
    );
    // console.log("inputNotes.length", inputNotes.length);
    const consumableNoteIds: Record<string, string[]> = {};
    for (const account of accounts) {
      const consumableNotes = await client.getConsumableNotes(
        AccountId.fromHex(account.id)
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
        syncSummary,
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
    submitTransaction,
  };
};

export default useTransactions;
