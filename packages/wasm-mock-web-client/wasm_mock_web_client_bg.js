import { fetchAndCacheAccountAuthByPubKey, getAccountAssetVault, getAccountAuthByPubKey, getAccountCode, getAccountHeaderByCommitment, getAccountHeader, getAccountStorage, getForeignAccountCode, insertAccountAssetVault, insertAccountAuth, insertAccountCode, insertAccountRecord, insertAccountStorage, lockAccount, undoAccountStates, upsertForeignAccountCode } from './snippets/miden-client-e6bb2bd803c562cf/src/store/web_store/js/accounts.js';
import { getBlockHeaders, getPartialBlockchainNodes, getPartialBlockchainPeaksByBlockNum, insertBlockHeader, insertPartialBlockchainNodes } from './snippets/miden-client-e6bb2bd803c562cf/src/store/web_store/js/chainData.js';
import { getInputNotesFromIds, getInputNotesFromNullifiers, getInputNotes, getOutputNotesFromIds, getOutputNotesFromNullifiers, getOutputNotes, upsertInputNote, upsertOutputNote } from './snippets/miden-client-e6bb2bd803c562cf/src/store/web_store/js/notes.js';
import { addNoteTag, applyStateSync, removeNoteTag } from './snippets/miden-client-e6bb2bd803c562cf/src/store/web_store/js/sync.js';
import { getTransactions, insertTransactionScript, upsertTransactionRecord } from './snippets/miden-client-e6bb2bd803c562cf/src/store/web_store/js/transactions.js';

let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_5.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_5.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_7.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_7.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_5.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedBigUint64ArrayMemory0 = null;

function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.byteLength === 0) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

