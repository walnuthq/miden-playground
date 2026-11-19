import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { MockWasmWebClient } from "@miden-sdk/miden-sdk";
import {
  asMockClient,
  crashAction,
  MOCK_CHAIN_BUSY_MESSAGE,
  MOCK_RPC_URL,
  type MockChainDump,
  type MockChainLock,
  type MockChainStorage,
  mockAwareCreateClient,
  mockChainTabLock,
  onMockClientCrash,
  proveMockBlock,
  replaceMockChain,
  STARTUP_CRASH_MS,
  simulationStoreLock,
  tabRunsMockChain,
} from "./mock-chain.ts";

const bytes = (...values: number[]) => new Uint8Array(values);

const memoryStorage = (initial?: MockChainDump) => {
  let dump = initial;
  const saved: MockChainDump[] = [];
  const storage: MockChainStorage = {
    load: async () => dump,
    save: async (next) => {
      dump = next;
      saved.push(next);
    },
    clear: async () => {
      dump = undefined;
    },
  };
  return { storage, saved };
};

// A mock client as far as this module uses one: its chain is a block count.
const fakeMockClient = (chain?: Uint8Array, transport?: Uint8Array) => {
  let blocks = chain?.[0] ?? 0;
  const worker = new EventTarget();
  const state = { terminated: 0 };
  const created: (Uint8Array | null)[][] = [];
  const client = {
    usesMockChain: () => true,
    worker,
    serializeMockChain: async () => bytes(blocks),
    serializeMockNoteTransportNode: async () => transport ?? bytes(),
    proveBlock: async () => {
      blocks += 1;
    },
    terminate: () => {
      state.terminated += 1;
    },
    getWasmWebClient: async () => ({
      createMockClient: async (
        seed: Uint8Array | null,
        nextChain: Uint8Array | null,
        nextTransport: Uint8Array | null,
      ) => {
        created.push([seed, nextChain, nextTransport]);
        blocks = nextChain?.[0] ?? 0;
      },
    }),
  };
  return {
    client: client as unknown as MockWasmWebClient,
    worker,
    state,
    created,
  };
};

const factory = (
  storage: MockChainStorage,
  {
    now = () => 0,
    lock = async () => () => {},
  }: { now?: () => number; lock?: MockChainLock } = {},
) => {
  const page = new EventTarget();
  const clients: ReturnType<typeof fakeMockClient>[] = [];
  const createClient = mockAwareCreateClient({
    createClient: async (rpcUrl: string | undefined, transport?: string) => ({
      rpcUrl,
      transport,
    }),
    createMockClient: async (chain, transport) => {
      const fake = fakeMockClient(chain, transport);
      clients.push(fake);
      return fake.client;
    },
    storage,
    lock,
    page,
    now,
  });
  return { createClient, clients, page };
};

describe("mockAwareCreateClient", () => {
  test("another URL goes to the SDK's factory, with its arguments", async () => {
    const { storage, saved } = memoryStorage();
    const { createClient, clients } = factory(storage);
    assert.deepEqual(await createClient("testnet", "https://transport"), {
      rpcUrl: "testnet",
      transport: "https://transport",
    });
    assert.deepEqual(await createClient(undefined), {
      rpcUrl: undefined,
      transport: undefined,
    });
    assert.equal(clients.length, 0);
    assert.equal(saved.length, 0);
  });

  test("a new chain is saved at once", async () => {
    const { storage, saved } = memoryStorage();
    const { createClient } = factory(storage);
    const client = await createClient(MOCK_RPC_URL);
    assert.notEqual(await asMockClient(client), null);
    assert.deepEqual(saved, [{ chain: bytes(0), transport: bytes() }]);
  });

  test("the saved chain is given back to the client", async () => {
    const { storage, saved } = memoryStorage({
      chain: bytes(4),
      transport: bytes(9),
    });
    const { createClient } = factory(storage);
    const client = await asMockClient(await createClient(MOCK_RPC_URL));
    assert.deepEqual(await client?.serializeMockChain(), bytes(4));
    assert.deepEqual(await client?.serializeMockNoteTransportNode(), bytes(9));
    assert.equal(saved.length, 0);
  });

  test("a saved chain the client refuses fails, and stays saved", async () => {
    const { storage } = memoryStorage({ chain: bytes(4), transport: bytes() });
    const createClient = mockAwareCreateClient({
      createClient: async () => null,
      createMockClient: async () => {
        throw new Error("unexpected end of input");
      },
      storage,
    });
    await assert.rejects(
      createClient(MOCK_RPC_URL),
      /saved MockChain couldn't be loaded \(unexpected end of input\)/,
    );
    assert.deepEqual((await storage.load())?.chain, bytes(4));
  });
});

