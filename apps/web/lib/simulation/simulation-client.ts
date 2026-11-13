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

let queue: Promise<unknown> = Promise.resolve();

// One run at a time: the client's calls aren't atomic as a group.
export const enqueueSimulation = <T>(run: () => Promise<T>): Promise<T> => {
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
};
