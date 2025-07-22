import { MockWebClient as WasmMockWebClient } from "wasm-mock-web-client";

export {
  Account,
  AccountBuilder,
  AccountComponent,
  AccountHeader,
  AccountId,
  AccountStorageMode,
  AccountStorage,
  AccountType,
  AdviceMap,
  AssetVault,
  Assembler,
  AssemblerUtils,
  AuthSecretKey,
  ConsumableNoteRecord,
  Felt,
  FeltArray,
  FungibleAsset,
  InputNoteRecord,
  InputNoteState,
  Library,
  NetworkId,
  NewSwapTransactionResult,
  Note,
  NoteAndArgs,
  NoteAndArgsArray,
  NoteAssets,
  NoteConsumability,
  NoteExecutionHint,
  NoteExecutionMode,
  NoteFilter,
  NoteFilterTypes,
  NoteId,
  NoteIdAndArgs,
  NoteIdAndArgsArray,
  NoteInputs,
  NoteMetadata,
  NoteRecipient,
  NoteScript,
  NoteTag,
  NoteType,
  OutputNote,
  OutputNotesArray,
  Rpo256,
  SerializedAccountHeader,
  StorageMap,
  StorageSlot,
  SyncSummary,
  TestUtils,
  TransactionFilter,
  TransactionKernel,
  TransactionProver,
  TransactionRecord,
  TransactionRequest,
  TransactionResult,
  TransactionRequestBuilder,
  TransactionScript,
  TransactionScriptInputPair,
  TransactionScriptInputPairArray,
  Word,
  MockWebClient,
} from "wasm-mock-web-client";

// Extend WASM WebClient but override methods that use workers
export declare class MockWebClient extends WasmMockWebClient {
  /**
   * Factory method to create and initialize a new wrapped WebClient.
   *
   * @param rpcUrl - The RPC URL (optional).
   * @param seed - The seed for the account (optional).
   * @returns A promise that resolves to a fully initialized WebClient.
   */
  static createClient(
    rpcUrl?: string,
    seed?: Uint8Array,
  ): Promise<MockWebClient>;

  /**
   * Terminates the underlying worker.
   */
  terminate(): void;
}
