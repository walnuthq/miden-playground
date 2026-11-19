// The MockChain sandbox ("mmck"): the app's client is a mock client, whose
// chain runs in the browser (spec/mockchain-sandbox.md). This module imports
// nothing from the SDK at run time: `lib/miden-client.ts` installs the factory.
import type { MockWasmWebClient } from "@miden-sdk/miden-sdk";

// What `networks.mmck` gives MidenProvider as its `rpcUrl`. The React SDK
// can't take a client: it always calls `WasmWebClient.createClient(rpcUrl, …)`,
// and passes a value it doesn't know through. That static is replaced
// (`mockAwareCreateClient`) to build a mock client for this one.
export const MOCK_RPC_URL = "mock";

// The chain and its note transport node, as the client serializes them. They
// live in the client's memory, not in its IndexedDB store (`mock_client_db`),
// and `exportStore()` leaves them out.
export type MockChainDump = { chain: Uint8Array; transport: Uint8Array };

export type MockChainStorage = {
  load: () => Promise<MockChainDump | undefined>;
  save: (dump: MockChainDump) => Promise<unknown>;
  clear: () => Promise<unknown>;
};

// No "miden" in the name: `clearMidenStorage()`, which runs before every
// store import, deletes every database whose name contains it.
const DB_NAME = "PlaygroundMockChain";
const STORE = "chain";
const KEY = "current";

const withStore = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

// Where the chain is kept across reloads, next to the client's store.
export const mockChainStorage: MockChainStorage = {
  load: () =>
    withStore<MockChainDump | undefined>("readonly", (store) => store.get(KEY)),
  save: (dump) => withStore("readwrite", (store) => store.put(dump, KEY)),
  clear: () => withStore("readwrite", (store) => store.delete(KEY)),
};

export const deleteMockChain = async () => {
  if (typeof indexedDB === "undefined") {
    return;
  }
  await mockChainStorage.clear();
};

// The mock client's members the SDK's typings leave out.
type MockClient = MockWasmWebClient & {
  usesMockChain?: () => boolean | Promise<boolean>;
  worker?: Worker | null;
  // The wasm client under the JS wrapper.
  getWasmWebClient: () => Promise<{
    createMockClient: (
      seed: Uint8Array | null,
      chain: Uint8Array | null,
      transport: Uint8Array | null,
    ) => Promise<unknown>;
  }>;
};

// The client as a mock client, or null when it runs on a real network.
// Awaited: the mock client's wrapper answers a boolean, but every other client
// forwards the call to its WASM client, which answers a Promise (truthy even
// for `false`).
export const asMockClient = async (
  client: unknown,
): Promise<MockWasmWebClient | null> =>
  (await (client as MockClient | null)?.usesMockChain?.()) === true
    ? (client as MockWasmWebClient)
    : null;

type Serializable = Pick<
  MockWasmWebClient,
  "serializeMockChain" | "serializeMockNoteTransportNode"
>;

export const dumpMockChain = async (
  client: Serializable,
): Promise<MockChainDump> => ({
  chain: await client.serializeMockChain(),
  transport: await client.serializeMockNoteTransportNode(),
});

export const saveMockChain = async (
  client: Serializable,
  storage: MockChainStorage = mockChainStorage,
) => storage.save(await dumpMockChain(client));

// Puts the submitted transactions in a block (nothing else produces one) and
// keeps the chain for the next page load. The caller syncs.
export const proveMockBlock = async (
  client: Serializable & Pick<MockWasmWebClient, "proveBlock">,
  storage: MockChainStorage = mockChainStorage,
) => {
  await client.proveBlock();
  await saveMockChain(client, storage);
};

// Replaces the live client's chain in place: a new one when `dump` is null.
// For a store import, which replaces the store under the client: a store and
// a chain that disagree fail every sync. A new chain writes its genesis to the
// store. `createMockClient` on the wasm client is an internal of the SDK,
// which its worker calls the same way on every sync.
export const replaceMockChain = async (
  client: MockWasmWebClient,
  dump: MockChainDump | null,
  storage: MockChainStorage = mockChainStorage,
) => {
  const wasmWebClient = await (client as MockClient).getWasmWebClient();
  await wasmWebClient.createMockClient(
    null,
    dump?.chain ?? null,
    dump?.transport ?? null,
  );
  await saveMockChain(client, storage);
};