// The tab's hold outlives a test: each starts by leaving the sandbox.
describe("one tab at a time", () => {
  const tabLock = () => {
    const state = { asked: 0, released: 0 };
    const lock: MockChainLock = async () => {
      state.asked += 1;
      return () => {
        state.released += 1;
      };
    };
    return { lock, state };
  };

  test("another tab has the sandbox: no client, and the chain is left alone", async () => {
    const { storage, saved } = memoryStorage();
    const { createClient, clients } = factory(storage, {
      lock: async () => null,
    });
    await createClient("testnet");
    await assert.rejects(
      createClient(MOCK_RPC_URL),
      new RegExp(MOCK_CHAIN_BUSY_MESSAGE),
    );
    assert.equal(clients.length, 0);
    assert.equal(saved.length, 0);
  });

  test("asked again once the other tab left", async () => {
    const { storage } = memoryStorage();
    let busy = true;
    const { createClient, clients } = factory(storage, {
      lock: async () => (busy ? null : () => {}),
    });
    await createClient("testnet");
    await assert.rejects(createClient(MOCK_RPC_URL));
    busy = false;
    await createClient(MOCK_RPC_URL);
    assert.equal(clients.length, 1);
  });

  test("held once for clients created in a row, released on leaving", async () => {
    const { storage } = memoryStorage();
    const { lock, state } = tabLock();
    const { createClient, clients } = factory(storage, { lock });
    await createClient("testnet");
    await Promise.all([createClient(MOCK_RPC_URL), createClient(MOCK_RPC_URL)]);
    await createClient(MOCK_RPC_URL);
    assert.equal(clients.length, 3);
    assert.deepEqual(state, { asked: 1, released: 0 });
    await createClient("testnet");
    // The release waits for the lock's promise.
    await Promise.resolve();
    assert.deepEqual(state, { asked: 1, released: 1 });
  });
});

describe("asMockClient", () => {
  test("only a client on a mock chain", async () => {
    assert.equal(await asMockClient(null), null);
    assert.equal(await asMockClient({}), null);
    assert.equal(await asMockClient({ usesMockChain: () => false }), null);
    const { client } = fakeMockClient();
    assert.equal(await asMockClient(client), client);
  });

  // A real network's client forwards the call to its WASM client, which
  // answers a Promise: taken for a mock client, it had its chain replaced.
  test("a client that answers with a Promise", async () => {
    assert.equal(
      await asMockClient({ usesMockChain: async () => false }),
      null,
    );
    const client = { usesMockChain: async () => true };
    assert.equal(await asMockClient(client), client);
  });
});

// On the real Web Locks, which node has: each test frees what it holds.
describe("the store's lock", () => {
  const settled = () => new Promise((resolve) => setTimeout(resolve, 20));

  test("simulations share the store, and a sandbox takes it from them", async () => {
    const lost: string[] = [];
    const first = await simulationStoreLock(() => lost.push("first"));
    const second = await simulationStoreLock(() => lost.push("second"));
    assert.ok(first && second);
    const sandbox = await mockChainTabLock();
    assert.ok(sandbox);
    await settled();
    assert.deepEqual(lost.sort(), ["first", "second"]);
    // While the sandbox runs, no simulation gets the store.
    assert.equal(await simulationStoreLock(() => {}), null);
    sandbox();
    await settled();
    const after = await simulationStoreLock(() => lost.push("after"));
    assert.ok(after);
    after();
    await settled();
    // A release isn't a loss.
    assert.equal(lost.length, 2);
  });

  test("a sandbox isn't taken from another sandbox", async () => {
    const sandbox = await mockChainTabLock();
    assert.ok(sandbox);
    assert.equal(await mockChainTabLock(), null);
    sandbox();
    await settled();
    const next = await mockChainTabLock();
    assert.ok(next);
    next();
    await settled();
  });

  test("the tab runs the MockChain while its client is the sandbox's", async () => {
    const { storage } = memoryStorage();
    const { createClient } = factory(storage);
    await createClient("testnet");
    assert.equal(tabRunsMockChain(), false);
    await createClient(MOCK_RPC_URL);
    assert.equal(tabRunsMockChain(), true);
    await createClient("testnet");
    assert.equal(tabRunsMockChain(), false);
  });
});

describe("proveMockBlock", () => {
  test("saves the chain with the new block", async () => {
    const { storage, saved } = memoryStorage();
    const { client } = fakeMockClient(bytes(2));
    await proveMockBlock(client, storage);
    assert.deepEqual(saved, [{ chain: bytes(3), transport: bytes() }]);
  });
});

describe("replaceMockChain", () => {
  test("null starts a new chain", async () => {
    const { storage, saved } = memoryStorage();
    const { client, created } = fakeMockClient(bytes(5));
    await replaceMockChain(client, null, storage);
    assert.deepEqual(created, [[null, null, null]]);
    assert.deepEqual(saved, [{ chain: bytes(0), transport: bytes() }]);
  });

  test("a dump is loaded and saved", async () => {
    const { storage, saved } = memoryStorage();
    const { client, created } = fakeMockClient();
    await replaceMockChain(
      client,
      { chain: bytes(7), transport: bytes(1) },
      storage,
    );
    assert.deepEqual(created, [[null, bytes(7), bytes(1)]]);
    assert.deepEqual(saved[0]?.chain, bytes(7));
  });
});

