import {
  type ConsumableNoteRecord as WasmConsumableNoteRecordType,
  type TransactionResult as WasmTransactionResultType,
  type TransactionRequest as WasmTransactionRequestType,
  type TransactionId as WasmTransactionIdType,
  type MidenClient,
  NoteType as WasmNoteType,
  AccountId as WasmAccountId,
  Word as WasmWord,
  TransactionFilter as WasmTransactionFilter,
  TransactionId as WasmTransactionId,
  Package as WasmPackage,
} from "@miden-sdk/miden-sdk/lazy";
import type { NoteType } from "@/lib/types/note";
import type {
  CreateTransactionDialogStep,
  TransactionType,
} from "@/lib/types/transaction";
import {
  wasmAccountToAccount,
  wasmTransactionToTransaction,
} from "@/lib/web-client";
import type { MidenInput, ProcedureExport, Script } from "@/lib/types/script";
import { invokeProcedureCustomTransactionScript } from "@/lib/utils/script";
import useGlobalContext from "@/components/global-context/hook";
import { fromBase64 } from "@/lib/utils";
import {
  useMiden,
  useSyncState,
  useExecuteProgram,
  useTransaction,
  useSyncControl,
} from "@miden-sdk/react/lazy";
import { useParaWallet } from "@/components/providers/para-wallet-context";

// How long a Para transaction waits for the app client's ongoing sync.
const SYNC_IDLE_TIMEOUT_MS = 5000;

const useTransactions = () => {
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
    transactions,
    dispatch,
  } = useGlobalContext();
  const { client } = useMiden();
  const { lastSyncTime } = useSyncState();
  const { execute: executeProgram } = useExecuteProgram();
  const { execute } = useTransaction();
  const { pauseSync, resumeSync } = useSyncControl();
  const paraWallet = useParaWallet();
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
    const transactionRequest = await client.newMintTransactionRequest(
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
    const transactionRequest = await client.newConsumeTransactionRequest(
      notes,
      WasmAccountId.fromHex(accountId),
    );
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
    const transactionRequest = await client.newSendTransactionRequest(
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
    const builder = await client.createCodeBuilder();
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
    const { transactionId } = await execute({
      accountId,
      request: transactionRequest,
    });
    // if (client.usesMockChain()) {
    //   await client.proveBlock();
    // }
    // const syncSummary = await client.syncState();
    return recordTransaction({ accountId, transactionId, transactionResult });
  };
  // Adds a submitted transaction to app state, with its account's new state,
  // both read from the store.
  const recordTransaction = async ({
    accountId,
    transactionId,
    transactionResult,
  }: {
    accountId: string;
    transactionId: string;
    transactionResult: WasmTransactionResultType;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const transactions = await client.getTransactions(
      WasmTransactionFilter.ids([WasmTransactionId.fromHex(transactionId)]),
    );
    const transactionRecord = transactions.find(
      (tx) => tx.id().toHex() === transactionId,
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
    const transaction = wasmTransactionToTransaction({
      record: transactionRecord,
      result: transactionResult,
    });
    const account = wasmAccountToAccount({
      wasmAccount: nextAccount,
      name: previousAccount.name,
      components: previousAccount.components,
      updatedAt: lastSyncTime,
    });
    dispatch({
      type: "SUBMIT_TRANSACTION",
      payload: {
        transaction,
        account,
        // serializedMockChain: client.usesMockChain()
        //   ? client.serializeMockChain()
        //   : new Uint8Array(),
      },
    });
    return transactionRecord;
  };
  // Runs a Para Wallet transaction (executed, proven and submitted) on the
  // Para client, whose keystore signs through Para (its modal is the
  // confirmation), and records it. That client builds its own requests rather
  // than relying on the app client, which may be busy syncing. Both share a
  // store but not their transaction locks, so the app's syncing is paused
  // meanwhile (SUBMITTING_TRANSACTION also stops the app's own syncState),
  // waiting a bounded time for an ongoing sync to finish.
  const submitParaTransaction = async (
    run: (
      paraClient: MidenClient,
      accountId: string,
    ) => Promise<{
      txId: WasmTransactionIdType;
      result: WasmTransactionResultType;
    }>,
  ) => {
    if (!client || !paraWallet?.client || !paraWallet.accountId) {
      throw new Error("Para client not ready");
    }
    const { client: paraClient, accountId, takeSignError } = paraWallet;
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    pauseSync();
    try {
      await Promise.race([
        (client as { waitForIdle?: () => Promise<void> }).waitForIdle?.(),
        new Promise((resolve) => setTimeout(resolve, SYNC_IDLE_TIMEOUT_MS)),
      ]);
      takeSignError();
      const { txId, result } = await run(paraClient, accountId);
      return await recordTransaction({
        accountId,
        transactionId: txId.toHex(),
        transactionResult: result,
      });
    } catch (error) {
      dispatch({ type: "TRANSACTION_SUBMITTED" });
      // The executor replaces a failed signature's error with its own.
      throw takeSignError() ?? error;
    } finally {
      resumeSync();
    }
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
    submitParaTransaction,
  };
};

export default useTransactions;