// One tab at a time runs the MockChain sandbox: the chain is in the memory of
// the tab's client, over a store every tab shares (`mock_client_db`). A second
// tab would load the same saved chain, and the first block either proves puts
// the shared store ahead of the other's chain, whose syncs then fail.
// Resolves with what releases the sandbox, or null when another tab has it.
export type MockChainLock = () => Promise<(() => void) | null>;

const LOCK_NAME = "playground-mock-chain";
// A reload asks while the page it replaces may still hold the lock.
const LOCK_TIMEOUT_MS = 1000;

export const MOCK_CHAIN_BUSY_MESSAGE =
  "the MockChain sandbox is open in another tab";

// Asks for the Web Lock, which the browser releases with the tab. Resolves
// with its release once it's granted, or null when it isn't. `onLost` is
// called when a granted hold is taken away (`steal`).
const holdLock = (
  locks: LockManager,
  options: LockOptions,
  onLost?: () => void,
) =>
  new Promise<(() => void) | null>((resolve) => {
    locks
      .request(LOCK_NAME, options, (lock) => {
        if (!lock) {
          resolve(null);
          return;
        }
        // Held until the returned promise settles.
        return new Promise<void>((release) => resolve(release));
      })
      .catch(() => {
        resolve(null);
        onLost?.();
      });
  });

// The sandbox's hold is exclusive. The Simulate tab's mock clients, which use
// the same store on the other networks, hold the lock shared
// (`simulationStoreLock`): the sandbox takes it from them, in this tab or
// another, and they stop. Only another sandbox refuses it. Without the API
// (an old browser) nothing is checked.
export const mockChainTabLock: MockChainLock = async () => {
  const locks = globalThis.navigator?.locks;
  if (!locks) {
    return () => {};
  }
  const free = await holdLock(locks, { ifAvailable: true });
  if (free) {
    return free;
  }
  const { held = [] } = await locks.query();
  const holders = held.filter(({ name }) => name === LOCK_NAME);
  return holders.length > 0 && holders.every(({ mode }) => mode === "shared")
    ? holdLock(locks, { steal: true })
    : holdLock(locks, { signal: AbortSignal.timeout(LOCK_TIMEOUT_MS) });
};

// The hold of a Simulate tab's mock client on the store, on a network other
// than the MockChain: shared, so several tabs simulate at once, as before.
// Resolves with its release, or null while a tab runs the sandbox, whose
// store it is then. `onLost` is called when a sandbox starts, here or in
// another tab: the client must stop using the store.
export const simulationStoreLock = (onLost: () => void) => {
  const locks = globalThis.navigator?.locks;
  return locks
    ? holdLock(locks, { mode: "shared", ifAvailable: true }, onLost)
    : Promise.resolve(() => {});
};

// The tab's hold on the sandbox while its client is a mock client. One for
// the tab, not one per client: React's StrictMode and a restart create
// clients in a row.
let held: ReturnType<MockChainLock> | undefined;

const releaseMockChain = () => {
  held?.then((release) => release?.());
  held = undefined;
};

// Whether this tab's client is the sandbox's mock client: `mock_client_db` is
// then its store, and no other mock client may be created.
export const tabRunsMockChain = () => held !== undefined;

// A mock client younger than this when its worker crashes crashed on startup.
export const STARTUP_CRASH_MS = 5000;

// What to do when the mock client's worker crashed: start another client on
// the saved chain, unless the crashed one was itself a restart that didn't
// survive its startup. Then the store, the chain or the app state is what
// crashes it, and restarting would loop.
export const crashAction = ({
  restarted,
  ageMs,
}: {
  restarted: boolean;
  ageMs: number;
}) => (restarted && ageMs < STARTUP_CRASH_MS ? "give-up" : "restart");

export type MockClientCrash = { action: ReturnType<typeof crashAction> };

const crashListeners = new Set<(crash: MockClientCrash) => void>();