describe("crashAction", () => {
  test("a first crash restarts, whenever it happens", () => {
    assert.equal(crashAction({ restarted: false, ageMs: 0 }), "restart");
    assert.equal(crashAction({ restarted: false, ageMs: 60_000 }), "restart");
  });

  test("a restart that crashes on startup gives up", () => {
    assert.equal(crashAction({ restarted: true, ageMs: 0 }), "give-up");
    assert.equal(
      crashAction({ restarted: true, ageMs: STARTUP_CRASH_MS - 1 }),
      "give-up",
    );
  });

  test("a restart that lived restarts again", () => {
    assert.equal(
      crashAction({ restarted: true, ageMs: STARTUP_CRASH_MS }),
      "restart",
    );
  });
});

describe("a crash of the mock client's worker", () => {
  test("terminates it and restarts once, then gives up", async () => {
    const { storage } = memoryStorage();
    let time = 0;
    const { createClient, clients } = factory(storage, { now: () => time });
    const actions: string[] = [];
    const unsubscribe = onMockClientCrash(({ action }) => actions.push(action));
    try {
      await createClient(MOCK_RPC_URL);
      time = 60_000;
      clients[0]?.worker.dispatchEvent(new Event("error"));
      assert.equal(clients[0]?.state.terminated, 1);
      assert.deepEqual(actions, ["restart"]);
      // Reported once per client.
      clients[0]?.worker.dispatchEvent(new Event("error"));
      assert.deepEqual(actions, ["restart"]);

      // The restart crashes a second into its life.
      await createClient(MOCK_RPC_URL);
      time += 1000;
      clients[1]?.worker.dispatchEvent(new Event("error"));
      assert.equal(clients[1]?.state.terminated, 1);
      assert.deepEqual(actions, ["restart", "give-up"]);

      // A client created after that isn't a restart.
      await createClient(MOCK_RPC_URL);
      clients[2]?.worker.dispatchEvent(new Event("error"));
      assert.deepEqual(actions, ["restart", "give-up", "restart"]);
    } finally {
      unsubscribe();
      // Leaves no restart pending for another test.
      await createClient(MOCK_RPC_URL);
    }
  });

  test("a WASM trap on the page counts, another error doesn't", async () => {
    const { storage } = memoryStorage();
    const { createClient, clients, page } = factory(storage);
    const actions: string[] = [];
    const unsubscribe = onMockClientCrash(({ action }) => actions.push(action));
    const pageError = (error: unknown) =>
      Object.assign(new Event("error"), { error });
    try {
      await createClient(MOCK_RPC_URL);
      page.dispatchEvent(pageError(new TypeError("not the client")));
      assert.deepEqual(actions, []);
      page.dispatchEvent(
        pageError(new WebAssembly.RuntimeError("unreachable")),
      );
      assert.equal(clients[0]?.state.terminated, 1);
      assert.deepEqual(actions, ["restart"]);
    } finally {
      unsubscribe();
      await createClient(MOCK_RPC_URL);
    }
  });

  test("a client the app left isn't watched", async () => {
    const { storage } = memoryStorage();
    const { createClient, clients, page } = factory(storage);
    const actions: string[] = [];
    const unsubscribe = onMockClientCrash(({ action }) => actions.push(action));
    try {
      await createClient(MOCK_RPC_URL);
      await createClient("testnet");
      clients[0]?.worker.dispatchEvent(new Event("error"));
      page.dispatchEvent(
        Object.assign(new Event("error"), {
          error: new WebAssembly.RuntimeError("unreachable"),
        }),
      );
      assert.equal(clients[0]?.state.terminated, 0);
      assert.deepEqual(actions, []);
    } finally {
      unsubscribe();
    }
  });

  test("a restart that lived restarts again", async () => {
    const { storage } = memoryStorage();
    let time = 0;
    const { createClient, clients } = factory(storage, { now: () => time });
    const actions: string[] = [];
    const unsubscribe = onMockClientCrash(({ action }) => actions.push(action));
    try {
      await createClient(MOCK_RPC_URL);
      clients[0]?.worker.dispatchEvent(new Event("error"));
      await createClient(MOCK_RPC_URL);
      time = STARTUP_CRASH_MS;
      clients[1]?.worker.dispatchEvent(new Event("error"));
      assert.deepEqual(actions, ["restart", "restart"]);
    } finally {
      unsubscribe();
      // Leaves no restart pending for another test.
      await createClient(MOCK_RPC_URL);
    }
  });
});
