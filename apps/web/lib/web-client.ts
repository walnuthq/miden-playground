import {
  WebClient as MockWebClient,
  AccountId,
} from "@workspace/mock-web-client";
import { type NetworkId } from "@/lib/types";
import { mockWebClient } from "@/lib/mock-web-client";

const globalForWebClient = globalThis as unknown as {
  mockWebClient: MockWebClient;
  webClient: MockWebClient;
};

export const webClient = async (networkId: NetworkId) => {
  if (networkId === "mlcl") {
    // const { MockWebClient } = await import("@demox-labs/miden-sdk");
    // const serializedMockChainItem = localStorage.getItem("serializedMockChain");
    // const serializedMockChain = serializedMockChainItem
    //   ? new Uint8Array(serializedMockChainItem.split(",").map(Number))
    //   : null;
    // if (!globalForWebClient.webClient) {
    //   globalForWebClient.webClient = await MockWebClient.createClient(
    //     serializedMockChain
    //     // seed
    //   );
    // }
    // return globalForWebClient.webClient;
    return mockWebClient();
  }
  const { WebClient } = await import("@demox-labs/miden-sdk");
  if (!globalForWebClient.webClient) {
    // @ts-ignore
    globalForWebClient.webClient = await WebClient.createClient();
  }
  return globalForWebClient.webClient;
};

export const getAccountById = async (
  client: MockWebClient,
  accountId: string
) => {
  const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
  const wasmAccountId = WasmAccountId.fromBech32(accountId);
  // @ts-ignore
  const account = await client.getAccount(wasmAccountId);
  if (account) {
    return account;
  }
  // @ts-ignore
  await client.importAccountById(wasmAccountId);
  // @ts-ignore
  const importedAccount = await client.getAccount(wasmAccountId);
  if (!importedAccount) {
    throw new Error("Error importing account");
  }
  return importedAccount;
};

export const getConsumableNotes = async (
  client: MockWebClient,
  accountId: string
) => {
  const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
  const wasmAccountId = WasmAccountId.fromBech32(accountId);
  // @ts-ignore
  return client.getConsumableNotes(wasmAccountId);
};
