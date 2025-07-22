/* tslint:disable */
/* eslint-disable */
export enum InputNoteState {
  Expected = 0,
  Unverified = 1,
  Committed = 2,
  Invalid = 3,
  ProcessingAuthenticated = 4,
  ProcessingUnauthenticated = 5,
  ConsumedAuthenticatedLocal = 6,
  ConsumedUnauthenticatedLocal = 7,
  ConsumedExternal = 8,
}
export enum NoteFilterTypes {
  All = 0,
  Consumed = 1,
  Committed = 2,
  Expected = 3,
  Processing = 4,
  List = 5,
  Unique = 6,
  Nullifiers = 7,
  Unverified = 8,
}
export enum NoteType {
  /**
   * Notes with this type have only their hash published to the network.
   */
  Private = 2,
  /**
   * Notes with this type are shared with the network encrypted.
   */
  Encrypted = 3,
  /**
   * Notes with this type are fully shared with the network.
   */
  Public = 1,
}
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */
type ReadableStreamType = "bytes";
export class Account {
  private constructor();
  free(): void;
  id(): AccountId;
  commitment(): RpoDigest;
  nonce(): Felt;
  vault(): AssetVault;
  storage(): AccountStorage;
  code(): AccountCode;
  isFaucet(): boolean;
  isRegularAccount(): boolean;
  isUpdatable(): boolean;
  isPublic(): boolean;
  isNew(): boolean;
  serialize(): Uint8Array;
  static deserialize(bytes: Uint8Array): Account;
}
export class AccountCode {
  private constructor();
  free(): void;
  commitment(): RpoDigest;
}
export class AccountDelta {
  private constructor();
  free(): void;
  isEmpty(): boolean;
  storage(): AccountStorageDelta;
  vault(): AccountVaultDelta;
  nonce(): Felt | undefined;
}
export class AccountHeader {
  private constructor();
  free(): void;
  commitment(): RpoDigest;
  id(): AccountId;
  nonce(): Felt;
  vaultCommitment(): RpoDigest;
  storageCommitment(): RpoDigest;
  codeCommitment(): RpoDigest;
}
export class AccountId {
  private constructor();
  free(): void;
  static fromHex(hex: string): AccountId;
  isFaucet(): boolean;
  isRegularAccount(): boolean;
  toString(): string;
  prefix(): Felt;
  suffix(): Felt;
  toBech32(network_id: NetworkId): string;
}
export class AccountStorage {
  private constructor();
  free(): void;
  commitment(): RpoDigest;
  getItem(index: number): RpoDigest | undefined;
}
export class AccountStorageDelta {
  private constructor();
  free(): void;
  isEmpty(): boolean;
  values(): Word[];
}
export class AccountStorageMode {
  private constructor();
  free(): void;
  static private(): AccountStorageMode;
  static public(): AccountStorageMode;
  static network(): AccountStorageMode;
  static tryFromStr(s: string): AccountStorageMode;
  asStr(): string;
}
export class AccountVaultDelta {
  private constructor();
  free(): void;
  isEmpty(): boolean;
  fungible(): FungibleAssetDelta;
}
export class AdviceInputs {
  private constructor();
  free(): void;
  stack(): Felt[];
  mappedValues(key: RpoDigest): Felt[] | undefined;
}
export class AdviceMap {
  free(): void;
  constructor();
  insert(key: RpoDigest, value: FeltArray): Felt[] | undefined;
}
export class Assembler {
  private constructor();
  free(): void;
  withLibrary(library: Library): Assembler;
  withDebugMode(yes: boolean): Assembler;
  compileNoteScript(note_script: string): NoteScript;
}
export class AssemblerUtils {
  private constructor();
  free(): void;
  static createAccountComponentLibrary(assembler: Assembler, library_path: string, source_code: string): Library;
}
export class AssetVault {
  private constructor();
  free(): void;
  root(): RpoDigest;
  getBalance(faucet_id: AccountId): bigint;
  fungibleAssets(): FungibleAsset[];
}
export class BlockHeader {
  private constructor();
  free(): void;
  version(): number;
  commitment(): RpoDigest;
  subCommitment(): RpoDigest;
  prevBlockCommitment(): RpoDigest;
  blockNum(): number;
  chainCommitment(): RpoDigest;
  accountRoot(): RpoDigest;
  nullifierRoot(): RpoDigest;
  noteRoot(): RpoDigest;
  txCommitment(): RpoDigest;
  txKernelCommitment(): RpoDigest;
  proofCommitment(): RpoDigest;
  timestamp(): number;
}
export class ConsumableNoteRecord {
  free(): void;
  constructor(input_note_record: InputNoteRecord, note_consumability: NoteConsumability[]);
  inputNoteRecord(): InputNoteRecord;
  noteConsumability(): NoteConsumability[];
}
export class ExecutedTransaction {
  private constructor();
  free(): void;
  id(): TransactionId;
  accountId(): AccountId;
  initialAccount(): Account;
  finalAccount(): AccountHeader;
  inputNotes(): InputNotes;
  outputNotes(): OutputNotes;
  txArgs(): TransactionArgs;
  blockHeader(): BlockHeader;
  accountDelta(): AccountDelta;
}
export class Felt {
  free(): void;
  constructor(value: bigint);
  asInt(): bigint;
  toString(): string;
}
export class FeltArray {
  free(): void;
  constructor(felts_array?: Felt[] | null);
  append(felt: Felt): void;
}
export class FlattenedU8Vec {
  private constructor();
  free(): void;
  data(): Uint8Array;
  lengths(): Uint32Array;
  num_inner_vecs(): number;
}
export class FungibleAsset {
  free(): void;
  constructor(faucet_id: AccountId, amount: bigint);
  faucetId(): AccountId;
  amount(): bigint;
  intoWord(): Word;
}
export class FungibleAssetDelta {
  private constructor();
  free(): void;
  numAssets(): number;
  isEmpty(): boolean;
  iter(): FungibleAssetDeltaItem[];
}
export class FungibleAssetDeltaItem {
  private constructor();
  free(): void;
  readonly faucetId: AccountId;
  readonly amount: bigint;
}
export class InputNote {
  private constructor();
  free(): void;
  id(): NoteId;
  note(): Note;
  proof(): NoteInclusionProof | undefined;
  location(): NoteLocation | undefined;
}
export class InputNoteRecord {
  private constructor();
  free(): void;
  id(): NoteId;
  state(): InputNoteState;
  details(): NoteDetails;
  metadata(): NoteMetadata | undefined;
  inclusionProof(): NoteInclusionProof | undefined;
  consumerTransactionId(): string | undefined;
  nullifier(): string;
  isAuthenticated(): boolean;
  isConsumed(): boolean;
  isProcessing(): boolean;
  serialize(): Uint8Array;
  static deserialize(bytes: Uint8Array): InputNoteRecord;
}
export class InputNotes {
  private constructor();
  free(): void;
  commitment(): RpoDigest;
  numNotes(): number;
  isEmpty(): boolean;
  getNote(index: number): InputNote;
  notes(): InputNote[];
}
export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  start(controller: ReadableByteStreamController): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  cancel(): void;
  readonly type: ReadableStreamType;
  readonly autoAllocateChunkSize: number;
}
export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  write(chunk: any): Promise<any>;
  close(): Promise<any>;
  abort(reason: any): Promise<any>;
}
export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}
export class Library {
  private constructor();
  free(): void;
}
export class MerklePath {
  private constructor();
  free(): void;
  depth(): number;
  nodes(): RpoDigest[];
  computeRoot(index: bigint, node: RpoDigest): RpoDigest;
  verify(index: bigint, node: RpoDigest, root: RpoDigest): boolean;
}
export class MockWebClient {
  free(): void;
  newTransaction(account_id: AccountId, transaction_request: TransactionRequest): Promise<TransactionResult>;
  submitTransaction(transaction_result: TransactionResult, prover?: TransactionProver | null): Promise<void>;
  newMintTransactionRequest(target_account_id: AccountId, faucet_id: AccountId, note_type: NoteType, amount: bigint): TransactionRequest;
  newSendTransactionRequest(sender_account_id: AccountId, target_account_id: AccountId, faucet_id: AccountId, note_type: NoteType, amount: bigint, recall_height?: number | null): TransactionRequest;
  newConsumeTransactionRequest(list_of_note_ids: string[]): TransactionRequest;
  constructor();
  createClient(_node_url?: string | null, seed?: Uint8Array | null): Promise<any>;
  exportNote(note_id: string, export_type: string): Promise<any>;
  /**
   * Retrieves the entire underlying web store and returns it as a JsValue
   *
   * Meant to be used in conjunction with the force_import_store method
   */
  exportStore(): Promise<any>;
  importAccount(account_bytes: any): Promise<any>;
  importPublicAccountFromSeed(init_seed: Uint8Array, mutable: boolean): Promise<Account>;
  importAccountById(account_id: AccountId): Promise<any>;
  importNote(note_bytes: any): Promise<any>;
  forceImportStore(store_dump: any): Promise<any>;
  getTransactions(transaction_filter: TransactionFilter): Promise<TransactionRecord[]>;
  compileTxScript(script: string): TransactionScript;
  getAccounts(): Promise<AccountHeader[]>;
  getAccount(account_id: AccountId): Promise<Account | undefined>;
  newWallet(storage_mode: AccountStorageMode, mutable: boolean, init_seed?: Uint8Array | null): Promise<Account>;
  newFaucet(storage_mode: AccountStorageMode, non_fungible: boolean, token_symbol: string, decimals: number, max_supply: bigint): Promise<Account>;
  newAccount(account: Account, account_seed: Word | null | undefined, overwrite: boolean): Promise<void>;
  syncState(): Promise<SyncSummary>;
  getSyncHeight(): Promise<number>;
  getLatestEpochBlock(): Promise<BlockHeader>;
  getInputNotes(filter: NoteFilter): Promise<InputNoteRecord[]>;
  getInputNote(note_id: string): Promise<InputNoteRecord | undefined>;
  getOutputNotes(filter: NoteFilter): Promise<any>;
  getOutputNote(note_id: string): Promise<any>;
  compileNoteScript(script: string): NoteScript;
  getConsumableNotes(account_id?: AccountId | null): Promise<ConsumableNoteRecord[]>;
}
export class NetworkId {
  free(): void;
  constructor(string: string);
  static mainnet(): NetworkId;
  static testnet(): NetworkId;
  static devnet(): NetworkId;
  static tryFromStr(s: string): NetworkId;
  asStr(): string;
}
export class Note {
  free(): void;
  constructor(note_assets: NoteAssets, note_metadata: NoteMetadata, note_recipient: NoteRecipient);
  id(): NoteId;
  metadata(): NoteMetadata;
  recipient(): NoteRecipient;
  assets(): NoteAssets;
  static createP2IDNote(sender: AccountId, target: AccountId, assets: NoteAssets, note_type: NoteType, serial_num: Word, aux: Felt): Note;
  static createP2IDRNote(sender: AccountId, target: AccountId, assets: NoteAssets, note_type: NoteType, serial_num: Word, recall_height: number, aux: Felt): Note;
}
export class NoteAndArgs {
  free(): void;
  constructor(note: Note, args?: Word | null);
}
export class NoteAndArgsArray {
  free(): void;
  constructor(note_and_args?: NoteAndArgs[] | null);
  push(note_and_args: NoteAndArgs): void;
}
export class NoteAssets {
  free(): void;
  constructor(assets_array?: FungibleAsset[] | null);
  push(asset: FungibleAsset): void;
  fungibleAssets(): FungibleAsset[];
}
export class NoteConsumability {
  private constructor();
  free(): void;
  accountId(): AccountId;
  consumableAfterBlock(): number | undefined;
}
export class NoteDetails {
  free(): void;
  constructor(note_assets: NoteAssets, note_recipient: NoteRecipient);
  assets(): NoteAssets;
  recipient(): NoteRecipient;
}
export class NoteDetailsAndTag {
  free(): void;
  constructor(note_details: NoteDetails, tag: NoteTag);
}
export class NoteDetailsAndTagArray {
  free(): void;
  constructor(note_details_and_tag_array?: NoteDetailsAndTag[] | null);
  push(note_details_and_tag: NoteDetailsAndTag): void;
}
export class NoteDetailsArray {
  free(): void;
  constructor(note_details_array?: NoteDetails[] | null);
  push(note_details: NoteDetails): void;
}
export class NoteExecutionHint {
  private constructor();
  free(): void;
  static none(): NoteExecutionHint;
  static always(): NoteExecutionHint;
  static afterBlock(block_num: number): NoteExecutionHint;
  static onBlockSlot(epoch_len: number, slot_len: number, slot_offset: number): NoteExecutionHint;
  static fromParts(tag: number, payload: number): NoteExecutionHint;
  canBeConsumed(block_num: number): boolean;
}
export class NoteExecutionMode {
  private constructor();
  free(): void;
  static newLocal(): NoteExecutionMode;
  static newNetwork(): NoteExecutionMode;
  toString(): string;
}
export class NoteFilter {
  free(): void;
  constructor(note_type: NoteFilterTypes, note_ids?: NoteId[] | null);
}
export class NoteHeader {
  private constructor();
  free(): void;
  id(): NoteId;
  metadata(): NoteMetadata;
  commitment(): RpoDigest;
}
export class NoteId {
  free(): void;
  constructor(recipient_digest: RpoDigest, asset_commitment_digest: RpoDigest);
  toString(): string;
}
export class NoteIdAndArgs {
  free(): void;
  constructor(note_id: NoteId, args?: Word | null);
}
export class NoteIdAndArgsArray {
  free(): void;
  constructor(note_id_and_args?: NoteIdAndArgs[] | null);
  push(note_id_and_args: NoteIdAndArgs): void;
}
export class NoteInclusionProof {
  private constructor();
  free(): void;
  location(): NoteLocation;
  notePath(): MerklePath;
}
export class NoteInputs {
  free(): void;
  constructor(felt_array: FeltArray);
  values(): Felt[];
}
export class NoteLocation {
  private constructor();
  free(): void;
  blockNum(): number;
  nodeIndexInBlock(): number;
}
export class NoteMetadata {
  free(): void;
  constructor(sender: AccountId, note_type: NoteType, note_tag: NoteTag, note_execution_hint: NoteExecutionHint, aux?: Felt | null);
  sender(): AccountId;
  tag(): NoteTag;
  noteType(): NoteType;
}
export class NoteRecipient {
  free(): void;
  constructor(serial_num: Word, note_script: NoteScript, inputs: NoteInputs);
  digest(): RpoDigest;
  serialNum(): Word;
  script(): NoteScript;
  inputs(): NoteInputs;
}
export class NoteScript {
  private constructor();
  free(): void;
  static p2id(): NoteScript;
  static p2idr(): NoteScript;
  static swap(): NoteScript;
  root(): RpoDigest;
}
export class NoteTag {
  private constructor();
  free(): void;
  static fromAccountId(account_id: AccountId, execution: NoteExecutionMode): NoteTag;
  static forPublicUseCase(use_case_id: number, payload: number, execution: NoteExecutionMode): NoteTag;
  static forLocalUseCase(use_case_id: number, payload: number): NoteTag;
  isSingleTarget(): boolean;
  executionMode(): NoteExecutionMode;
}
export class NotesArray {
  free(): void;
  constructor(notes_array?: Note[] | null);
  push(note: Note): void;
}
export class OutputNote {
  private constructor();
  free(): void;
  static full(note: Note): OutputNote;
  static partial(partial_note: PartialNote): OutputNote;
  static header(note_header: NoteHeader): OutputNote;
  assets(): NoteAssets | undefined;
  id(): NoteId;
  recipientDigest(): RpoDigest | undefined;
  metadata(): NoteMetadata;
  shrink(): OutputNote;
  intoFull(): Note | undefined;
}
export class OutputNotes {
  private constructor();
  free(): void;
  commitment(): RpoDigest;
  numNotes(): number;
  isEmpty(): boolean;
  getNote(index: number): OutputNote;
  notes(): OutputNote[];
}
export class OutputNotesArray {
  free(): void;
  constructor(output_notes_array?: OutputNote[] | null);
  append(output_note: OutputNote): void;
}
export class PartialNote {
  private constructor();
  free(): void;
  id(): NoteId;
  metadata(): NoteMetadata;
  recipientDigest(): RpoDigest;
  assets(): NoteAssets;
}
export class RpoDigest {
  free(): void;
  constructor(value: Felt[]);
  toWord(): Word;
  toHex(): string;
}
export class SyncSummary {
  private constructor();
  free(): void;
  blockNum(): number;
  committedNotes(): NoteId[];
  consumedNotes(): NoteId[];
  updatedAccounts(): AccountId[];
  committedTransactions(): TransactionId[];
  serialize(): Uint8Array;
  static deserialize(bytes: Uint8Array): SyncSummary;
}
export class TransactionArgs {
  private constructor();
  free(): void;
  txScript(): TransactionScript | undefined;
  getNoteArgs(note_id: NoteId): Word | undefined;
  adviceInputs(): AdviceInputs;
}
export class TransactionFilter {
  private constructor();
  free(): void;
  static all(): TransactionFilter;
  static ids(ids: TransactionId[]): TransactionFilter;
  static uncommitted(): TransactionFilter;
}
export class TransactionId {
  private constructor();
  free(): void;
  asElements(): Felt[];
  asBytes(): Uint8Array;
  toHex(): string;
  inner(): RpoDigest;
}
export class TransactionProver {
  private constructor();
  free(): void;
  static newLocalProver(): TransactionProver;
  static newRemoteProver(endpoint: string): TransactionProver;
  serialize(): string;
  static deserialize(prover_type: string, endpoint?: string | null): TransactionProver;
  endpoint(): string | undefined;
}
export class TransactionRecord {
  private constructor();
  free(): void;
  id(): TransactionId;
  accountId(): AccountId;
  initAccountState(): RpoDigest;
  finalAccountState(): RpoDigest;
  inputNoteNullifiers(): RpoDigest[];
  outputNotes(): OutputNotes;
  blockNum(): number;
  transactionStatus(): TransactionStatus;
  serialize(): Uint8Array;
  static deserialize(bytes: Uint8Array): TransactionRecord;
}
export class TransactionRequest {
  private constructor();
  free(): void;
  serialize(): Uint8Array;
  static deserialize(bytes: Uint8Array): TransactionRequest;
}
export class TransactionRequestBuilder {
  free(): void;
  constructor();
  withUnauthenticatedInputNotes(notes: NoteAndArgsArray): TransactionRequestBuilder;
  withAuthenticatedInputNotes(notes: NoteIdAndArgsArray): TransactionRequestBuilder;
  withOwnOutputNotes(notes: OutputNotesArray): TransactionRequestBuilder;
  withCustomScript(script: TransactionScript): TransactionRequestBuilder;
  withExpectedOutputNotes(notes: NotesArray): TransactionRequestBuilder;
  withExpectedFutureNotes(note_details_and_tag: NoteDetailsAndTagArray): TransactionRequestBuilder;
  extendAdviceMap(advice_map: AdviceMap): TransactionRequestBuilder;
  build(): TransactionRequest;
}
export class TransactionResult {
  private constructor();
  free(): void;
  executedTransaction(): ExecutedTransaction;
  createdNotes(): OutputNotes;
  blockNum(): number;
  transactionArguments(): TransactionArgs;
  accountDelta(): AccountDelta;
  consumedNotes(): InputNotes;
  serialize(): Uint8Array;
  static deserialize(bytes: Uint8Array): TransactionResult;
}
export class TransactionScript {
  private constructor();
  free(): void;
  root(): RpoDigest;
  static compile(script_code: string, inputs: TransactionScriptInputPairArray, assembler: Assembler): TransactionScript;
}
export class TransactionScriptInputPair {
  free(): void;
  constructor(word: Word, felts: Felt[]);
  word(): Word;
  felts(): Felt[];
}
export class TransactionScriptInputPairArray {
  free(): void;
  constructor(transaction_script_input_pairs?: TransactionScriptInputPair[] | null);
  push(transaction_script_input_pair: TransactionScriptInputPair): void;
}
export class TransactionStatus {
  private constructor();
  free(): void;
  static pending(): TransactionStatus;
  static committed(block_num: number): TransactionStatus;
  static discarded(cause: string): TransactionStatus;
  isPending(): boolean;
  isCommitted(): boolean;
  isDiscarded(): boolean;
  getBlockNum(): number | undefined;
}
export class Word {
  private constructor();
  free(): void;
  static newFromU64s(u64_vec: BigUint64Array): Word;
  static newFromFelts(felt_vec: Felt[]): Word;
  toHex(): string;
}