function passArray64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getBigUint64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}
function __wbg_adapter_52(arg0, arg1, arg2) {
    wasm.closure2267_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_641(arg0, arg1, arg2, arg3) {
    wasm.closure2289_externref_shim(arg0, arg1, arg2, arg3);
}

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
 */
export const InputNoteState = Object.freeze({
    Expected: 0, "0": "Expected",
    Unverified: 1, "1": "Unverified",
    Committed: 2, "2": "Committed",
    Invalid: 3, "3": "Invalid",
    ProcessingAuthenticated: 4, "4": "ProcessingAuthenticated",
    ProcessingUnauthenticated: 5, "5": "ProcessingUnauthenticated",
    ConsumedAuthenticatedLocal: 6, "6": "ConsumedAuthenticatedLocal",
    ConsumedUnauthenticatedLocal: 7, "7": "ConsumedUnauthenticatedLocal",
    ConsumedExternal: 8, "8": "ConsumedExternal",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
 */
export const NoteFilterTypes = Object.freeze({
    All: 0, "0": "All",
    Consumed: 1, "1": "Consumed",
    Committed: 2, "2": "Committed",
    Expected: 3, "3": "Expected",
    Processing: 4, "4": "Processing",
    List: 5, "5": "List",
    Unique: 6, "6": "Unique",
    Nullifiers: 7, "7": "Nullifiers",
    Unverified: 8, "8": "Unverified",
});
/**
 * @enum {2 | 3 | 1}
 */
export const NoteType = Object.freeze({
    /**
     * Notes with this type have only their hash published to the network.
     */
    Private: 2, "2": "Private",
    /**
     * Notes with this type are shared with the network encrypted.
     */
    Encrypted: 3, "3": "Encrypted",
    /**
     * Notes with this type are fully shared with the network.
     */
    Public: 1, "1": "Public",
});

const __wbindgen_enum_ReadableStreamType = ["bytes"];

const __wbindgen_enum_ReferrerPolicy = ["", "no-referrer", "no-referrer-when-downgrade", "origin", "origin-when-cross-origin", "unsafe-url", "same-origin", "strict-origin", "strict-origin-when-cross-origin"];

const __wbindgen_enum_RequestCache = ["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"];

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const __wbindgen_enum_RequestRedirect = ["follow", "error", "manual"];

const AccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_account_free(ptr >>> 0, 1));

export class Account {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Account.prototype);
        obj.__wbg_ptr = ptr;
        AccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_account_free(ptr, 0);
    }
    /**
     * @returns {AccountId}
     */
    id() {
        const ret = wasm.account_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.account_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {Felt}
     */
    nonce() {
        const ret = wasm.account_nonce(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * @returns {AssetVault}
     */
    vault() {
        const ret = wasm.account_vault(this.__wbg_ptr);
        return AssetVault.__wrap(ret);
    }
    /**
     * @returns {AccountStorage}
     */
    storage() {
        const ret = wasm.account_storage(this.__wbg_ptr);
        return AccountStorage.__wrap(ret);
    }
    /**
     * @returns {AccountCode}
     */
    code() {
        const ret = wasm.account_code(this.__wbg_ptr);
        return AccountCode.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    isFaucet() {
        const ret = wasm.account_isFaucet(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isRegularAccount() {
        const ret = wasm.account_isRegularAccount(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isUpdatable() {
        const ret = wasm.account_isUpdatable(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isPublic() {
        const ret = wasm.account_isPublic(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isNew() {
        const ret = wasm.account_isNew(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.account_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {Account}
     */
    static deserialize(bytes) {
        const ret = wasm.account_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Account.__wrap(ret[0]);
    }
}

const AccountCodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountcode_free(ptr >>> 0, 1));

export class AccountCode {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountCode.prototype);
        obj.__wbg_ptr = ptr;
        AccountCodeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountCodeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountcode_free(ptr, 0);
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.accountcode_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
}

const AccountDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountdelta_free(ptr >>> 0, 1));

export class AccountDelta {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountDelta.prototype);
        obj.__wbg_ptr = ptr;
        AccountDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountDeltaFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountdelta_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.accountdelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {AccountStorageDelta}
     */
    storage() {
        const ret = wasm.accountdelta_storage(this.__wbg_ptr);
        return AccountStorageDelta.__wrap(ret);
    }
    /**
     * @returns {AccountVaultDelta}
     */
    vault() {
        const ret = wasm.accountdelta_vault(this.__wbg_ptr);
        return AccountVaultDelta.__wrap(ret);
    }
    /**
     * @returns {Felt | undefined}
     */
    nonce() {
        const ret = wasm.accountdelta_nonce(this.__wbg_ptr);
        return ret === 0 ? undefined : Felt.__wrap(ret);
    }
}

const AccountHeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountheader_free(ptr >>> 0, 1));

export class AccountHeader {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountHeader.prototype);
        obj.__wbg_ptr = ptr;
        AccountHeaderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountHeaderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountheader_free(ptr, 0);
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.accountheader_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {AccountId}
     */
    id() {
        const ret = wasm.accountheader_id(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {Felt}
     */
    nonce() {
        const ret = wasm.accountheader_nonce(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    vaultCommitment() {
        const ret = wasm.accountheader_vaultCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    storageCommitment() {
        const ret = wasm.accountheader_storageCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    codeCommitment() {
        const ret = wasm.accountheader_codeCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
}

const AccountIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountid_free(ptr >>> 0, 1));

export class AccountId {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountId.prototype);
        obj.__wbg_ptr = ptr;
        AccountIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountIdFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountid_free(ptr, 0);
    }
    /**
     * @param {string} hex
     * @returns {AccountId}
     */
    static fromHex(hex) {
        const ptr0 = passStringToWasm0(hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountid_fromHex(ptr0, len0);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    isFaucet() {
        const ret = wasm.accountid_isFaucet(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isRegularAccount() {
        const ret = wasm.accountid_isRegularAccount(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.accountid_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Felt}
     */
    prefix() {
        const ret = wasm.accountid_prefix(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * @returns {Felt}
     */
    suffix() {
        const ret = wasm.accountid_suffix(this.__wbg_ptr);
        return Felt.__wrap(ret);
    }
    /**
     * @param {NetworkId} network_id
     * @returns {string}
     */
    toBech32(network_id) {
        let deferred2_0;
        let deferred2_1;
        try {
            _assertClass(network_id, NetworkId);
            var ptr0 = network_id.__destroy_into_raw();
            const ret = wasm.accountid_toBech32(this.__wbg_ptr, ptr0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}

const AccountStorageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstorage_free(ptr >>> 0, 1));

export class AccountStorage {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStorage.prototype);
        obj.__wbg_ptr = ptr;
        AccountStorageFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStorageFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstorage_free(ptr, 0);
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.accountstorage_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @param {number} index
     * @returns {RpoDigest | undefined}
     */
    getItem(index) {
        const ret = wasm.accountstorage_getItem(this.__wbg_ptr, index);
        return ret === 0 ? undefined : RpoDigest.__wrap(ret);
    }
}

const AccountStorageDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstoragedelta_free(ptr >>> 0, 1));

export class AccountStorageDelta {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStorageDelta.prototype);
        obj.__wbg_ptr = ptr;
        AccountStorageDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStorageDeltaFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstoragedelta_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.accountstoragedelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {Word[]}
     */
    values() {
        const ret = wasm.accountstoragedelta_values(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const AccountStorageModeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountstoragemode_free(ptr >>> 0, 1));

export class AccountStorageMode {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountStorageMode.prototype);
        obj.__wbg_ptr = ptr;
        AccountStorageModeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountStorageModeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountstoragemode_free(ptr, 0);
    }
    /**
     * @returns {AccountStorageMode}
     */
    static private() {
        const ret = wasm.accountstoragemode_private();
        return AccountStorageMode.__wrap(ret);
    }
    /**
     * @returns {AccountStorageMode}
     */
    static public() {
        const ret = wasm.accountstoragemode_public();
        return AccountStorageMode.__wrap(ret);
    }
    /**
     * @returns {AccountStorageMode}
     */
    static network() {
        const ret = wasm.accountstoragemode_network();
        return AccountStorageMode.__wrap(ret);
    }
    /**
     * @param {string} s
     * @returns {AccountStorageMode}
     */
    static tryFromStr(s) {
        const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.accountstoragemode_tryFromStr(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return AccountStorageMode.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    asStr() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.accountstoragemode_asStr(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const AccountVaultDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_accountvaultdelta_free(ptr >>> 0, 1));

export class AccountVaultDelta {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AccountVaultDelta.prototype);
        obj.__wbg_ptr = ptr;
        AccountVaultDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountVaultDeltaFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_accountvaultdelta_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.accountvaultdelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {FungibleAssetDelta}
     */
    fungible() {
        const ret = wasm.accountvaultdelta_fungible(this.__wbg_ptr);
        return FungibleAssetDelta.__wrap(ret);
    }
}

const AdviceInputsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_adviceinputs_free(ptr >>> 0, 1));

export class AdviceInputs {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AdviceInputs.prototype);
        obj.__wbg_ptr = ptr;
        AdviceInputsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AdviceInputsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_adviceinputs_free(ptr, 0);
    }
    /**
     * @returns {Felt[]}
     */
    stack() {
        const ret = wasm.adviceinputs_stack(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {RpoDigest} key
     * @returns {Felt[] | undefined}
     */
    mappedValues(key) {
        _assertClass(key, RpoDigest);
        const ret = wasm.adviceinputs_mappedValues(this.__wbg_ptr, key.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
}

const AdviceMapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_advicemap_free(ptr >>> 0, 1));

export class AdviceMap {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AdviceMapFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_advicemap_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.advicemap_new();
        this.__wbg_ptr = ret >>> 0;
        AdviceMapFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {RpoDigest} key
     * @param {FeltArray} value
     * @returns {Felt[] | undefined}
     */
    insert(key, value) {
        _assertClass(key, RpoDigest);
        _assertClass(value, FeltArray);
        const ret = wasm.advicemap_insert(this.__wbg_ptr, key.__wbg_ptr, value.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
}

const AssemblerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_assembler_free(ptr >>> 0, 1));

export class Assembler {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Assembler.prototype);
        obj.__wbg_ptr = ptr;
        AssemblerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AssemblerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_assembler_free(ptr, 0);
    }
    /**
     * @param {Library} library
     * @returns {Assembler}
     */
    withLibrary(library) {
        const ptr = this.__destroy_into_raw();
        _assertClass(library, Library);
        const ret = wasm.assembler_withLibrary(ptr, library.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Assembler.__wrap(ret[0]);
    }
    /**
     * @param {boolean} yes
     * @returns {Assembler}
     */
    withDebugMode(yes) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.assembler_withDebugMode(ptr, yes);
        return Assembler.__wrap(ret);
    }
    /**
     * @param {string} note_script
     * @returns {NoteScript}
     */
    compileNoteScript(note_script) {
        const ptr = this.__destroy_into_raw();
        const ptr0 = passStringToWasm0(note_script, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.assembler_compileNoteScript(ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteScript.__wrap(ret[0]);
    }
}

const AssemblerUtilsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_assemblerutils_free(ptr >>> 0, 1));

export class AssemblerUtils {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AssemblerUtilsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_assemblerutils_free(ptr, 0);
    }
    /**
     * @param {Assembler} assembler
     * @param {string} library_path
     * @param {string} source_code
     * @returns {Library}
     */
    static createAccountComponentLibrary(assembler, library_path, source_code) {
        _assertClass(assembler, Assembler);
        const ptr0 = passStringToWasm0(library_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(source_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.assemblerutils_createAccountComponentLibrary(assembler.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Library.__wrap(ret[0]);
    }
}

const AssetVaultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_assetvault_free(ptr >>> 0, 1));

export class AssetVault {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AssetVault.prototype);
        obj.__wbg_ptr = ptr;
        AssetVaultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AssetVaultFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_assetvault_free(ptr, 0);
    }
    /**
     * @returns {RpoDigest}
     */
    root() {
        const ret = wasm.accountheader_vaultCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @param {AccountId} faucet_id
     * @returns {bigint}
     */
    getBalance(faucet_id) {
        _assertClass(faucet_id, AccountId);
        const ret = wasm.assetvault_getBalance(this.__wbg_ptr, faucet_id.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {FungibleAsset[]}
     */
    fungibleAssets() {
        const ret = wasm.assetvault_fungibleAssets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const BlockHeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_blockheader_free(ptr >>> 0, 1));

export class BlockHeader {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BlockHeader.prototype);
        obj.__wbg_ptr = ptr;
        BlockHeaderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BlockHeaderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blockheader_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    version() {
        const ret = wasm.blockheader_version(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.blockheader_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    subCommitment() {
        const ret = wasm.blockheader_subCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    prevBlockCommitment() {
        const ret = wasm.blockheader_prevBlockCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.blockheader_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {RpoDigest}
     */
    chainCommitment() {
        const ret = wasm.blockheader_chainCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    accountRoot() {
        const ret = wasm.blockheader_accountRoot(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    nullifierRoot() {
        const ret = wasm.blockheader_nullifierRoot(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    noteRoot() {
        const ret = wasm.blockheader_noteRoot(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    txCommitment() {
        const ret = wasm.blockheader_txCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    txKernelCommitment() {
        const ret = wasm.blockheader_txKernelCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    proofCommitment() {
        const ret = wasm.blockheader_proofCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    timestamp() {
        const ret = wasm.blockheader_timestamp(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const ConsumableNoteRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_consumablenoterecord_free(ptr >>> 0, 1));

export class ConsumableNoteRecord {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ConsumableNoteRecord.prototype);
        obj.__wbg_ptr = ptr;
        ConsumableNoteRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ConsumableNoteRecordFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_consumablenoterecord_free(ptr, 0);
    }
    /**
     * @param {InputNoteRecord} input_note_record
     * @param {NoteConsumability[]} note_consumability
     */
    constructor(input_note_record, note_consumability) {
        _assertClass(input_note_record, InputNoteRecord);
        var ptr0 = input_note_record.__destroy_into_raw();
        const ptr1 = passArrayJsValueToWasm0(note_consumability, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.consumablenoterecord_new(ptr0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        ConsumableNoteRecordFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {InputNoteRecord}
     */
    inputNoteRecord() {
        const ret = wasm.consumablenoterecord_inputNoteRecord(this.__wbg_ptr);
        return InputNoteRecord.__wrap(ret);
    }
    /**
     * @returns {NoteConsumability[]}
     */
    noteConsumability() {
        const ret = wasm.consumablenoterecord_noteConsumability(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const ExecutedTransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_executedtransaction_free(ptr >>> 0, 1));

export class ExecutedTransaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExecutedTransaction.prototype);
        obj.__wbg_ptr = ptr;
        ExecutedTransactionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExecutedTransactionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_executedtransaction_free(ptr, 0);
    }
    /**
     * @returns {TransactionId}
     */
    id() {
        const ret = wasm.executedtransaction_id(this.__wbg_ptr);
        return TransactionId.__wrap(ret);
    }
    /**
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.executedtransaction_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {Account}
     */
    initialAccount() {
        const ret = wasm.executedtransaction_initialAccount(this.__wbg_ptr);
        return Account.__wrap(ret);
    }
    /**
     * @returns {AccountHeader}
     */
    finalAccount() {
        const ret = wasm.executedtransaction_finalAccount(this.__wbg_ptr);
        return AccountHeader.__wrap(ret);
    }
    /**
     * @returns {InputNotes}
     */
    inputNotes() {
        const ret = wasm.executedtransaction_inputNotes(this.__wbg_ptr);
        return InputNotes.__wrap(ret);
    }
    /**
     * @returns {OutputNotes}
     */
    outputNotes() {
        const ret = wasm.executedtransaction_outputNotes(this.__wbg_ptr);
        return OutputNotes.__wrap(ret);
    }
    /**
     * @returns {TransactionArgs}
     */
    txArgs() {
        const ret = wasm.executedtransaction_txArgs(this.__wbg_ptr);
        return TransactionArgs.__wrap(ret);
    }
    /**
     * @returns {BlockHeader}
     */
    blockHeader() {
        const ret = wasm.executedtransaction_blockHeader(this.__wbg_ptr);
        return BlockHeader.__wrap(ret);
    }
    /**
     * @returns {AccountDelta}
     */
    accountDelta() {
        const ret = wasm.executedtransaction_accountDelta(this.__wbg_ptr);
        return AccountDelta.__wrap(ret);
    }
}

const FeltFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_felt_free(ptr >>> 0, 1));

export class Felt {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Felt.prototype);
        obj.__wbg_ptr = ptr;
        FeltFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof Felt)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FeltFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_felt_free(ptr, 0);
    }
    /**
     * @param {bigint} value
     */
    constructor(value) {
        const ret = wasm.felt_new(value);
        this.__wbg_ptr = ret >>> 0;
        FeltFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {bigint}
     */
    asInt() {
        const ret = wasm.felt_asInt(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.felt_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const FeltArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_feltarray_free(ptr >>> 0, 1));

export class FeltArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FeltArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_feltarray_free(ptr, 0);
    }
    /**
     * @param {Felt[] | null} [felts_array]
     */
    constructor(felts_array) {
        var ptr0 = isLikeNone(felts_array) ? 0 : passArrayJsValueToWasm0(felts_array, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.feltarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        FeltArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Felt} felt
     */
    append(felt) {
        _assertClass(felt, Felt);
        wasm.feltarray_append(this.__wbg_ptr, felt.__wbg_ptr);
    }
}

const FlattenedU8VecFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_flattenedu8vec_free(ptr >>> 0, 1));

export class FlattenedU8Vec {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FlattenedU8Vec.prototype);
        obj.__wbg_ptr = ptr;
        FlattenedU8VecFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FlattenedU8VecFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_flattenedu8vec_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    data() {
        const ret = wasm.flattenedu8vec_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    lengths() {
        const ret = wasm.flattenedu8vec_lengths(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    num_inner_vecs() {
        const ret = wasm.flattenedu8vec_num_inner_vecs(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const FungibleAssetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fungibleasset_free(ptr >>> 0, 1));

export class FungibleAsset {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FungibleAsset.prototype);
        obj.__wbg_ptr = ptr;
        FungibleAssetFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof FungibleAsset)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FungibleAssetFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fungibleasset_free(ptr, 0);
    }
    /**
     * @param {AccountId} faucet_id
     * @param {bigint} amount
     */
    constructor(faucet_id, amount) {
        _assertClass(faucet_id, AccountId);
        const ret = wasm.fungibleasset_new(faucet_id.__wbg_ptr, amount);
        this.__wbg_ptr = ret >>> 0;
        FungibleAssetFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {AccountId}
     */
    faucetId() {
        const ret = wasm.fungibleasset_faucetId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {bigint}
     */
    amount() {
        const ret = wasm.fungibleasset_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {Word}
     */
    intoWord() {
        const ret = wasm.fungibleasset_intoWord(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
}

const FungibleAssetDeltaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fungibleassetdelta_free(ptr >>> 0, 1));

export class FungibleAssetDelta {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FungibleAssetDelta.prototype);
        obj.__wbg_ptr = ptr;
        FungibleAssetDeltaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FungibleAssetDeltaFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fungibleassetdelta_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    numAssets() {
        const ret = wasm.fungibleassetdelta_numAssets(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.fungibleassetdelta_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {FungibleAssetDeltaItem[]}
     */
    iter() {
        const ret = wasm.fungibleassetdelta_iter(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const FungibleAssetDeltaItemFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fungibleassetdeltaitem_free(ptr >>> 0, 1));

export class FungibleAssetDeltaItem {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FungibleAssetDeltaItem.prototype);
        obj.__wbg_ptr = ptr;
        FungibleAssetDeltaItemFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FungibleAssetDeltaItemFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fungibleassetdeltaitem_free(ptr, 0);
    }
    /**
     * @returns {AccountId}
     */
    get faucetId() {
        const ret = wasm.fungibleassetdeltaitem_faucetId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {bigint}
     */
    get amount() {
        const ret = wasm.fungibleassetdeltaitem_amount(this.__wbg_ptr);
        return ret;
    }
}

const InputNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inputnote_free(ptr >>> 0, 1));

export class InputNote {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(InputNote.prototype);
        obj.__wbg_ptr = ptr;
        InputNoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InputNoteFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputnote_free(ptr, 0);
    }
    /**
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.inputnote_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * @returns {Note}
     */
    note() {
        const ret = wasm.inputnote_note(this.__wbg_ptr);
        return Note.__wrap(ret);
    }
    /**
     * @returns {NoteInclusionProof | undefined}
     */
    proof() {
        const ret = wasm.inputnote_proof(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteInclusionProof.__wrap(ret);
    }
    /**
     * @returns {NoteLocation | undefined}
     */
    location() {
        const ret = wasm.inputnote_location(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteLocation.__wrap(ret);
    }
}

const InputNoteRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inputnoterecord_free(ptr >>> 0, 1));

export class InputNoteRecord {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(InputNoteRecord.prototype);
        obj.__wbg_ptr = ptr;
        InputNoteRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InputNoteRecordFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputnoterecord_free(ptr, 0);
    }
    /**
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.inputnoterecord_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * @returns {InputNoteState}
     */
    state() {
        const ret = wasm.inputnoterecord_state(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {NoteDetails}
     */
    details() {
        const ret = wasm.inputnoterecord_details(this.__wbg_ptr);
        return NoteDetails.__wrap(ret);
    }
    /**
     * @returns {NoteMetadata | undefined}
     */
    metadata() {
        const ret = wasm.inputnoterecord_metadata(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteMetadata.__wrap(ret);
    }
    /**
     * @returns {NoteInclusionProof | undefined}
     */
    inclusionProof() {
        const ret = wasm.inputnoterecord_inclusionProof(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteInclusionProof.__wrap(ret);
    }
    /**
     * @returns {string | undefined}
     */
    consumerTransactionId() {
        const ret = wasm.inputnoterecord_consumerTransactionId(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @returns {string}
     */
    nullifier() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.inputnoterecord_nullifier(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    isAuthenticated() {
        const ret = wasm.inputnoterecord_isAuthenticated(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isConsumed() {
        const ret = wasm.inputnoterecord_isConsumed(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isProcessing() {
        const ret = wasm.inputnoterecord_isProcessing(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.inputnoterecord_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {InputNoteRecord}
     */
    static deserialize(bytes) {
        const ret = wasm.inputnoterecord_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return InputNoteRecord.__wrap(ret[0]);
    }
}

const InputNotesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inputnotes_free(ptr >>> 0, 1));

export class InputNotes {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(InputNotes.prototype);
        obj.__wbg_ptr = ptr;
        InputNotesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InputNotesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inputnotes_free(ptr, 0);
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.inputnotes_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    numNotes() {
        const ret = wasm.inputnotes_numNotes(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.inputnotes_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {number} index
     * @returns {InputNote}
     */
    getNote(index) {
        const ret = wasm.inputnotes_getNote(this.__wbg_ptr, index);
        return InputNote.__wrap(ret);
    }
    /**
     * @returns {InputNote[]}
     */
    notes() {
        const ret = wasm.inputnotes_notes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const IntoUnderlyingByteSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1));

export class IntoUnderlyingByteSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingByteSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingbytesource_free(ptr, 0);
    }
    /**
     * @returns {ReadableStreamType}
     */
    get type() {
        const ret = wasm.intounderlyingbytesource_type(this.__wbg_ptr);
        return __wbindgen_enum_ReadableStreamType[ret];
    }
    /**
     * @returns {number}
     */
    get autoAllocateChunkSize() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {ReadableByteStreamController} controller
     */
    start(controller) {
        wasm.intounderlyingbytesource_start(this.__wbg_ptr, controller);
    }
    /**
     * @param {ReadableByteStreamController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, controller);
        return ret;
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingbytesource_cancel(ptr);
    }
}

const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));

export class IntoUnderlyingSink {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSinkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsink_free(ptr, 0);
    }
    /**
     * @param {any} chunk
     * @returns {Promise<any>}
     */
    write(chunk) {
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, chunk);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    close() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_close(ptr);
        return ret;
    }
    /**
     * @param {any} reason
     * @returns {Promise<any>}
     */
    abort(reason) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_abort(ptr, reason);
        return ret;
    }
}

const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));

export class IntoUnderlyingSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsource_free(ptr, 0);
    }
    /**
     * @param {ReadableStreamDefaultController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, controller);
        return ret;
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingsource_cancel(ptr);
    }
}

const LibraryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_library_free(ptr >>> 0, 1));

export class Library {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Library.prototype);
        obj.__wbg_ptr = ptr;
        LibraryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LibraryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_library_free(ptr, 0);
    }
}

const MerklePathFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_merklepath_free(ptr >>> 0, 1));

export class MerklePath {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(MerklePath.prototype);
        obj.__wbg_ptr = ptr;
        MerklePathFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MerklePathFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_merklepath_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    depth() {
        const ret = wasm.merklepath_depth(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {RpoDigest[]}
     */
    nodes() {
        const ret = wasm.merklepath_nodes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {bigint} index
     * @param {RpoDigest} node
     * @returns {RpoDigest}
     */
    computeRoot(index, node) {
        _assertClass(node, RpoDigest);
        const ret = wasm.merklepath_computeRoot(this.__wbg_ptr, index, node.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @param {bigint} index
     * @param {RpoDigest} node
     * @param {RpoDigest} root
     * @returns {boolean}
     */
    verify(index, node, root) {
        _assertClass(node, RpoDigest);
        _assertClass(root, RpoDigest);
        const ret = wasm.merklepath_verify(this.__wbg_ptr, index, node.__wbg_ptr, root.__wbg_ptr);
        return ret !== 0;
    }
}

const MockWebClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mockwebclient_free(ptr >>> 0, 1));

export class MockWebClient {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MockWebClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mockwebclient_free(ptr, 0);
    }
    /**
     * @param {AccountId} account_id
     * @param {TransactionRequest} transaction_request
     * @returns {Promise<TransactionResult>}
     */
    newTransaction(account_id, transaction_request) {
        _assertClass(account_id, AccountId);
        _assertClass(transaction_request, TransactionRequest);
        const ret = wasm.mockwebclient_newTransaction(this.__wbg_ptr, account_id.__wbg_ptr, transaction_request.__wbg_ptr);
        return ret;
    }
    /**
     * @param {TransactionResult} transaction_result
     * @param {TransactionProver | null} [prover]
     * @returns {Promise<void>}
     */
    submitTransaction(transaction_result, prover) {
        _assertClass(transaction_result, TransactionResult);
        let ptr0 = 0;
        if (!isLikeNone(prover)) {
            _assertClass(prover, TransactionProver);
            ptr0 = prover.__destroy_into_raw();
        }
        const ret = wasm.mockwebclient_submitTransaction(this.__wbg_ptr, transaction_result.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {AccountId} target_account_id
     * @param {AccountId} faucet_id
     * @param {NoteType} note_type
     * @param {bigint} amount
     * @returns {TransactionRequest}
     */
    newMintTransactionRequest(target_account_id, faucet_id, note_type, amount) {
        _assertClass(target_account_id, AccountId);
        _assertClass(faucet_id, AccountId);
        const ret = wasm.mockwebclient_newMintTransactionRequest(this.__wbg_ptr, target_account_id.__wbg_ptr, faucet_id.__wbg_ptr, note_type, amount);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    /**
     * @param {AccountId} sender_account_id
     * @param {AccountId} target_account_id
     * @param {AccountId} faucet_id
     * @param {NoteType} note_type
     * @param {bigint} amount
     * @param {number | null} [recall_height]
     * @returns {TransactionRequest}
     */
    newSendTransactionRequest(sender_account_id, target_account_id, faucet_id, note_type, amount, recall_height) {
        _assertClass(sender_account_id, AccountId);
        _assertClass(target_account_id, AccountId);
        _assertClass(faucet_id, AccountId);
        const ret = wasm.mockwebclient_newSendTransactionRequest(this.__wbg_ptr, sender_account_id.__wbg_ptr, target_account_id.__wbg_ptr, faucet_id.__wbg_ptr, note_type, amount, isLikeNone(recall_height) ? 0x100000001 : (recall_height) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    /**
     * @param {string[]} list_of_note_ids
     * @returns {TransactionRequest}
     */
    newConsumeTransactionRequest(list_of_note_ids) {
        const ptr0 = passArrayJsValueToWasm0(list_of_note_ids, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_newConsumeTransactionRequest(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
    constructor() {
        const ret = wasm.mockwebclient_new();
        this.__wbg_ptr = ret >>> 0;
        MockWebClientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string | null} [_node_url]
     * @param {Uint8Array | null} [seed]
     * @returns {Promise<any>}
     */
    createClient(_node_url, seed) {
        var ptr0 = isLikeNone(_node_url) ? 0 : passStringToWasm0(_node_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(seed) ? 0 : passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_createClient(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} note_id
     * @param {string} export_type
     * @returns {Promise<any>}
     */
    exportNote(note_id, export_type) {
        const ptr0 = passStringToWasm0(note_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(export_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_exportNote(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * Retrieves the entire underlying web store and returns it as a JsValue
     *
     * Meant to be used in conjunction with the force_import_store method
     * @returns {Promise<any>}
     */
    exportStore() {
        const ret = wasm.mockwebclient_exportStore(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {any} account_bytes
     * @returns {Promise<any>}
     */
    importAccount(account_bytes) {
        const ret = wasm.mockwebclient_importAccount(this.__wbg_ptr, account_bytes);
        return ret;
    }
    /**
     * @param {Uint8Array} init_seed
     * @param {boolean} mutable
     * @returns {Promise<Account>}
     */
    importPublicAccountFromSeed(init_seed, mutable) {
        const ptr0 = passArray8ToWasm0(init_seed, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_importPublicAccountFromSeed(this.__wbg_ptr, ptr0, len0, mutable);
        return ret;
    }
    /**
     * @param {AccountId} account_id
     * @returns {Promise<any>}
     */
    importAccountById(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.mockwebclient_importAccountById(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * @param {any} note_bytes
     * @returns {Promise<any>}
     */
    importNote(note_bytes) {
        const ret = wasm.mockwebclient_importNote(this.__wbg_ptr, note_bytes);
        return ret;
    }
    /**
     * @param {any} store_dump
     * @returns {Promise<any>}
     */
    forceImportStore(store_dump) {
        const ret = wasm.mockwebclient_forceImportStore(this.__wbg_ptr, store_dump);
        return ret;
    }
    /**
     * @param {TransactionFilter} transaction_filter
     * @returns {Promise<TransactionRecord[]>}
     */
    getTransactions(transaction_filter) {
        _assertClass(transaction_filter, TransactionFilter);
        var ptr0 = transaction_filter.__destroy_into_raw();
        const ret = wasm.mockwebclient_getTransactions(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {string} script
     * @returns {TransactionScript}
     */
    compileTxScript(script) {
        const ptr0 = passStringToWasm0(script, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_compileTxScript(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionScript.__wrap(ret[0]);
    }
    /**
     * @returns {Promise<AccountHeader[]>}
     */
    getAccounts() {
        const ret = wasm.mockwebclient_getAccounts(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {AccountId} account_id
     * @returns {Promise<Account | undefined>}
     */
    getAccount(account_id) {
        _assertClass(account_id, AccountId);
        const ret = wasm.mockwebclient_getAccount(this.__wbg_ptr, account_id.__wbg_ptr);
        return ret;
    }
    /**
     * @param {AccountStorageMode} storage_mode
     * @param {boolean} mutable
     * @param {Uint8Array | null} [init_seed]
     * @returns {Promise<Account>}
     */
    newWallet(storage_mode, mutable, init_seed) {
        _assertClass(storage_mode, AccountStorageMode);
        var ptr0 = isLikeNone(init_seed) ? 0 : passArray8ToWasm0(init_seed, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_newWallet(this.__wbg_ptr, storage_mode.__wbg_ptr, mutable, ptr0, len0);
        return ret;
    }
    /**
     * @param {AccountStorageMode} storage_mode
     * @param {boolean} non_fungible
     * @param {string} token_symbol
     * @param {number} decimals
     * @param {bigint} max_supply
     * @returns {Promise<Account>}
     */
    newFaucet(storage_mode, non_fungible, token_symbol, decimals, max_supply) {
        _assertClass(storage_mode, AccountStorageMode);
        const ptr0 = passStringToWasm0(token_symbol, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_newFaucet(this.__wbg_ptr, storage_mode.__wbg_ptr, non_fungible, ptr0, len0, decimals, max_supply);
        return ret;
    }
    /**
     * @param {Account} account
     * @param {Word | null | undefined} account_seed
     * @param {boolean} overwrite
     * @returns {Promise<void>}
     */
    newAccount(account, account_seed, overwrite) {
        _assertClass(account, Account);
        let ptr0 = 0;
        if (!isLikeNone(account_seed)) {
            _assertClass(account_seed, Word);
            ptr0 = account_seed.__destroy_into_raw();
        }
        const ret = wasm.mockwebclient_newAccount(this.__wbg_ptr, account.__wbg_ptr, ptr0, overwrite);
        return ret;
    }
    /**
     * @returns {Promise<SyncSummary>}
     */
    syncState() {
        const ret = wasm.mockwebclient_syncState(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<number>}
     */
    getSyncHeight() {
        const ret = wasm.mockwebclient_getSyncHeight(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<BlockHeader>}
     */
    getLatestEpochBlock() {
        const ret = wasm.mockwebclient_getLatestEpochBlock(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {NoteFilter} filter
     * @returns {Promise<InputNoteRecord[]>}
     */
    getInputNotes(filter) {
        _assertClass(filter, NoteFilter);
        var ptr0 = filter.__destroy_into_raw();
        const ret = wasm.mockwebclient_getInputNotes(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {string} note_id
     * @returns {Promise<InputNoteRecord | undefined>}
     */
    getInputNote(note_id) {
        const ptr0 = passStringToWasm0(note_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_getInputNote(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {NoteFilter} filter
     * @returns {Promise<any>}
     */
    getOutputNotes(filter) {
        _assertClass(filter, NoteFilter);
        var ptr0 = filter.__destroy_into_raw();
        const ret = wasm.mockwebclient_getOutputNotes(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {string} note_id
     * @returns {Promise<any>}
     */
    getOutputNote(note_id) {
        const ptr0 = passStringToWasm0(note_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_getOutputNote(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} script
     * @returns {NoteScript}
     */
    compileNoteScript(script) {
        const ptr0 = passStringToWasm0(script, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mockwebclient_compileNoteScript(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NoteScript.__wrap(ret[0]);
    }
    /**
     * @param {AccountId | null} [account_id]
     * @returns {Promise<ConsumableNoteRecord[]>}
     */
    getConsumableNotes(account_id) {
        let ptr0 = 0;
        if (!isLikeNone(account_id)) {
            _assertClass(account_id, AccountId);
            ptr0 = account_id.__destroy_into_raw();
        }
        const ret = wasm.mockwebclient_getConsumableNotes(this.__wbg_ptr, ptr0);
        return ret;
    }
}

const NetworkIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_networkid_free(ptr >>> 0, 1));

export class NetworkId {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NetworkId.prototype);
        obj.__wbg_ptr = ptr;
        NetworkIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NetworkIdFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_networkid_free(ptr, 0);
    }
    /**
     * @param {string} string
     */
    constructor(string) {
        const ptr0 = passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.networkid_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NetworkIdFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {NetworkId}
     */
    static mainnet() {
        const ret = wasm.networkid_mainnet();
        return NetworkId.__wrap(ret);
    }
    /**
     * @returns {NetworkId}
     */
    static testnet() {
        const ret = wasm.networkid_testnet();
        return NetworkId.__wrap(ret);
    }
    /**
     * @returns {NetworkId}
     */
    static devnet() {
        const ret = wasm.networkid_devnet();
        return NetworkId.__wrap(ret);
    }
    /**
     * @param {string} s
     * @returns {NetworkId}
     */
    static tryFromStr(s) {
        const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.networkid_tryFromStr(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NetworkId.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    asStr() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.networkid_asStr(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const NoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_note_free(ptr >>> 0, 1));

export class Note {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Note.prototype);
        obj.__wbg_ptr = ptr;
        NoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof Note)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_note_free(ptr, 0);
    }
    /**
     * @param {NoteAssets} note_assets
     * @param {NoteMetadata} note_metadata
     * @param {NoteRecipient} note_recipient
     */
    constructor(note_assets, note_metadata, note_recipient) {
        _assertClass(note_assets, NoteAssets);
        _assertClass(note_metadata, NoteMetadata);
        _assertClass(note_recipient, NoteRecipient);
        const ret = wasm.note_new(note_assets.__wbg_ptr, note_metadata.__wbg_ptr, note_recipient.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.note_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.note_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * @returns {NoteRecipient}
     */
    recipient() {
        const ret = wasm.note_recipient(this.__wbg_ptr);
        return NoteRecipient.__wrap(ret);
    }
    /**
     * @returns {NoteAssets}
     */
    assets() {
        const ret = wasm.note_assets(this.__wbg_ptr);
        return NoteAssets.__wrap(ret);
    }
    /**
     * @param {AccountId} sender
     * @param {AccountId} target
     * @param {NoteAssets} assets
     * @param {NoteType} note_type
     * @param {Word} serial_num
     * @param {Felt} aux
     * @returns {Note}
     */
    static createP2IDNote(sender, target, assets, note_type, serial_num, aux) {
        _assertClass(sender, AccountId);
        _assertClass(target, AccountId);
        _assertClass(assets, NoteAssets);
        _assertClass(serial_num, Word);
        _assertClass(aux, Felt);
        const ret = wasm.note_createP2IDNote(sender.__wbg_ptr, target.__wbg_ptr, assets.__wbg_ptr, note_type, serial_num.__wbg_ptr, aux.__wbg_ptr);
        return Note.__wrap(ret);
    }
    /**
     * @param {AccountId} sender
     * @param {AccountId} target
     * @param {NoteAssets} assets
     * @param {NoteType} note_type
     * @param {Word} serial_num
     * @param {number} recall_height
     * @param {Felt} aux
     * @returns {Note}
     */
    static createP2IDRNote(sender, target, assets, note_type, serial_num, recall_height, aux) {
        _assertClass(sender, AccountId);
        _assertClass(target, AccountId);
        _assertClass(assets, NoteAssets);
        _assertClass(serial_num, Word);
        _assertClass(aux, Felt);
        const ret = wasm.note_createP2IDRNote(sender.__wbg_ptr, target.__wbg_ptr, assets.__wbg_ptr, note_type, serial_num.__wbg_ptr, recall_height, aux.__wbg_ptr);
        return Note.__wrap(ret);
    }
}

const NoteAndArgsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteandargs_free(ptr >>> 0, 1));

export class NoteAndArgs {

    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteAndArgs)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAndArgsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteandargs_free(ptr, 0);
    }
    /**
     * @param {Note} note
     * @param {Word | null} [args]
     */
    constructor(note, args) {
        _assertClass(note, Note);
        var ptr0 = note.__destroy_into_raw();
        let ptr1 = 0;
        if (!isLikeNone(args)) {
            _assertClass(args, Word);
            ptr1 = args.__destroy_into_raw();
        }
        const ret = wasm.noteandargs_new(ptr0, ptr1);
        this.__wbg_ptr = ret >>> 0;
        NoteAndArgsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

const NoteAndArgsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteandargsarray_free(ptr >>> 0, 1));

export class NoteAndArgsArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAndArgsArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteandargsarray_free(ptr, 0);
    }
    /**
     * @param {NoteAndArgs[] | null} [note_and_args]
     */
    constructor(note_and_args) {
        var ptr0 = isLikeNone(note_and_args) ? 0 : passArrayJsValueToWasm0(note_and_args, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteandargsarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteAndArgsArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteAndArgs} note_and_args
     */
    push(note_and_args) {
        _assertClass(note_and_args, NoteAndArgs);
        wasm.noteandargsarray_push(this.__wbg_ptr, note_and_args.__wbg_ptr);
    }
}

const NoteAssetsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteassets_free(ptr >>> 0, 1));

export class NoteAssets {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteAssets.prototype);
        obj.__wbg_ptr = ptr;
        NoteAssetsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteAssetsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteassets_free(ptr, 0);
    }
    /**
     * @param {FungibleAsset[] | null} [assets_array]
     */
    constructor(assets_array) {
        var ptr0 = isLikeNone(assets_array) ? 0 : passArrayJsValueToWasm0(assets_array, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteassets_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteAssetsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {FungibleAsset} asset
     */
    push(asset) {
        _assertClass(asset, FungibleAsset);
        wasm.noteassets_push(this.__wbg_ptr, asset.__wbg_ptr);
    }
    /**
     * @returns {FungibleAsset[]}
     */
    fungibleAssets() {
        const ret = wasm.noteassets_fungibleAssets(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const NoteConsumabilityFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteconsumability_free(ptr >>> 0, 1));

export class NoteConsumability {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteConsumability.prototype);
        obj.__wbg_ptr = ptr;
        NoteConsumabilityFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteConsumability)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteConsumabilityFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteconsumability_free(ptr, 0);
    }
    /**
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.noteconsumability_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {number | undefined}
     */
    consumableAfterBlock() {
        const ret = wasm.noteconsumability_consumableAfterBlock(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
}

const NoteDetailsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notedetails_free(ptr >>> 0, 1));

export class NoteDetails {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteDetails.prototype);
        obj.__wbg_ptr = ptr;
        NoteDetailsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteDetails)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteDetailsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notedetails_free(ptr, 0);
    }
    /**
     * @param {NoteAssets} note_assets
     * @param {NoteRecipient} note_recipient
     */
    constructor(note_assets, note_recipient) {
        _assertClass(note_assets, NoteAssets);
        _assertClass(note_recipient, NoteRecipient);
        const ret = wasm.notedetails_new(note_assets.__wbg_ptr, note_recipient.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteDetailsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {NoteAssets}
     */
    assets() {
        const ret = wasm.notedetails_assets(this.__wbg_ptr);
        return NoteAssets.__wrap(ret);
    }
    /**
     * @returns {NoteRecipient}
     */
    recipient() {
        const ret = wasm.notedetails_recipient(this.__wbg_ptr);
        return NoteRecipient.__wrap(ret);
    }
}

const NoteDetailsAndTagFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notedetailsandtag_free(ptr >>> 0, 1));

export class NoteDetailsAndTag {

    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteDetailsAndTag)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteDetailsAndTagFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notedetailsandtag_free(ptr, 0);
    }
    /**
     * @param {NoteDetails} note_details
     * @param {NoteTag} tag
     */
    constructor(note_details, tag) {
        _assertClass(note_details, NoteDetails);
        var ptr0 = note_details.__destroy_into_raw();
        _assertClass(tag, NoteTag);
        var ptr1 = tag.__destroy_into_raw();
        const ret = wasm.notedetailsandtag_new(ptr0, ptr1);
        this.__wbg_ptr = ret >>> 0;
        NoteDetailsAndTagFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

const NoteDetailsAndTagArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notedetailsandtagarray_free(ptr >>> 0, 1));

export class NoteDetailsAndTagArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteDetailsAndTagArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notedetailsandtagarray_free(ptr, 0);
    }
    /**
     * @param {NoteDetailsAndTag[] | null} [note_details_and_tag_array]
     */
    constructor(note_details_and_tag_array) {
        var ptr0 = isLikeNone(note_details_and_tag_array) ? 0 : passArrayJsValueToWasm0(note_details_and_tag_array, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.notedetailsandtagarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteDetailsAndTagArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteDetailsAndTag} note_details_and_tag
     */
    push(note_details_and_tag) {
        _assertClass(note_details_and_tag, NoteDetailsAndTag);
        wasm.notedetailsandtagarray_push(this.__wbg_ptr, note_details_and_tag.__wbg_ptr);
    }
}

const NoteDetailsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notedetailsarray_free(ptr >>> 0, 1));

export class NoteDetailsArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteDetailsArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notedetailsarray_free(ptr, 0);
    }
    /**
     * @param {NoteDetails[] | null} [note_details_array]
     */
    constructor(note_details_array) {
        var ptr0 = isLikeNone(note_details_array) ? 0 : passArrayJsValueToWasm0(note_details_array, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.notedetailsarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteDetailsArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteDetails} note_details
     */
    push(note_details) {
        _assertClass(note_details, NoteDetails);
        wasm.notedetailsarray_push(this.__wbg_ptr, note_details.__wbg_ptr);
    }
}

const NoteExecutionHintFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteexecutionhint_free(ptr >>> 0, 1));

export class NoteExecutionHint {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteExecutionHint.prototype);
        obj.__wbg_ptr = ptr;
        NoteExecutionHintFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteExecutionHintFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteexecutionhint_free(ptr, 0);
    }
    /**
     * @returns {NoteExecutionHint}
     */
    static none() {
        const ret = wasm.noteexecutionhint_none();
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * @returns {NoteExecutionHint}
     */
    static always() {
        const ret = wasm.noteexecutionhint_always();
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * @param {number} block_num
     * @returns {NoteExecutionHint}
     */
    static afterBlock(block_num) {
        const ret = wasm.noteexecutionhint_afterBlock(block_num);
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * @param {number} epoch_len
     * @param {number} slot_len
     * @param {number} slot_offset
     * @returns {NoteExecutionHint}
     */
    static onBlockSlot(epoch_len, slot_len, slot_offset) {
        const ret = wasm.noteexecutionhint_onBlockSlot(epoch_len, slot_len, slot_offset);
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * @param {number} tag
     * @param {number} payload
     * @returns {NoteExecutionHint}
     */
    static fromParts(tag, payload) {
        const ret = wasm.noteexecutionhint_fromParts(tag, payload);
        return NoteExecutionHint.__wrap(ret);
    }
    /**
     * @param {number} block_num
     * @returns {boolean}
     */
    canBeConsumed(block_num) {
        const ret = wasm.noteexecutionhint_canBeConsumed(this.__wbg_ptr, block_num);
        return ret !== 0;
    }
}

const NoteExecutionModeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteexecutionmode_free(ptr >>> 0, 1));

export class NoteExecutionMode {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteExecutionMode.prototype);
        obj.__wbg_ptr = ptr;
        NoteExecutionModeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteExecutionModeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteexecutionmode_free(ptr, 0);
    }
    /**
     * @returns {NoteExecutionMode}
     */
    static newLocal() {
        const ret = wasm.noteexecutionmode_newLocal();
        return NoteExecutionMode.__wrap(ret);
    }
    /**
     * @returns {NoteExecutionMode}
     */
    static newNetwork() {
        const ret = wasm.noteexecutionmode_newNetwork();
        return NoteExecutionMode.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.noteexecutionmode_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const NoteFilterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notefilter_free(ptr >>> 0, 1));

export class NoteFilter {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteFilterFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notefilter_free(ptr, 0);
    }
    /**
     * @param {NoteFilterTypes} note_type
     * @param {NoteId[] | null} [note_ids]
     */
    constructor(note_type, note_ids) {
        var ptr0 = isLikeNone(note_ids) ? 0 : passArrayJsValueToWasm0(note_ids, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.notefilter_new(note_type, ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteFilterFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

const NoteHeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteheader_free(ptr >>> 0, 1));

export class NoteHeader {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteHeaderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteheader_free(ptr, 0);
    }
    /**
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.noteheader_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.noteheader_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.noteheader_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
}

const NoteIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteid_free(ptr >>> 0, 1));

export class NoteId {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteId.prototype);
        obj.__wbg_ptr = ptr;
        NoteIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteId)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteIdFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteid_free(ptr, 0);
    }
    /**
     * @param {RpoDigest} recipient_digest
     * @param {RpoDigest} asset_commitment_digest
     */
    constructor(recipient_digest, asset_commitment_digest) {
        _assertClass(recipient_digest, RpoDigest);
        _assertClass(asset_commitment_digest, RpoDigest);
        const ret = wasm.noteid_new(recipient_digest.__wbg_ptr, asset_commitment_digest.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteIdFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.noteid_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const NoteIdAndArgsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteidandargs_free(ptr >>> 0, 1));

export class NoteIdAndArgs {

    static __unwrap(jsValue) {
        if (!(jsValue instanceof NoteIdAndArgs)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteIdAndArgsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteidandargs_free(ptr, 0);
    }
    /**
     * @param {NoteId} note_id
     * @param {Word | null} [args]
     */
    constructor(note_id, args) {
        _assertClass(note_id, NoteId);
        var ptr0 = note_id.__destroy_into_raw();
        let ptr1 = 0;
        if (!isLikeNone(args)) {
            _assertClass(args, Word);
            ptr1 = args.__destroy_into_raw();
        }
        const ret = wasm.noteidandargs_new(ptr0, ptr1);
        this.__wbg_ptr = ret >>> 0;
        NoteIdAndArgsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

const NoteIdAndArgsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteidandargsarray_free(ptr >>> 0, 1));

export class NoteIdAndArgsArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteIdAndArgsArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteidandargsarray_free(ptr, 0);
    }
    /**
     * @param {NoteIdAndArgs[] | null} [note_id_and_args]
     */
    constructor(note_id_and_args) {
        var ptr0 = isLikeNone(note_id_and_args) ? 0 : passArrayJsValueToWasm0(note_id_and_args, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.noteidandargsarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteIdAndArgsArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteIdAndArgs} note_id_and_args
     */
    push(note_id_and_args) {
        _assertClass(note_id_and_args, NoteIdAndArgs);
        wasm.noteidandargsarray_push(this.__wbg_ptr, note_id_and_args.__wbg_ptr);
    }
}

const NoteInclusionProofFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteinclusionproof_free(ptr >>> 0, 1));

export class NoteInclusionProof {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteInclusionProof.prototype);
        obj.__wbg_ptr = ptr;
        NoteInclusionProofFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteInclusionProofFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteinclusionproof_free(ptr, 0);
    }
    /**
     * @returns {NoteLocation}
     */
    location() {
        const ret = wasm.noteinclusionproof_location(this.__wbg_ptr);
        return NoteLocation.__wrap(ret);
    }
    /**
     * @returns {MerklePath}
     */
    notePath() {
        const ret = wasm.noteinclusionproof_notePath(this.__wbg_ptr);
        return MerklePath.__wrap(ret);
    }
}

const NoteInputsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noteinputs_free(ptr >>> 0, 1));

export class NoteInputs {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteInputs.prototype);
        obj.__wbg_ptr = ptr;
        NoteInputsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteInputsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noteinputs_free(ptr, 0);
    }
    /**
     * @param {FeltArray} felt_array
     */
    constructor(felt_array) {
        _assertClass(felt_array, FeltArray);
        const ret = wasm.noteinputs_new(felt_array.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteInputsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Felt[]}
     */
    values() {
        const ret = wasm.noteinputs_values(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const NoteLocationFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notelocation_free(ptr >>> 0, 1));

export class NoteLocation {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteLocation.prototype);
        obj.__wbg_ptr = ptr;
        NoteLocationFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteLocationFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notelocation_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.notelocation_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    nodeIndexInBlock() {
        const ret = wasm.notelocation_nodeIndexInBlock(this.__wbg_ptr);
        return ret;
    }
}

const NoteMetadataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notemetadata_free(ptr >>> 0, 1));

export class NoteMetadata {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteMetadata.prototype);
        obj.__wbg_ptr = ptr;
        NoteMetadataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteMetadataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notemetadata_free(ptr, 0);
    }
    /**
     * @param {AccountId} sender
     * @param {NoteType} note_type
     * @param {NoteTag} note_tag
     * @param {NoteExecutionHint} note_execution_hint
     * @param {Felt | null} [aux]
     */
    constructor(sender, note_type, note_tag, note_execution_hint, aux) {
        _assertClass(sender, AccountId);
        _assertClass(note_tag, NoteTag);
        _assertClass(note_execution_hint, NoteExecutionHint);
        let ptr0 = 0;
        if (!isLikeNone(aux)) {
            _assertClass(aux, Felt);
            ptr0 = aux.__destroy_into_raw();
        }
        const ret = wasm.notemetadata_new(sender.__wbg_ptr, note_type, note_tag.__wbg_ptr, note_execution_hint.__wbg_ptr, ptr0);
        this.__wbg_ptr = ret >>> 0;
        NoteMetadataFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {AccountId}
     */
    sender() {
        const ret = wasm.notemetadata_sender(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {NoteTag}
     */
    tag() {
        const ret = wasm.notemetadata_tag(this.__wbg_ptr);
        return NoteTag.__wrap(ret);
    }
    /**
     * @returns {NoteType}
     */
    noteType() {
        const ret = wasm.notemetadata_noteType(this.__wbg_ptr);
        return ret;
    }
}

const NoteRecipientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noterecipient_free(ptr >>> 0, 1));

export class NoteRecipient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteRecipient.prototype);
        obj.__wbg_ptr = ptr;
        NoteRecipientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteRecipientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noterecipient_free(ptr, 0);
    }
    /**
     * @param {Word} serial_num
     * @param {NoteScript} note_script
     * @param {NoteInputs} inputs
     */
    constructor(serial_num, note_script, inputs) {
        _assertClass(serial_num, Word);
        _assertClass(note_script, NoteScript);
        _assertClass(inputs, NoteInputs);
        const ret = wasm.noterecipient_new(serial_num.__wbg_ptr, note_script.__wbg_ptr, inputs.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NoteRecipientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {RpoDigest}
     */
    digest() {
        const ret = wasm.noterecipient_digest(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {Word}
     */
    serialNum() {
        const ret = wasm.noterecipient_serialNum(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * @returns {NoteScript}
     */
    script() {
        const ret = wasm.noterecipient_script(this.__wbg_ptr);
        return NoteScript.__wrap(ret);
    }
    /**
     * @returns {NoteInputs}
     */
    inputs() {
        const ret = wasm.noterecipient_inputs(this.__wbg_ptr);
        return NoteInputs.__wrap(ret);
    }
}

const NoteScriptFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notescript_free(ptr >>> 0, 1));

export class NoteScript {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteScript.prototype);
        obj.__wbg_ptr = ptr;
        NoteScriptFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteScriptFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notescript_free(ptr, 0);
    }
    /**
     * @returns {NoteScript}
     */
    static p2id() {
        const ret = wasm.notescript_p2id();
        return NoteScript.__wrap(ret);
    }
    /**
     * @returns {NoteScript}
     */
    static p2idr() {
        const ret = wasm.notescript_p2idr();
        return NoteScript.__wrap(ret);
    }
    /**
     * @returns {NoteScript}
     */
    static swap() {
        const ret = wasm.notescript_swap();
        return NoteScript.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    root() {
        const ret = wasm.notescript_root(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
}

const NoteTagFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notetag_free(ptr >>> 0, 1));

export class NoteTag {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NoteTag.prototype);
        obj.__wbg_ptr = ptr;
        NoteTagFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteTagFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notetag_free(ptr, 0);
    }
    /**
     * @param {AccountId} account_id
     * @param {NoteExecutionMode} execution
     * @returns {NoteTag}
     */
    static fromAccountId(account_id, execution) {
        _assertClass(account_id, AccountId);
        _assertClass(execution, NoteExecutionMode);
        const ret = wasm.notetag_fromAccountId(account_id.__wbg_ptr, execution.__wbg_ptr);
        return NoteTag.__wrap(ret);
    }
    /**
     * @param {number} use_case_id
     * @param {number} payload
     * @param {NoteExecutionMode} execution
     * @returns {NoteTag}
     */
    static forPublicUseCase(use_case_id, payload, execution) {
        _assertClass(execution, NoteExecutionMode);
        const ret = wasm.notetag_forPublicUseCase(use_case_id, payload, execution.__wbg_ptr);
        return NoteTag.__wrap(ret);
    }
    /**
     * @param {number} use_case_id
     * @param {number} payload
     * @returns {NoteTag}
     */
    static forLocalUseCase(use_case_id, payload) {
        const ret = wasm.notetag_forLocalUseCase(use_case_id, payload);
        return NoteTag.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    isSingleTarget() {
        const ret = wasm.notetag_isSingleTarget(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {NoteExecutionMode}
     */
    executionMode() {
        const ret = wasm.notetag_executionMode(this.__wbg_ptr);
        return NoteExecutionMode.__wrap(ret);
    }
}

const NotesArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_notesarray_free(ptr >>> 0, 1));

export class NotesArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NotesArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_notesarray_free(ptr, 0);
    }
    /**
     * @param {Note[] | null} [notes_array]
     */
    constructor(notes_array) {
        var ptr0 = isLikeNone(notes_array) ? 0 : passArrayJsValueToWasm0(notes_array, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.notesarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NotesArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Note} note
     */
    push(note) {
        _assertClass(note, Note);
        wasm.notesarray_push(this.__wbg_ptr, note.__wbg_ptr);
    }
}

const OutputNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputnote_free(ptr >>> 0, 1));

export class OutputNote {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(OutputNote.prototype);
        obj.__wbg_ptr = ptr;
        OutputNoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof OutputNote)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputNoteFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputnote_free(ptr, 0);
    }
    /**
     * @param {Note} note
     * @returns {OutputNote}
     */
    static full(note) {
        _assertClass(note, Note);
        const ret = wasm.outputnote_full(note.__wbg_ptr);
        return OutputNote.__wrap(ret);
    }
    /**
     * @param {PartialNote} partial_note
     * @returns {OutputNote}
     */
    static partial(partial_note) {
        _assertClass(partial_note, PartialNote);
        const ret = wasm.outputnote_partial(partial_note.__wbg_ptr);
        return OutputNote.__wrap(ret);
    }
    /**
     * @param {NoteHeader} note_header
     * @returns {OutputNote}
     */
    static header(note_header) {
        _assertClass(note_header, NoteHeader);
        const ret = wasm.outputnote_header(note_header.__wbg_ptr);
        return OutputNote.__wrap(ret);
    }
    /**
     * @returns {NoteAssets | undefined}
     */
    assets() {
        const ret = wasm.outputnote_assets(this.__wbg_ptr);
        return ret === 0 ? undefined : NoteAssets.__wrap(ret);
    }
    /**
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.outputnote_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * @returns {RpoDigest | undefined}
     */
    recipientDigest() {
        const ret = wasm.outputnote_recipientDigest(this.__wbg_ptr);
        return ret === 0 ? undefined : RpoDigest.__wrap(ret);
    }
    /**
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.outputnote_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * @returns {OutputNote}
     */
    shrink() {
        const ret = wasm.outputnote_shrink(this.__wbg_ptr);
        return OutputNote.__wrap(ret);
    }
    /**
     * @returns {Note | undefined}
     */
    intoFull() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.outputnote_intoFull(ptr);
        return ret === 0 ? undefined : Note.__wrap(ret);
    }
}

const OutputNotesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputnotes_free(ptr >>> 0, 1));

export class OutputNotes {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(OutputNotes.prototype);
        obj.__wbg_ptr = ptr;
        OutputNotesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputNotesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputnotes_free(ptr, 0);
    }
    /**
     * @returns {RpoDigest}
     */
    commitment() {
        const ret = wasm.blockheader_prevBlockCommitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    numNotes() {
        const ret = wasm.outputnotes_numNotes(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.outputnotes_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {number} index
     * @returns {OutputNote}
     */
    getNote(index) {
        const ret = wasm.outputnotes_getNote(this.__wbg_ptr, index);
        return OutputNote.__wrap(ret);
    }
    /**
     * @returns {OutputNote[]}
     */
    notes() {
        const ret = wasm.outputnotes_notes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const OutputNotesArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputnotesarray_free(ptr >>> 0, 1));

export class OutputNotesArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputNotesArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputnotesarray_free(ptr, 0);
    }
    /**
     * @param {OutputNote[] | null} [output_notes_array]
     */
    constructor(output_notes_array) {
        var ptr0 = isLikeNone(output_notes_array) ? 0 : passArrayJsValueToWasm0(output_notes_array, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.outputnotesarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        OutputNotesArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {OutputNote} output_note
     */
    append(output_note) {
        _assertClass(output_note, OutputNote);
        wasm.outputnotesarray_append(this.__wbg_ptr, output_note.__wbg_ptr);
    }
}

const PartialNoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_partialnote_free(ptr >>> 0, 1));

export class PartialNote {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PartialNoteFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_partialnote_free(ptr, 0);
    }
    /**
     * @returns {NoteId}
     */
    id() {
        const ret = wasm.partialnote_id(this.__wbg_ptr);
        return NoteId.__wrap(ret);
    }
    /**
     * @returns {NoteMetadata}
     */
    metadata() {
        const ret = wasm.noteheader_metadata(this.__wbg_ptr);
        return NoteMetadata.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    recipientDigest() {
        const ret = wasm.partialnote_recipientDigest(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {NoteAssets}
     */
    assets() {
        const ret = wasm.partialnote_assets(this.__wbg_ptr);
        return NoteAssets.__wrap(ret);
    }
}

const RpoDigestFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rpodigest_free(ptr >>> 0, 1));

export class RpoDigest {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RpoDigest.prototype);
        obj.__wbg_ptr = ptr;
        RpoDigestFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RpoDigestFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rpodigest_free(ptr, 0);
    }
    /**
     * @param {Felt[]} value
     */
    constructor(value) {
        const ptr0 = passArrayJsValueToWasm0(value, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.rpodigest_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        RpoDigestFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Word}
     */
    toWord() {
        const ret = wasm.rpodigest_toWord(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    toHex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.rpodigest_toHex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const SyncSummaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_syncsummary_free(ptr >>> 0, 1));

export class SyncSummary {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SyncSummary.prototype);
        obj.__wbg_ptr = ptr;
        SyncSummaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SyncSummaryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_syncsummary_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.syncsummary_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {NoteId[]}
     */
    committedNotes() {
        const ret = wasm.syncsummary_committedNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {NoteId[]}
     */
    consumedNotes() {
        const ret = wasm.syncsummary_consumedNotes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {AccountId[]}
     */
    updatedAccounts() {
        const ret = wasm.syncsummary_updatedAccounts(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {TransactionId[]}
     */
    committedTransactions() {
        const ret = wasm.syncsummary_committedTransactions(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.syncsummary_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {SyncSummary}
     */
    static deserialize(bytes) {
        const ret = wasm.syncsummary_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return SyncSummary.__wrap(ret[0]);
    }
}

const TransactionArgsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionargs_free(ptr >>> 0, 1));

export class TransactionArgs {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionArgs.prototype);
        obj.__wbg_ptr = ptr;
        TransactionArgsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionArgsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionargs_free(ptr, 0);
    }
    /**
     * @returns {TransactionScript | undefined}
     */
    txScript() {
        const ret = wasm.transactionargs_txScript(this.__wbg_ptr);
        return ret === 0 ? undefined : TransactionScript.__wrap(ret);
    }
    /**
     * @param {NoteId} note_id
     * @returns {Word | undefined}
     */
    getNoteArgs(note_id) {
        _assertClass(note_id, NoteId);
        const ret = wasm.transactionargs_getNoteArgs(this.__wbg_ptr, note_id.__wbg_ptr);
        return ret === 0 ? undefined : Word.__wrap(ret);
    }
    /**
     * @returns {AdviceInputs}
     */
    adviceInputs() {
        const ret = wasm.transactionargs_adviceInputs(this.__wbg_ptr);
        return AdviceInputs.__wrap(ret);
    }
}

const TransactionFilterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionfilter_free(ptr >>> 0, 1));

export class TransactionFilter {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionFilter.prototype);
        obj.__wbg_ptr = ptr;
        TransactionFilterFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionFilterFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionfilter_free(ptr, 0);
    }
    /**
     * @returns {TransactionFilter}
     */
    static all() {
        const ret = wasm.transactionfilter_all();
        return TransactionFilter.__wrap(ret);
    }
    /**
     * @param {TransactionId[]} ids
     * @returns {TransactionFilter}
     */
    static ids(ids) {
        const ptr0 = passArrayJsValueToWasm0(ids, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionfilter_ids(ptr0, len0);
        return TransactionFilter.__wrap(ret);
    }
    /**
     * @returns {TransactionFilter}
     */
    static uncommitted() {
        const ret = wasm.transactionfilter_uncommitted();
        return TransactionFilter.__wrap(ret);
    }
}

const TransactionIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionid_free(ptr >>> 0, 1));

export class TransactionId {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionId.prototype);
        obj.__wbg_ptr = ptr;
        TransactionIdFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof TransactionId)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionIdFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionid_free(ptr, 0);
    }
    /**
     * @returns {Felt[]}
     */
    asElements() {
        const ret = wasm.transactionid_asElements(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    asBytes() {
        const ret = wasm.transactionid_asBytes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    toHex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.transactionid_toHex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {RpoDigest}
     */
    inner() {
        const ret = wasm.inputnotes_commitment(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
}

const TransactionProverFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionprover_free(ptr >>> 0, 1));

export class TransactionProver {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionProver.prototype);
        obj.__wbg_ptr = ptr;
        TransactionProverFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionProverFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionprover_free(ptr, 0);
    }
    /**
     * @returns {TransactionProver}
     */
    static newLocalProver() {
        const ret = wasm.transactionprover_newLocalProver();
        return TransactionProver.__wrap(ret);
    }
    /**
     * @param {string} endpoint
     * @returns {TransactionProver}
     */
    static newRemoteProver(endpoint) {
        const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionprover_newRemoteProver(ptr0, len0);
        return TransactionProver.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    serialize() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.transactionprover_serialize(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} prover_type
     * @param {string | null} [endpoint]
     * @returns {TransactionProver}
     */
    static deserialize(prover_type, endpoint) {
        const ptr0 = passStringToWasm0(prover_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(endpoint) ? 0 : passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.transactionprover_deserialize(ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionProver.__wrap(ret[0]);
    }
    /**
     * @returns {string | undefined}
     */
    endpoint() {
        const ret = wasm.transactionprover_endpoint(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
}

const TransactionRecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionrecord_free(ptr >>> 0, 1));

export class TransactionRecord {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionRecord.prototype);
        obj.__wbg_ptr = ptr;
        TransactionRecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionRecordFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionrecord_free(ptr, 0);
    }
    /**
     * @returns {TransactionId}
     */
    id() {
        const ret = wasm.transactionrecord_id(this.__wbg_ptr);
        return TransactionId.__wrap(ret);
    }
    /**
     * @returns {AccountId}
     */
    accountId() {
        const ret = wasm.transactionrecord_accountId(this.__wbg_ptr);
        return AccountId.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    initAccountState() {
        const ret = wasm.transactionrecord_initAccountState(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest}
     */
    finalAccountState() {
        const ret = wasm.transactionrecord_finalAccountState(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @returns {RpoDigest[]}
     */
    inputNoteNullifiers() {
        const ret = wasm.transactionrecord_inputNoteNullifiers(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {OutputNotes}
     */
    outputNotes() {
        const ret = wasm.transactionrecord_outputNotes(this.__wbg_ptr);
        return OutputNotes.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.transactionrecord_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {TransactionStatus}
     */
    transactionStatus() {
        const ret = wasm.transactionrecord_transactionStatus(this.__wbg_ptr);
        return TransactionStatus.__wrap(ret);
    }
    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.transactionrecord_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {TransactionRecord}
     */
    static deserialize(bytes) {
        const ret = wasm.transactionrecord_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRecord.__wrap(ret[0]);
    }
}

const TransactionRequestFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionrequest_free(ptr >>> 0, 1));

export class TransactionRequest {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionRequest.prototype);
        obj.__wbg_ptr = ptr;
        TransactionRequestFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionRequestFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionrequest_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.transactionrequest_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {TransactionRequest}
     */
    static deserialize(bytes) {
        const ret = wasm.transactionrequest_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionRequest.__wrap(ret[0]);
    }
}

const TransactionRequestBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionrequestbuilder_free(ptr >>> 0, 1));

export class TransactionRequestBuilder {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionRequestBuilder.prototype);
        obj.__wbg_ptr = ptr;
        TransactionRequestBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionRequestBuilderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionrequestbuilder_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.transactionrequestbuilder_new();
        this.__wbg_ptr = ret >>> 0;
        TransactionRequestBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NoteAndArgsArray} notes
     * @returns {TransactionRequestBuilder}
     */
    withUnauthenticatedInputNotes(notes) {
        const ptr = this.__destroy_into_raw();
        _assertClass(notes, NoteAndArgsArray);
        const ret = wasm.transactionrequestbuilder_withUnauthenticatedInputNotes(ptr, notes.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * @param {NoteIdAndArgsArray} notes
     * @returns {TransactionRequestBuilder}
     */
    withAuthenticatedInputNotes(notes) {
        const ptr = this.__destroy_into_raw();
        _assertClass(notes, NoteIdAndArgsArray);
        const ret = wasm.transactionrequestbuilder_withAuthenticatedInputNotes(ptr, notes.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * @param {OutputNotesArray} notes
     * @returns {TransactionRequestBuilder}
     */
    withOwnOutputNotes(notes) {
        const ptr = this.__destroy_into_raw();
        _assertClass(notes, OutputNotesArray);
        const ret = wasm.transactionrequestbuilder_withOwnOutputNotes(ptr, notes.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * @param {TransactionScript} script
     * @returns {TransactionRequestBuilder}
     */
    withCustomScript(script) {
        const ptr = this.__destroy_into_raw();
        _assertClass(script, TransactionScript);
        const ret = wasm.transactionrequestbuilder_withCustomScript(ptr, script.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * @param {NotesArray} notes
     * @returns {TransactionRequestBuilder}
     */
    withExpectedOutputNotes(notes) {
        const ptr = this.__destroy_into_raw();
        _assertClass(notes, NotesArray);
        const ret = wasm.transactionrequestbuilder_withExpectedOutputNotes(ptr, notes.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * @param {NoteDetailsAndTagArray} note_details_and_tag
     * @returns {TransactionRequestBuilder}
     */
    withExpectedFutureNotes(note_details_and_tag) {
        const ptr = this.__destroy_into_raw();
        _assertClass(note_details_and_tag, NoteDetailsAndTagArray);
        const ret = wasm.transactionrequestbuilder_withExpectedFutureNotes(ptr, note_details_and_tag.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * @param {AdviceMap} advice_map
     * @returns {TransactionRequestBuilder}
     */
    extendAdviceMap(advice_map) {
        const ptr = this.__destroy_into_raw();
        _assertClass(advice_map, AdviceMap);
        const ret = wasm.transactionrequestbuilder_extendAdviceMap(ptr, advice_map.__wbg_ptr);
        return TransactionRequestBuilder.__wrap(ret);
    }
    /**
     * @returns {TransactionRequest}
     */
    build() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.transactionrequestbuilder_build(ptr);
        return TransactionRequest.__wrap(ret);
    }
}

const TransactionResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionresult_free(ptr >>> 0, 1));

export class TransactionResult {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionResult.prototype);
        obj.__wbg_ptr = ptr;
        TransactionResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionResultFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionresult_free(ptr, 0);
    }
    /**
     * @returns {ExecutedTransaction}
     */
    executedTransaction() {
        const ret = wasm.transactionresult_executedTransaction(this.__wbg_ptr);
        return ExecutedTransaction.__wrap(ret);
    }
    /**
     * @returns {OutputNotes}
     */
    createdNotes() {
        const ret = wasm.transactionresult_createdNotes(this.__wbg_ptr);
        return OutputNotes.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    blockNum() {
        const ret = wasm.transactionresult_blockNum(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {TransactionArgs}
     */
    transactionArguments() {
        const ret = wasm.transactionresult_transactionArguments(this.__wbg_ptr);
        return TransactionArgs.__wrap(ret);
    }
    /**
     * @returns {AccountDelta}
     */
    accountDelta() {
        const ret = wasm.transactionresult_accountDelta(this.__wbg_ptr);
        return AccountDelta.__wrap(ret);
    }
    /**
     * @returns {InputNotes}
     */
    consumedNotes() {
        const ret = wasm.transactionresult_consumedNotes(this.__wbg_ptr);
        return InputNotes.__wrap(ret);
    }
    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const ret = wasm.transactionresult_serialize(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {TransactionResult}
     */
    static deserialize(bytes) {
        const ret = wasm.transactionresult_deserialize(bytes);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionResult.__wrap(ret[0]);
    }
}

const TransactionScriptFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionscript_free(ptr >>> 0, 1));

export class TransactionScript {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionScript.prototype);
        obj.__wbg_ptr = ptr;
        TransactionScriptFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionScriptFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionscript_free(ptr, 0);
    }
    /**
     * @returns {RpoDigest}
     */
    root() {
        const ret = wasm.transactionscript_root(this.__wbg_ptr);
        return RpoDigest.__wrap(ret);
    }
    /**
     * @param {string} script_code
     * @param {TransactionScriptInputPairArray} inputs
     * @param {Assembler} assembler
     * @returns {TransactionScript}
     */
    static compile(script_code, inputs, assembler) {
        const ptr0 = passStringToWasm0(script_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(inputs, TransactionScriptInputPairArray);
        var ptr1 = inputs.__destroy_into_raw();
        _assertClass(assembler, Assembler);
        const ret = wasm.transactionscript_compile(ptr0, len0, ptr1, assembler.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TransactionScript.__wrap(ret[0]);
    }
}

const TransactionScriptInputPairFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionscriptinputpair_free(ptr >>> 0, 1));

export class TransactionScriptInputPair {

    static __unwrap(jsValue) {
        if (!(jsValue instanceof TransactionScriptInputPair)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionScriptInputPairFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionscriptinputpair_free(ptr, 0);
    }
    /**
     * @param {Word} word
     * @param {Felt[]} felts
     */
    constructor(word, felts) {
        _assertClass(word, Word);
        var ptr0 = word.__destroy_into_raw();
        const ptr1 = passArrayJsValueToWasm0(felts, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.transactionscriptinputpair_new(ptr0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        TransactionScriptInputPairFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Word}
     */
    word() {
        const ret = wasm.rpodigest_toWord(this.__wbg_ptr);
        return Word.__wrap(ret);
    }
    /**
     * @returns {Felt[]}
     */
    felts() {
        const ret = wasm.transactionscriptinputpair_felts(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const TransactionScriptInputPairArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionscriptinputpairarray_free(ptr >>> 0, 1));

export class TransactionScriptInputPairArray {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionScriptInputPairArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionscriptinputpairarray_free(ptr, 0);
    }
    /**
     * @param {TransactionScriptInputPair[] | null} [transaction_script_input_pairs]
     */
    constructor(transaction_script_input_pairs) {
        var ptr0 = isLikeNone(transaction_script_input_pairs) ? 0 : passArrayJsValueToWasm0(transaction_script_input_pairs, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionscriptinputpairarray_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        TransactionScriptInputPairArrayFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {TransactionScriptInputPair} transaction_script_input_pair
     */
    push(transaction_script_input_pair) {
        _assertClass(transaction_script_input_pair, TransactionScriptInputPair);
        wasm.transactionscriptinputpairarray_push(this.__wbg_ptr, transaction_script_input_pair.__wbg_ptr);
    }
}

const TransactionStatusFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionstatus_free(ptr >>> 0, 1));

export class TransactionStatus {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionStatus.prototype);
        obj.__wbg_ptr = ptr;
        TransactionStatusFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionStatusFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionstatus_free(ptr, 0);
    }
    /**
     * @returns {TransactionStatus}
     */
    static pending() {
        const ret = wasm.transactionstatus_pending();
        return TransactionStatus.__wrap(ret);
    }
    /**
     * @param {number} block_num
     * @returns {TransactionStatus}
     */
    static committed(block_num) {
        const ret = wasm.transactionstatus_committed(block_num);
        return TransactionStatus.__wrap(ret);
    }
    /**
     * @param {string} cause
     * @returns {TransactionStatus}
     */
    static discarded(cause) {
        const ptr0 = passStringToWasm0(cause, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionstatus_discarded(ptr0, len0);
        return TransactionStatus.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    isPending() {
        const ret = wasm.transactionstatus_isPending(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isCommitted() {
        const ret = wasm.transactionstatus_isCommitted(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isDiscarded() {
        const ret = wasm.transactionstatus_isDiscarded(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number | undefined}
     */
    getBlockNum() {
        const ret = wasm.transactionstatus_getBlockNum(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
}

const WordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_word_free(ptr >>> 0, 1));

export class Word {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Word.prototype);
        obj.__wbg_ptr = ptr;
        WordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WordFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_word_free(ptr, 0);
    }
    /**
     * @param {BigUint64Array} u64_vec
     * @returns {Word}
     */
    static newFromU64s(u64_vec) {
        const ptr0 = passArray64ToWasm0(u64_vec, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.word_newFromU64s(ptr0, len0);
        return Word.__wrap(ret);
    }
    /**
     * @param {Felt[]} felt_vec
     * @returns {Word}
     */
    static newFromFelts(felt_vec) {
        const ptr0 = passArrayJsValueToWasm0(felt_vec, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.word_newFromFelts(ptr0, len0);
        return Word.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    toHex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.word_toHex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

export function __wbg_String_8f0eb39a4a4c2f66(arg0, arg1) {
    const ret = String(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_account_new(arg0) {
    const ret = Account.__wrap(arg0);
    return ret;
};

export function __wbg_accountheader_new(arg0) {
    const ret = AccountHeader.__wrap(arg0);
    return ret;
};

export function __wbg_accountid_new(arg0) {
    const ret = AccountId.__wrap(arg0);
    return ret;
};

export function __wbg_addNoteTag_ba59bfbc7c953f04(arg0, arg1, arg2, arg3, arg4, arg5) {
    var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 1, 1);
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
    }
    let v2;
    if (arg4 !== 0) {
        v2 = getStringFromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1, 1);
    }
    const ret = addNoteTag(v0, v1, v2);
    return ret;
};

export function __wbg_append_8c7dd8d641a5f01b() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_applyStateSync_ec922f60d48e28f5(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayJsValueFromWasm0(arg3, arg4).slice();
        wasm.__wbindgen_free(arg3, arg4 * 4, 4);
        var v2 = getArrayU8FromWasm0(arg6, arg7).slice();
        wasm.__wbindgen_free(arg6, arg7 * 1, 1);
        var v3 = getArrayJsValueFromWasm0(arg8, arg9).slice();
        wasm.__wbindgen_free(arg8, arg9 * 4, 4);
        var v4 = getArrayJsValueFromWasm0(arg10, arg11).slice();
        wasm.__wbindgen_free(arg10, arg11 * 4, 4);
        var v5 = getArrayJsValueFromWasm0(arg12, arg13).slice();
        wasm.__wbindgen_free(arg12, arg13 * 4, 4);
        const ret = applyStateSync(getStringFromWasm0(arg0, arg1), FlattenedU8Vec.__wrap(arg2), v1, FlattenedU8Vec.__wrap(arg5), v2, v3, v4, v5);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_blockheader_new(arg0) {
    const ret = BlockHeader.__wrap(arg0);
    return ret;
};

export function __wbg_body_0b8fd1fe671660df(arg0) {
    const ret = arg0.body;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_buffer_09165b52af8c5237(arg0) {
    const ret = arg0.buffer;
    return ret;
};

export function __wbg_buffer_609cc3eee51ed158(arg0) {
    const ret = arg0.buffer;
    return ret;
};

export function __wbg_byobRequest_77d9adf63337edfb(arg0) {
    const ret = arg0.byobRequest;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_byteLength_e674b853d9c77e1d(arg0) {
    const ret = arg0.byteLength;
    return ret;
};

export function __wbg_byteOffset_fd862df290ef848d(arg0) {
    const ret = arg0.byteOffset;
    return ret;
};

export function __wbg_call_672a4d21634d4a24() { return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
}, arguments) };

export function __wbg_call_7cccdd69e0791ae2() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_cancel_8a308660caa6cadf(arg0) {
    const ret = arg0.cancel();
    return ret;
};

export function __wbg_catch_a6e601879b2610e9(arg0, arg1) {
    const ret = arg0.catch(arg1);
    return ret;
};

export function __wbg_close_304cc1fef3466669() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_close_5ce03e29be453811() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_consumablenoterecord_new(arg0) {
    const ret = ConsumableNoteRecord.__wrap(arg0);
    return ret;
};

export function __wbg_done_769e5ede4b31c67b(arg0) {
    const ret = arg0.done;
    return ret;
};

export function __wbg_enqueue_bb16ba72f537dc9e() { return handleError(function (arg0, arg1) {
    arg0.enqueue(arg1);
}, arguments) };

export function __wbg_error_7534b8e9a36f1ab4(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_felt_new(arg0) {
    const ret = Felt.__wrap(arg0);
    return ret;
};

export function __wbg_felt_unwrap(arg0) {
    const ret = Felt.__unwrap(arg0);
    return ret;
};

export function __wbg_fetchAndCacheAccountAuthByPubKey_c33a4eea3bcfba37(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = fetchAndCacheAccountAuthByPubKey(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_fetch_07cd86dd296a5a63(arg0, arg1, arg2) {
    const ret = arg0.fetch(arg1, arg2);
    return ret;
};

export function __wbg_fetch_769f3df592e37b75(arg0, arg1) {
    const ret = fetch(arg0, arg1);
    return ret;
};

export function __wbg_fungibleasset_new(arg0) {
    const ret = FungibleAsset.__wrap(arg0);
    return ret;
};

export function __wbg_fungibleasset_unwrap(arg0) {
    const ret = FungibleAsset.__unwrap(arg0);
    return ret;
};

export function __wbg_fungibleassetdeltaitem_new(arg0) {
    const ret = FungibleAssetDeltaItem.__wrap(arg0);
    return ret;
};

export function __wbg_getAccountAssetVault_e7c63da67dfaf463(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getAccountAssetVault(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_getAccountAuthByPubKey_e9fea3fdd279fba0(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getAccountAuthByPubKey(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_getAccountCode_f6ed578eb01dc638(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getAccountCode(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_getAccountHeaderByCommitment_51bbceb85df7271b(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getAccountHeaderByCommitment(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_getAccountHeader_829c4a8c72177675(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getAccountHeader(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_getAccountStorage_55aed73fa01c14d6(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getAccountStorage(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_getBlockHeaders_5ae44bd05088f8c4(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = getBlockHeaders(v0);
    return ret;
};

export function __wbg_getForeignAccountCode_e8739ea1ecdc1623(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = getForeignAccountCode(v0);
    return ret;
};

export function __wbg_getInputNotesFromIds_5c24812a2e86f472(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = getInputNotesFromIds(v0);
    return ret;
};

export function __wbg_getInputNotesFromNullifiers_d8375a5c3b8ddd08(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = getInputNotesFromNullifiers(v0);
    return ret;
};

export function __wbg_getInputNotes_777edff0b5c6f8cb(arg0, arg1) {
    var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 1, 1);
    const ret = getInputNotes(v0);
    return ret;
};

export function __wbg_getOutputNotesFromIds_989d83d6a780d5ca(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = getOutputNotesFromIds(v0);
    return ret;
};

export function __wbg_getOutputNotesFromNullifiers_da3c7e0ea658145e(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = getOutputNotesFromNullifiers(v0);
    return ret;
};

export function __wbg_getOutputNotes_058c23a89aca2306(arg0, arg1) {
    var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 1, 1);
    const ret = getOutputNotes(v0);
    return ret;
};

export function __wbg_getPartialBlockchainNodes_ba82d1c12407ac1f(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = getPartialBlockchainNodes(v0);
    return ret;
};

export function __wbg_getPartialBlockchainPeaksByBlockNum_a4bb6bcc764771d5(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getPartialBlockchainPeaksByBlockNum(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_getRandomValues_3c9c0d586e575a16() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments) };

export function __wbg_getReader_48e00749fe3f6089() { return handleError(function (arg0) {
    const ret = arg0.getReader();
    return ret;
}, arguments) };

export function __wbg_getTime_46267b1c24877e30(arg0) {
    const ret = arg0.getTime();
    return ret;
};

export function __wbg_getTransactions_dc8d84a7eff23321(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = getTransactions(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_get_67b2ba62fc30de12() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_get_b9b93047fe3cf45b(arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
};

export function __wbg_getdone_d47073731acd3e74(arg0) {
    const ret = arg0.done;
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
};

export function __wbg_getvalue_009dcd63692bee1f(arg0) {
    const ret = arg0.value;
    return ret;
};

export function __wbg_getwithrefkey_1dc361bd10053bfe(arg0, arg1) {
    const ret = arg0[arg1];
    return ret;
};

export function __wbg_has_a5ea9117f258a0ec() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_headers_9cb51cfd2ac780a4(arg0) {
    const ret = arg0.headers;
    return ret;
};

export function __wbg_inputnote_new(arg0) {
    const ret = InputNote.__wrap(arg0);
    return ret;
};

export function __wbg_inputnoterecord_new(arg0) {
    const ret = InputNoteRecord.__wrap(arg0);
    return ret;
};

export function __wbg_insertAccountAssetVault_b954dbc585ea0cff(arg0, arg1, arg2, arg3) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        const ret = insertAccountAssetVault(getStringFromWasm0(arg0, arg1), v1);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_insertAccountAuth_397880d915f1361c(arg0, arg1, arg2, arg3) {
    let deferred0_0;
    let deferred0_1;
    let deferred1_0;
    let deferred1_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        deferred1_0 = arg2;
        deferred1_1 = arg3;
        const ret = insertAccountAuth(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
};

export function __wbg_insertAccountCode_3b86a12c6e12db71(arg0, arg1, arg2, arg3) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        const ret = insertAccountCode(getStringFromWasm0(arg0, arg1), v1);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_insertAccountRecord_67922c8005baa972(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
    let deferred0_0;
    let deferred0_1;
    let deferred1_0;
    let deferred1_1;
    let deferred2_0;
    let deferred2_1;
    let deferred3_0;
    let deferred3_1;
    let deferred4_0;
    let deferred4_1;
    let deferred6_0;
    let deferred6_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        deferred1_0 = arg2;
        deferred1_1 = arg3;
        deferred2_0 = arg4;
        deferred2_1 = arg5;
        deferred3_0 = arg6;
        deferred3_1 = arg7;
        deferred4_0 = arg8;
        deferred4_1 = arg9;
        let v5;
        if (arg11 !== 0) {
            v5 = getArrayU8FromWasm0(arg11, arg12).slice();
            wasm.__wbindgen_free(arg11, arg12 * 1, 1);
        }
        deferred6_0 = arg13;
        deferred6_1 = arg14;
        const ret = insertAccountRecord(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7), getStringFromWasm0(arg8, arg9), arg10 !== 0, v5, getStringFromWasm0(arg13, arg14));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
    }
};

export function __wbg_insertAccountStorage_5c68b2cb205317fc(arg0, arg1, arg2, arg3) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        const ret = insertAccountStorage(getStringFromWasm0(arg0, arg1), v1);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_insertBlockHeader_4c5f07b54e23214f(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        var v2 = getArrayU8FromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1, 1);
        const ret = insertBlockHeader(getStringFromWasm0(arg0, arg1), v1, v2, arg6 !== 0);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_insertPartialBlockchainNodes_828ac602df03ac83(arg0, arg1, arg2, arg3) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    var v1 = getArrayJsValueFromWasm0(arg2, arg3).slice();
    wasm.__wbindgen_free(arg2, arg3 * 4, 4);
    const ret = insertPartialBlockchainNodes(v0, v1);
    return ret;
};

export function __wbg_insertTransactionScript_e5062490ff6e1d60(arg0, arg1, arg2, arg3) {
    var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 1, 1);
    let v1;
    if (arg2 !== 0) {
        v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
    }
    const ret = insertTransactionScript(v0, v1);
    return ret;
};

export function __wbg_instanceof_ArrayBuffer_e14585432e3737fc(arg0) {
    let result;
    try {
        result = arg0 instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Uint8Array_17156bcf118086a9(arg0) {
    let result;
    try {
        result = arg0 instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_isArray_a1eab7e0d067391b(arg0) {
    const ret = Array.isArray(arg0);
    return ret;
};

export function __wbg_isSafeInteger_343e2beeeece1bb0(arg0) {
    const ret = Number.isSafeInteger(arg0);
    return ret;
};

export function __wbg_iterator_9a24c88df860dc65() {
    const ret = Symbol.iterator;
    return ret;
};

export function __wbg_length_a446193dc22c12f8(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_length_e2d2a49132c1b256(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_lockAccount_4eea03c1a3bec248(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        const ret = lockAccount(getStringFromWasm0(arg0, arg1));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_log_c222819a41e063d3(arg0) {
    console.log(arg0);
};

export function __wbg_new0_f788a2397c7ca929() {
    const ret = new Date();
    return ret;
};

export function __wbg_new_018dcc2d6c8c2f6a() { return handleError(function () {
    const ret = new Headers();
    return ret;
}, arguments) };

export function __wbg_new_23a2665fac83c611(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_641(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return ret;
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_new_405e22f390576ce2() {
    const ret = new Object();
    return ret;
};

export function __wbg_new_78feb108b6472713() {
    const ret = new Array();
    return ret;
};

export function __wbg_new_8a6f238a6ece86ea() {
    const ret = new Error();
    return ret;
};

export function __wbg_new_a12002a7f91c75be(arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
};

export function __wbg_new_c68d7209be747379(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbg_newnoargs_105ed471475aaf50(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a(arg0, arg1, arg2) {
    const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
    return ret;
};

export function __wbg_newwithstrandinit_06c535e0a867c635() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_next_25feadfc0913fea9(arg0) {
    const ret = arg0.next;
    return ret;
};

export function __wbg_next_6574e1a8a62d1055() { return handleError(function (arg0) {
    const ret = arg0.next();
    return ret;
}, arguments) };

export function __wbg_note_unwrap(arg0) {
    const ret = Note.__unwrap(arg0);
    return ret;
};

export function __wbg_noteandargs_unwrap(arg0) {
    const ret = NoteAndArgs.__unwrap(arg0);
    return ret;
};

export function __wbg_noteconsumability_new(arg0) {
    const ret = NoteConsumability.__wrap(arg0);
    return ret;
};

export function __wbg_noteconsumability_unwrap(arg0) {
    const ret = NoteConsumability.__unwrap(arg0);
    return ret;
};

export function __wbg_notedetails_unwrap(arg0) {
    const ret = NoteDetails.__unwrap(arg0);
    return ret;
};

export function __wbg_notedetailsandtag_unwrap(arg0) {
    const ret = NoteDetailsAndTag.__unwrap(arg0);
    return ret;
};

export function __wbg_noteid_new(arg0) {
    const ret = NoteId.__wrap(arg0);
    return ret;
};

export function __wbg_noteid_unwrap(arg0) {
    const ret = NoteId.__unwrap(arg0);
    return ret;
};

export function __wbg_noteidandargs_unwrap(arg0) {
    const ret = NoteIdAndArgs.__unwrap(arg0);
    return ret;
};

export function __wbg_outputnote_new(arg0) {
    const ret = OutputNote.__wrap(arg0);
    return ret;
};

export function __wbg_outputnote_unwrap(arg0) {
    const ret = OutputNote.__unwrap(arg0);
    return ret;
};

export function __wbg_queueMicrotask_97d92b4fcc8a61c5(arg0) {
    queueMicrotask(arg0);
};

export function __wbg_queueMicrotask_d3219def82552485(arg0) {
    const ret = arg0.queueMicrotask;
    return ret;
};

export function __wbg_read_a2434af1186cb56c(arg0) {
    const ret = arg0.read();
    return ret;
};

export function __wbg_releaseLock_091899af97991d2e(arg0) {
    arg0.releaseLock();
};

export function __wbg_removeNoteTag_258aa8a23e9afe32(arg0, arg1, arg2, arg3, arg4, arg5) {
    var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 1, 1);
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
    }
    let v2;
    if (arg4 !== 0) {
        v2 = getStringFromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1, 1);
    }
    const ret = removeNoteTag(v0, v1, v2);
    return ret;
};

export function __wbg_resolve_4851785c9c5f573d(arg0) {
    const ret = Promise.resolve(arg0);
    return ret;
};

export function __wbg_respond_1f279fa9f8edcb1c() { return handleError(function (arg0, arg1) {
    arg0.respond(arg1 >>> 0);
}, arguments) };

export function __wbg_rpodigest_new(arg0) {
    const ret = RpoDigest.__wrap(arg0);
    return ret;
};

export function __wbg_set_37837023f3d740e8(arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
};

export function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
};

export function __wbg_setbody_5923b78a95eedf29(arg0, arg1) {
    arg0.body = arg1;
};

export function __wbg_setcache_12f17c3a980650e4(arg0, arg1) {
    arg0.cache = __wbindgen_enum_RequestCache[arg1];
};

export function __wbg_setcredentials_c3a22f1cd105a2c6(arg0, arg1) {
    arg0.credentials = __wbindgen_enum_RequestCredentials[arg1];
};

export function __wbg_setheaders_834c0bdb6a8949ad(arg0, arg1) {
    arg0.headers = arg1;
};

export function __wbg_setintegrity_564a2397cf837760(arg0, arg1, arg2) {
    arg0.integrity = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmethod_3c5280fe5d890842(arg0, arg1, arg2) {
    arg0.method = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmode_5dc300b865044b65(arg0, arg1) {
    arg0.mode = __wbindgen_enum_RequestMode[arg1];
};

export function __wbg_setredirect_40e6a7f717a2f86a(arg0, arg1) {
    arg0.redirect = __wbindgen_enum_RequestRedirect[arg1];
};

export function __wbg_setreferrer_fea46c1230e5e29a(arg0, arg1, arg2) {
    arg0.referrer = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setreferrerpolicy_b73612479f761b6f(arg0, arg1) {
    arg0.referrerPolicy = __wbindgen_enum_ReferrerPolicy[arg1];
};

export function __wbg_stack_0ed75d68575b0f3c(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_static_accessor_GLOBAL_88a902d13a557d07() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_SELF_37c5d418e4bf5819() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_WINDOW_5de37043a91a9c40() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_status_f6360336ca686bf0(arg0) {
    const ret = arg0.status;
    return ret;
};

export function __wbg_syncsummary_new(arg0) {
    const ret = SyncSummary.__wrap(arg0);
    return ret;
};

export function __wbg_then_44b73946d2fb3e7d(arg0, arg1) {
    const ret = arg0.then(arg1);
    return ret;
};

export function __wbg_then_48b406749878a531(arg0, arg1, arg2) {
    const ret = arg0.then(arg1, arg2);
    return ret;
};

export function __wbg_toString_5285597960676b7b(arg0) {
    const ret = arg0.toString();
    return ret;
};

export function __wbg_transactionid_new(arg0) {
    const ret = TransactionId.__wrap(arg0);
    return ret;
};

export function __wbg_transactionid_unwrap(arg0) {
    const ret = TransactionId.__unwrap(arg0);
    return ret;
};

export function __wbg_transactionrecord_new(arg0) {
    const ret = TransactionRecord.__wrap(arg0);
    return ret;
};

export function __wbg_transactionresult_new(arg0) {
    const ret = TransactionResult.__wrap(arg0);
    return ret;
};

export function __wbg_transactionscriptinputpair_unwrap(arg0) {
    const ret = TransactionScriptInputPair.__unwrap(arg0);
    return ret;
};

export function __wbg_undoAccountStates_8f001fb873e60be8(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    const ret = undoAccountStates(v0);
    return ret;
};

export function __wbg_upsertForeignAccountCode_a6bb3cbd0756c14f(arg0, arg1, arg2, arg3, arg4, arg5) {
    let deferred0_0;
    let deferred0_1;
    let deferred2_0;
    let deferred2_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        deferred2_0 = arg4;
        deferred2_1 = arg5;
        const ret = upsertForeignAccountCode(getStringFromWasm0(arg0, arg1), v1, getStringFromWasm0(arg4, arg5));
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
};

export function __wbg_upsertInputNote_5ebc0eff76a00344(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16, arg17, arg18) {
    let deferred0_0;
    let deferred0_1;
    let deferred4_0;
    let deferred4_1;
    let deferred6_0;
    let deferred6_1;
    let deferred7_0;
    let deferred7_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        var v2 = getArrayU8FromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1, 1);
        var v3 = getArrayU8FromWasm0(arg6, arg7).slice();
        wasm.__wbindgen_free(arg6, arg7 * 1, 1);
        deferred4_0 = arg8;
        deferred4_1 = arg9;
        var v5 = getArrayU8FromWasm0(arg10, arg11).slice();
        wasm.__wbindgen_free(arg10, arg11 * 1, 1);
        deferred6_0 = arg12;
        deferred6_1 = arg13;
        deferred7_0 = arg14;
        deferred7_1 = arg15;
        var v8 = getArrayU8FromWasm0(arg17, arg18).slice();
        wasm.__wbindgen_free(arg17, arg18 * 1, 1);
        const ret = upsertInputNote(getStringFromWasm0(arg0, arg1), v1, v2, v3, getStringFromWasm0(arg8, arg9), v5, getStringFromWasm0(arg12, arg13), getStringFromWasm0(arg14, arg15), arg16, v8);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
};

export function __wbg_upsertOutputNote_fe43f9fe1a92342c(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13) {
    let deferred0_0;
    let deferred0_1;
    let deferred2_0;
    let deferred2_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        deferred2_0 = arg4;
        deferred2_1 = arg5;
        var v3 = getArrayU8FromWasm0(arg6, arg7).slice();
        wasm.__wbindgen_free(arg6, arg7 * 1, 1);
        let v4;
        if (arg8 !== 0) {
            v4 = getStringFromWasm0(arg8, arg9).slice();
            wasm.__wbindgen_free(arg8, arg9 * 1, 1);
        }
        var v5 = getArrayU8FromWasm0(arg12, arg13).slice();
        wasm.__wbindgen_free(arg12, arg13 * 1, 1);
        const ret = upsertOutputNote(getStringFromWasm0(arg0, arg1), v1, getStringFromWasm0(arg4, arg5), v3, v4, arg10 >>> 0, arg11, v5);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
};

export function __wbg_upsertTransactionRecord_f50ac2be1bd82547(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    let deferred0_0;
    let deferred0_1;
    let deferred3_0;
    let deferred3_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        var v1 = getArrayU8FromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1, 1);
        let v2;
        if (arg4 !== 0) {
            v2 = getArrayU8FromWasm0(arg4, arg5).slice();
            wasm.__wbindgen_free(arg4, arg5 * 1, 1);
        }
        deferred3_0 = arg6;
        deferred3_1 = arg7;
        let v4;
        if (arg8 !== 0) {
            v4 = getStringFromWasm0(arg8, arg9).slice();
            wasm.__wbindgen_free(arg8, arg9 * 1, 1);
        }
        let v5;
        if (arg10 !== 0) {
            v5 = getArrayU8FromWasm0(arg10, arg11).slice();
            wasm.__wbindgen_free(arg10, arg11 * 1, 1);
        }
        const ret = upsertTransactionRecord(getStringFromWasm0(arg0, arg1), v1, v2, getStringFromWasm0(arg6, arg7), v4, v5);
        return ret;
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
};

export function __wbg_value_cd1ffa7b1ab794f1(arg0) {
    const ret = arg0.value;
    return ret;
};

export function __wbg_view_fd8a56e8983f448d(arg0) {
    const ret = arg0.view;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_word_new(arg0) {
    const ret = Word.__wrap(arg0);
    return ret;
};

export function __wbindgen_array_new() {
    const ret = [];
    return ret;
};

export function __wbindgen_array_push(arg0, arg1) {
    arg0.push(arg1);
};

export function __wbindgen_as_number(arg0) {
    const ret = +arg0;
    return ret;
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return ret;
};

export function __wbindgen_bigint_get_as_i64(arg0, arg1) {
    const v = arg1;
    const ret = typeof(v) === 'bigint' ? v : undefined;
    getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};

export function __wbindgen_boolean_get(arg0) {
    const v = arg0;
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_cb_drop(arg0) {
    const obj = arg0.original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_closure_wrapper5861(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2268, __wbg_adapter_52);
    return ret;
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = arg0 in arg1;
    return ret;
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_5;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

export function __wbindgen_is_bigint(arg0) {
    const ret = typeof(arg0) === 'bigint';
    return ret;
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = arg0 === undefined;
    return ret;
};

export function __wbindgen_jsval_eq(arg0, arg1) {
    const ret = arg0 === arg1;
    return ret;
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = arg0 == arg1;
    return ret;
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

