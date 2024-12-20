/* tslint:disable */
/* eslint-disable */
export function generate_account_id(): bigint;
export function consume_note(transaction_script: string, sender_account_id: bigint, sender_account_code: string, receiver_account_code: string, receiver_secret_key: Uint8Array, receiver_account_id: bigint, receiver_assets: (AssetWrapper)[], receiver_wallet_enabled: boolean, receiver_auth_enabled: boolean, note_assets: (AssetWrapper)[], note_inputs: BigUint64Array, note_script: string): any;
export class AssetWrapper {
  free(): void;
  constructor(faucet_id: bigint, amount: bigint);
  faucet_id: bigint;
  amount: bigint;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_assetwrapper_free: (a: number, b: number) => void;
  readonly __wbg_get_assetwrapper_faucet_id: (a: number) => bigint;
  readonly __wbg_set_assetwrapper_faucet_id: (a: number, b: bigint) => void;
  readonly __wbg_get_assetwrapper_amount: (a: number) => bigint;
  readonly __wbg_set_assetwrapper_amount: (a: number, b: bigint) => void;
  readonly assetwrapper_new: (a: bigint, b: bigint) => number;
  readonly generate_account_id: () => bigint;
  readonly consume_note: (a: number, b: number, c: bigint, d: number, e: number, f: number, g: number, h: number, i: number, j: bigint, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number) => [number, number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
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
