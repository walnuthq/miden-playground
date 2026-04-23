import {
  type ConsumableNoteRecord as WasmConsumableNoteRecordType,
  type TransactionResult as WasmTransactionResultType,
  type TransactionRequest as WasmTransactionRequestType,
  NoteType as WasmNoteType,
  AccountId as WasmAccountId,
  Word as WasmWord,
  TransactionFilter as WasmTransactionFilter,
  TransactionId as WasmTransactionId,
  Package as WasmPackage,
} from "@miden-sdk/miden-sdk";
import type { NoteType } from "@/lib/types/note";
import type {
  CreateTransactionDialogStep,
  TransactionType,
} from "@/lib/types/transaction";
import {
  wasmAccountToAccount,
  wasmTransactionToTransaction,
  clientGetAllInputNotes,
  clientGetConsumableNotes,
} from "@/lib/web-client";
import type { MidenInput, ProcedureExport, Script } from "@/lib/types/script";
import { invokeProcedureCustomTransactionScript } from "@/lib/utils/script";
import useGlobalContext from "@/components/global-context/hook";
import { fromBase64 } from "@/lib/utils";
import {
  useMiden,
  useSyncState,
  useExecuteProgram,
  // useTransaction,
  // useTransactionHistory,
} from "@miden-sdk/react";
import useNetwork from "@/hooks/use-network";

const useTransactions = () => {
  const { networkId } = useNetwork();
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
    dispatch,
  } = useGlobalContext();
  const { client } = useMiden();
  const { lastSyncTime } = useSyncState();
  const { execute: executeProgram } = useExecuteProgram();
  // const { execute } = useTransaction();
  // const { records } = useTransactionHistory();
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
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const wasmNoteTypes = {
      public: WasmNoteType.Public,
      private: WasmNoteType.Private,
    } as const;
    const transactionRequest = client.newMintTransactionRequest(
      WasmAccountId.fromHex(targetAccountId),
      WasmAccountId.fromHex(faucetId),
      wasmNoteTypes[noteType],
      amount,
    );
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(faucetId),
      transactionRequest,
    );
    return { transactionRequest, transactionResult };
  };
  const newConsumeTransactionRequest = async ({
    accountId,
    noteIds,
  }: {
    accountId: string;
    noteIds: string[];
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const wasmInputNoteRecords = await Promise.all(
      noteIds.map((noteId) => client.getInputNote(noteId)),
    );
    const notes = wasmInputNoteRecords
      .filter((inputNoteRecord) => inputNoteRecord !== undefined)
      .map((inputNoteRecord) => inputNoteRecord.toNote());
    const transactionRequest = await client.newConsumeTransactionRequest(notes);
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(accountId),
      transactionRequest,
    );
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
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const wasmNoteTypes = {
      public: WasmNoteType.Public,
      private: WasmNoteType.Private,
    } as const;
    const transactionRequest = client.newSendTransactionRequest(
      WasmAccountId.fromHex(senderAccountId),
      WasmAccountId.fromHex(targetAccountId),
      WasmAccountId.fromHex(faucetId),
      wasmNoteTypes[noteType],
      amount,
    );
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(senderAccountId),
      transactionRequest,
    );
    return { transactionRequest, transactionResult };
  };
  const newCustomTransactionRequest = async ({
    senderAccountId,
    transactionRequest,
  }: {
    senderAccountId: string;
    transactionRequest: WasmTransactionRequestType;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(senderAccountId),
      transactionRequest,
    );
    return { transactionRequest, transactionResult };
  };
  const readWord = async ({
    accountId,
    script,
    procedureExport,
    procedureInputs = [],
  }: {
    accountId: string;
    script: Script;
    procedureExport: ProcedureExport;
    procedureInputs?: MidenInput[];
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const builder = client.createCodeBuilder();
    const contractName = script.name.replaceAll("-", "_");
    const accountComponentLibrary = script.masm
      ? builder.buildLibrary(`external_contract::${contractName}`, script.masm)
      : WasmPackage.deserialize(fromBase64(script.masp)).asLibrary();
    builder.linkDynamicLibrary(accountComponentLibrary);
    const transactionScript = builder.compileTxScript(
      invokeProcedureCustomTransactionScript({
        contractName: script.masm ? contractName : undefined,
        procedureExport,
        procedureInputs,
      }),
    );
    const { stack } = await executeProgram({
      accountId,
      script: transactionScript,
    });
    return new WasmWord(new BigUint64Array(stack.slice(0, 4)));
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
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const transactionId = await client.submitNewTransaction(
      WasmAccountId.fromHex(accountId),
      transactionRequest,
    );
    const transactionIdHex = transactionId.toHex();
    // const { transactionId } = await execute({
    //   accountId,
    //   request: transactionRequest,
    // });
    // console.log("transactionId", transactionId);
    // if (client.usesMockChain()) {
    //   await client.proveBlock();
    // }
    // const syncSummary = await client.syncState();
    const transactions = await client.getTransactions(
      WasmTransactionFilter.ids([WasmTransactionId.fromHex(transactionIdHex)]),
    );
    const transactionRecord = transactions.find(
      (tx) => tx.id().toHex() === transactionIdHex,
    );
    const nextAccount = await client.getAccount(
      WasmAccountId.fromHex(accountId),
    );
    const previousAccount = accounts.find(
      ({ id }) => id === nextAccount?.id().toString(),
    );
    if (!transactionRecord || !nextAccount || !previousAccount) {
      throw new Error("Transaction record or account not found");
    }
    const inputNotes = await clientGetAllInputNotes({
      client,
      networkId,
      previousInputNotes,
      scripts,
      updatedAt: lastSyncTime,
    });
    const consumableNoteIds: Record<string, string[]> = {};
    for (const account of accounts) {
      const consumableNotes = await clientGetConsumableNotes({
        client,
        accountId,
      });
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString(),
      );
      consumableNoteIds[account.id] = noteIds;
    }
    const transaction = wasmTransactionToTransaction({
      record: transactionRecord,
      result: transactionResult,
    });
    const account = wasmAccountToAccount({
      wasmAccount: nextAccount,
      name: previousAccount.name,
      components: previousAccount.components,
      updatedAt: lastSyncTime,
      consumableNoteIds: consumableNoteIds[previousAccount.id],
    });
    dispatch({
      type: "SUBMIT_TRANSACTION",
      payload: {
        transaction,
        account,
        consumableNoteIds,
        inputNotes,
        serializedMockChain: client.usesMockChain()
          ? client.serializeMockChain()
          : new Uint8Array(),
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
