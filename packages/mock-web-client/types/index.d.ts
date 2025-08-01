import { WebClient as WasmWebClient } from "wasm-mock-web-client";

export {
  Account,
  AccountBuilder,
  AccountComponent,
  AccountHeader,
  AccountId,
  AccountStorageMode,
  AccountStorage,
  AccountStorageRequirements,
  AccountType,
  AdviceMap,
  AssetVault,
  Assembler,
  AssemblerUtils,
  AuthSecretKey,
  ConsumableNoteRecord,
  Felt,
  FeltArray,
  ForeignAccount,
  FungibleAsset,
  InputNoteRecord,
  InputNoteState,
  Library,
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
  PublicKey,
  RpoDigest,
  Rpo256,
  SecretKey,
  SerializedAccountHeader,
  SlotAndKeys,
  SlotAndKeysArray,
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
  WebClient,
} from "wasm-mock-web-client";

// Extend WASM WebClient but override methods that use workers
export declare class WebClient extends WasmWebClient {
  /**
   * Factory method to create and initialize a new wrapped WebClient.
   *
   * @param rpcUrl - The RPC URL (optional).
   * @param seed - The seed for the account (optional).
   * @returns A promise that resolves to a fully initialized WebClient.
   */
  static createClient(rpcUrl?: string, seed?: Uint8Array): Promise<WebClient>;

  /**
   * Terminates the underlying worker.
   */
  terminate(): void;
}
