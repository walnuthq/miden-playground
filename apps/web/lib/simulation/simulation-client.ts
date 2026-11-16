import { MockWasmWebClient } from "@miden-sdk/miden-sdk";

// The client simulations of account components run on: a mock chain in the
// browser, with its own IndexedDB store (`mock_client_db`, the name the SDK
// gives every mock client), apart from the networks' stores. A simulated
// account is rebuilt on every compile and storage edit, and the SDK can't
// delete an account: on the app's client they would pile up in the user's
// store and saved projects. This store is emptied on each page load instead.
// It needs no network: the mock chain doesn't depend on the sandbox's.

const MOCK_STORE_NAME = "mock_client_db";

const deleteMockStore = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(MOCK_STORE_NAME);
    // Blocked by another tab's mock client: its accounts stay, harmlessly.
    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });

let clientPromise: Promise<MockWasmWebClient> | undefined;

// Created on first use: most visits never simulate.
export const simulationClient = () => {
  clientPromise ??= deleteMockStore()
    .then(() => MockWasmWebClient.createClient())
    .catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  return clientPromise;
};

// How long a run on the mock client may take before it's taken for hung.
// Runs are executed, never proven: they take seconds.
export const SIMULATION_TIMEOUT_MS = 60_000;

// Thrown when the mock client crashed or hung, and was discarded.
export class SimulationClientReset extends Error {}

const CRASHED =
  "The simulation's client crashed, most likely on a call to another account's procedure: a simulation reaches only the simulated foreign accounts, not the sandbox's. It was reset: the next run starts a new one.";

const timedOut = (ms: number) =>
  `The simulation didn't finish in ${ms / 1000} s. Its client was reset: the next run starts a new one.`;

// Drops the client, so the next run creates another, and stops it: a call in
// flight on its worker rejects ("WebClient terminated").
const discardClient = (client: MockWasmWebClient) => {
  clientPromise = undefined;
  try {
    client.terminate();
  } catch {
    // Already terminated.
  }
};

// Runs `run` on the mock client. A panic inside the SDK's worker (the mock
// RPC unwraps its lookup of an account it doesn't hold: any foreign call)
// never settles the call, and would hold every later simulation in the queue
// until a reload. So a crash of the worker, or a run past `timeoutMs`,
// discards the client and rejects with `SimulationClientReset`.
export const withSimulationClient = async <T>(
  run: (client: MockWasmWebClient) => Promise<T>,
  timeoutMs = SIMULATION_TIMEOUT_MS,
): Promise<T> => {
  const client = await simulationClient();
  // Not in the SDK's typings: without it, only the timeout catches a crash.
  const worker = (client as unknown as { worker?: Worker }).worker;
  let onError: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const failure = new Promise<never>((_, reject) => {
    const fail = (message: string) => {
      discardClient(client);
      reject(new SimulationClientReset(message));
    };
    onError = () => fail(CRASHED);
    worker?.addEventListener("error", onError);
    timer = setTimeout(() => fail(timedOut(timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([run(client), failure]);
  } finally {
    clearTimeout(timer);
    if (onError) {
      worker?.removeEventListener("error", onError);
    }
    if ((stagings.get(client) ?? 0) >= STAGINGS_PER_CLIENT) {
      discardClient(client);
    }
  }
};

// Each foreign account staged adds an account and a block to the mock chain,
// and the mock RPC keeps a snapshot of the chain per block: runs slow down as
// they pile up (about 370 ms a run after the first staging, 520 ms after 50,
// measured on 2026-11-16). Past this many, the client is discarded after the
// run, and the next run starts a new one, with an empty store.
export const STAGINGS_PER_CLIENT = 100;

const stagings = new WeakMap<MockWasmWebClient, number>();

export const recordStaging = (client: MockWasmWebClient) => {
  stagings.set(client, (stagings.get(client) ?? 0) + 1);
};

let queue: Promise<unknown> = Promise.resolve();

// One run at a time: the client's calls aren't atomic as a group.
export const enqueueSimulation = <T>(run: () => Promise<T>): Promise<T> => {
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
};
