/* tslint:disable */
/* eslint-disable */
export function generate_account_id(seed: Uint8Array): AccountIdData;
export function generate_faucet_id(seed: Uint8Array): AccountIdData;
export function generate_note_serial_number(seed: Uint8Array): BigUint64Array;
export function execute_transaction(transaction_script: string, receiver: AccountData, notes: (NoteData)[], block_number: bigint): any;
export function create_swap_note(seed: Uint8Array, sender_account_id: string, receiver_account_id: string, requested_asset: AssetData): CreateSwapNoteResult;
export function get_note_id(note: NoteData): string;
export function generate_note_tag(sender_account_id: string): number;
export class AccountData {
  free(): void;
  constructor(account_code: string, secret_key: Uint8Array, account_id: string, assets: (AssetData)[], wallet_enabled: boolean, auth_enabled: boolean, storage: (WordData)[], nonce: bigint);
}
export class AccountIdData {
  private constructor();
  free(): void;
  id: string;
  prefix: bigint;
  suffix: bigint;
}
export class AssetData {
  free(): void;
  constructor(faucet_id: string, amount: bigint);
  faucet_id: string;
  amount: bigint;
}
export class CreateSwapNoteResult {
  private constructor();
  free(): void;
  note_inputs(): BigUint64Array;
  payback_note(): NoteData;
}
export class NoteData {
  free(): void;
  constructor(assets: (AssetData)[], inputs: BigUint64Array, script: string, sender_id: string, sender_script: string, serial_number: BigUint64Array, tag: number, aux: bigint, id?: string);
  inputs(): BigUint64Array;
  script(): string;
  sender_id(): string;
  sender_script(): string;
  serial_number(): BigUint64Array;
  id(): string | undefined;
  tag(): number;
  aux(): bigint;
  recipient_digest(): string;
}
export class WordData {
  free(): void;
  constructor(word: BigUint64Array);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly generate_account_id: (a: number, b: number) => [number, number, number];
  readonly generate_faucet_id: (a: number, b: number) => [number, number, number];
  readonly generate_note_serial_number: (a: number, b: number) => [number, number, number, number];
  readonly execute_transaction: (a: number, b: number, c: number, d: number, e: number, f: bigint) => [number, number, number];
  readonly __wbg_createswapnoteresult_free: (a: number, b: number) => void;
  readonly createswapnoteresult_note_inputs: (a: number) => [number, number];
  readonly createswapnoteresult_payback_note: (a: number) => number;
  readonly create_swap_note: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
  readonly get_note_id: (a: number) => [number, number, number, number];
  readonly generate_note_tag: (a: number, b: number) => [number, number, number];
  readonly __wbg_accountiddata_free: (a: number, b: number) => void;
  readonly __wbg_get_accountiddata_id: (a: number) => [number, number];
  readonly __wbg_set_accountiddata_id: (a: number, b: number, c: number) => void;
  readonly __wbg_get_accountiddata_prefix: (a: number) => bigint;
  readonly __wbg_set_accountiddata_prefix: (a: number, b: bigint) => void;
  readonly __wbg_get_accountiddata_suffix: (a: number) => bigint;
  readonly __wbg_set_accountiddata_suffix: (a: number, b: bigint) => void;
  readonly __wbg_worddata_free: (a: number, b: number) => void;
  readonly worddata_new: (a: number, b: number) => [number, number, number];
  readonly __wbg_accountdata_free: (a: number, b: number) => void;
  readonly accountdata_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: bigint) => [number, number, number];
  readonly __wbg_assetdata_free: (a: number, b: number) => void;
  readonly __wbg_get_assetdata_faucet_id: (a: number) => [number, number];
  readonly __wbg_set_assetdata_faucet_id: (a: number, b: number, c: number) => void;
  readonly assetdata_new: (a: number, b: number, c: bigint) => number;
  readonly __wbg_notedata_free: (a: number, b: number) => void;
  readonly notedata_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: bigint, o: number, p: number) => number;
  readonly notedata_inputs: (a: number) => [number, number];
  readonly notedata_script: (a: number) => [number, number];
  readonly notedata_sender_id: (a: number) => [number, number];
  readonly notedata_sender_script: (a: number) => [number, number];
  readonly notedata_serial_number: (a: number) => [number, number];
  readonly notedata_id: (a: number) => [number, number];
  readonly notedata_tag: (a: number) => number;
  readonly notedata_aux: (a: number) => bigint;
  readonly notedata_recipient_digest: (a: number) => [number, number, number, number];
  readonly __wbg_get_assetdata_amount: (a: number) => bigint;
  readonly __wbg_set_assetdata_amount: (a: number, b: bigint) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
