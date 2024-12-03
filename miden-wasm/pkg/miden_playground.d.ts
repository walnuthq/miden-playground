/* tslint:disable */
/* eslint-disable */
/**
 * @param {string} account_code
 * @param {string} note_script
 * @param {BigUint64Array | undefined} note_inputs
 * @param {string} transaction_script
 * @param {bigint | undefined} asset
 * @param {boolean} wallet
 * @param {boolean} auth
 * @returns {Outputs}
 */
export function execute(account_code: string, note_script: string, note_inputs: BigUint64Array | undefined, transaction_script: string, asset: bigint | undefined, wallet: boolean, auth: boolean): Outputs;
export class Outputs {
  free(): void;
  account_code_commitment: string;
  account_delta_nonce: number;
  account_delta_storage: string;
  account_delta_vault: string;
  account_hash: string;
  account_storage_commitment: string;
  account_vault_commitment: string;
  cycle_count: number;
  trace_length: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_outputs_free: (a: number, b: number) => void;
  readonly __wbg_get_outputs_account_delta_storage: (a: number) => Array;
  readonly __wbg_set_outputs_account_delta_storage: (a: number, b: number, c: number) => void;
  readonly __wbg_get_outputs_account_delta_vault: (a: number) => Array;
  readonly __wbg_set_outputs_account_delta_vault: (a: number, b: number, c: number) => void;
  readonly __wbg_get_outputs_account_delta_nonce: (a: number) => number;
  readonly __wbg_set_outputs_account_delta_nonce: (a: number, b: number) => void;
  readonly __wbg_get_outputs_account_code_commitment: (a: number) => Array;
  readonly __wbg_set_outputs_account_code_commitment: (a: number, b: number, c: number) => void;
  readonly __wbg_get_outputs_account_storage_commitment: (a: number) => Array;
  readonly __wbg_set_outputs_account_storage_commitment: (a: number, b: number, c: number) => void;
  readonly __wbg_get_outputs_account_vault_commitment: (a: number) => Array;
  readonly __wbg_set_outputs_account_vault_commitment: (a: number, b: number, c: number) => void;
  readonly __wbg_get_outputs_account_hash: (a: number) => Array;
  readonly __wbg_set_outputs_account_hash: (a: number, b: number, c: number) => void;
  readonly __wbg_get_outputs_cycle_count: (a: number) => number;
  readonly __wbg_set_outputs_cycle_count: (a: number, b: number) => void;
  readonly __wbg_get_outputs_trace_length: (a: number) => number;
  readonly __wbg_set_outputs_trace_length: (a: number, b: number) => void;
  readonly execute: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => Array;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