// Called when the app's mock client crashed (see `mockAwareCreateClient`).
// Returns the unsubscribe.
export const onMockClientCrash = (
  listener: (crash: MockClientCrash) => void,
) => {
  crashListeners.add(listener);
  return () => {
    crashListeners.delete(listener);
  };
};

// Whether the next mock client replaces one that crashed.
let restarting = false;

// Stops watching the mock client the app last ran on.
let unwatch: (() => void) | undefined;

// A panic in the client's WASM on the page's thread: the page gets it as an
// uncaught trap ("RuntimeError: unreachable").
const isWasmTrap = (event: Event) =>
  (event as ErrorEvent).error instanceof WebAssembly.RuntimeError;

// Stops a mock client that crashed and tells the listeners. The mock RPC
// panics on an account its chain doesn't hold (`committed_account(…)
// .unwrap()`, miden-client 0.17.5 `test_utils/mock.rs:748`): in the client's
// worker for a call that runs there (a sync, a transaction), on the page's
// thread for the others (`importAccountById`). The SDK never settles the call,
// and none after it: `terminate()` rejects them ("WebClient terminated").
// `client.worker` isn't in the SDK's typings.
const watchForCrash = (
  client: MockWasmWebClient,
  page: EventTarget,
  now: () => number,
  restarted: boolean,
) => {
  const worker = (client as MockClient).worker;
  const createdAt = now();
  const onWorkerError = () => crashed();
  const onPageError = (event: Event) => {
    if (isWasmTrap(event)) {
      crashed();
    }
  };
  const stop = () => {
    worker?.removeEventListener("error", onWorkerError);
    page.removeEventListener("error", onPageError);
  };
  const crashed = () => {
    stop();
    unwatch = undefined;
    try {
      client.terminate();
    } catch {
      // Already terminated.
    }
    const action = crashAction({ restarted, ageMs: now() - createdAt });
    restarting = action === "restart";
    for (const listener of crashListeners) {
      listener({ action });
    }
  };
  worker?.addEventListener("error", onWorkerError);
  page.addEventListener("error", onPageError);
  return stop;
};

// `WasmWebClient.createClient` with a mock client for `MOCK_RPC_URL`: on the
// chain saved by the last page load, or on a new one, saved at once.
export const mockAwareCreateClient =
  <Args extends unknown[], Client>({
    createClient,
    createMockClient,
    storage = mockChainStorage,
    lock = mockChainTabLock,
    page = globalThis,
    now = Date.now,
  }: {
    createClient: (
      rpcUrl: string | undefined,
      ...rest: Args
    ) => Promise<Client>;
    createMockClient: (
      chain?: Uint8Array,
      transport?: Uint8Array,
    ) => Promise<MockWasmWebClient>;
    storage?: MockChainStorage;
    lock?: MockChainLock;
    // Where an uncaught error of the page is reported.
    page?: EventTarget;
    now?: () => number;
  }) =>
  async (
    rpcUrl: string | undefined,
    ...rest: Args
  ): Promise<Client | MockWasmWebClient> => {
    // The SDK's provider creates a client per network switch and never stops
    // the one it replaces: a crash is the mock client's only while it's the
    // app's client.
    unwatch?.();
    unwatch = undefined;
    if (rpcUrl !== MOCK_RPC_URL) {
      releaseMockChain();
      return createClient(rpcUrl, ...rest);
    }
    const restarted = restarting;
    restarting = false;
    held ??= lock();
    if (!(await held)) {
      held = undefined;
      throw new Error(MOCK_CHAIN_BUSY_MESSAGE);
    }
    const dump = await storage.load();
    let client: MockWasmWebClient;
    try {
      client = await createMockClient(dump?.chain, dump?.transport);
    } catch (error) {
      if (!dump) {
        throw error;
      }
      // Most likely written by another SDK version. A new chain wouldn't do:
      // the store and the app state are ahead of it.
      throw new Error(
        `the saved MockChain couldn't be loaded (${error instanceof Error ? error.message : String(error)})`,
      );
    }
    if (!dump) {
      await saveMockChain(client, storage);
    }
    unwatch = watchForCrash(client, page, now, restarted);
    return client;
  };
