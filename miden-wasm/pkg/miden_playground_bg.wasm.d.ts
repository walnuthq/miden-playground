/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const generate_account_id: (a: number, b: number) => bigint;
export const generate_faucet_id: (a: number, b: number) => bigint;
export const execute_transaction: (a: number, b: number, c: number, d: number, e: number, f: bigint) => [number, number, number];
export const __wbg_createswapnoteresult_free: (a: number, b: number) => void;
export const createswapnoteresult_note_inputs: (a: number) => [number, number];
export const createswapnoteresult_payback_note: (a: number) => number;
export const create_swap_note: (a: number, b: number, c: bigint, d: number, e: bigint, f: number) => [number, number, number];
export const generate_note_serial_number: (a: number, b: number) => [number, number];
export const __wbg_wordwrapper_free: (a: number, b: number) => void;
export const wordwrapper_new: (a: number, b: number) => number;
export const __wbg_accountdata_free: (a: number, b: number) => void;
export const accountdata_new: (a: number, b: number, c: number, d: number, e: bigint, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number, number];
export const __wbg_assetdata_free: (a: number, b: number) => void;
export const __wbg_get_assetdata_faucet_id: (a: number) => bigint;
export const __wbg_set_assetdata_faucet_id: (a: number, b: bigint) => void;
export const __wbg_get_assetdata_amount: (a: number) => bigint;
export const __wbg_set_assetdata_amount: (a: number, b: bigint) => void;
export const assetdata_new: (a: bigint, b: bigint) => number;
export const __wbg_notedata_free: (a: number, b: number) => void;
export const notedata_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: bigint, h: number, i: number, j: number, k: number) => number;
export const notedata_inputs: (a: number) => [number, number];
export const notedata_script: (a: number) => [number, number];
export const notedata_sender_id: (a: number) => bigint;
export const notedata_sender_script: (a: number) => [number, number];
export const notedata_serial_number: (a: number) => [number, number];
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_export_2: WebAssembly.Table;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_start: () => void;
