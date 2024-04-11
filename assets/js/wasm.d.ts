/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} chunk
* @returns {Uint8Array}
*/
export function chunk_hash(chunk: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} chunk_hash
* @returns {Uint8Array}
*/
export function chunk_id(chunk_hash: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} chunk
* @returns {number}
*/
export function chunk_len(chunk: Uint8Array): number;
/**
* @param {string} file_name
* @param {string} key
* @param {string} nonce
* @param {Uint8Array} chunks
* @returns {string}
*/
export function create_file_metadata(file_name: string, key: string, nonce: string, chunks: Uint8Array): string;
/**
* @param {Uint8Array} bytes
* @returns {string}
*/
export function base64_encode(bytes: Uint8Array): string;
/**
* @param {string} data
* @returns {Uint8Array}
*/
export function base64_decode(data: string): Uint8Array;
/**
* @param {Uint8Array} hash
* @param {Uint8Array} id
* @param {number} chunk_len
* @param {bigint} indice
* @returns {string}
*/
export function create_chunk_metadata(hash: Uint8Array, id: Uint8Array, chunk_len: number, indice: bigint): string;
/**
* @param {Uint8Array} chunk
* @param {string} chunk_meta
* @param {string} key
* @returns {string}
*/
export function encrypt_chunk(chunk: Uint8Array, chunk_meta: string, key: string): string;
/**
* @param {string} password
* @returns {string}
*/
export function create_encryption_key(password: string): string;
/**
* @returns {string}
*/
export function create_encryption_nonce(): string;
/**
* @param {string} encrypted_metadata
* @param {string} nonce
* @param {string} enc_key
* @returns {string}
*/
export function file_name(encrypted_metadata: string, nonce: string, enc_key: string): string;
/**
* @param {string} encrypted_metadata
* @param {string} nonce
* @param {string} enc_key
* @returns {string}
*/
export function file_type(encrypted_metadata: string, nonce: string, enc_key: string): string;
/**
* @param {string} encrypted_metadata
* @param {string} nonce
* @param {string} enc_key
* @returns {Uint8Array}
*/
export function file_chunks(encrypted_metadata: string, nonce: string, enc_key: string): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly chunk_hash: (a: number, b: number, c: number) => void;
  readonly chunk_id: (a: number, b: number, c: number) => void;
  readonly chunk_len: (a: number, b: number) => number;
  readonly create_file_metadata: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly base64_encode: (a: number, b: number, c: number) => void;
  readonly base64_decode: (a: number, b: number, c: number) => void;
  readonly create_chunk_metadata: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly encrypt_chunk: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly create_encryption_key: (a: number, b: number, c: number) => void;
  readonly create_encryption_nonce: (a: number) => void;
  readonly file_name: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly file_type: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly file_chunks: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rust_zstd_wasm_shim_qsort: (a: number, b: number, c: number, d: number) => void;
  readonly rust_zstd_wasm_shim_malloc: (a: number) => number;
  readonly rust_zstd_wasm_shim_memcmp: (a: number, b: number, c: number) => number;
  readonly rust_zstd_wasm_shim_calloc: (a: number, b: number) => number;
  readonly rust_zstd_wasm_shim_free: (a: number) => void;
  readonly rust_zstd_wasm_shim_memcpy: (a: number, b: number, c: number) => number;
  readonly rust_zstd_wasm_shim_memmove: (a: number, b: number, c: number) => number;
  readonly rust_zstd_wasm_shim_memset: (a: number, b: number, c: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
