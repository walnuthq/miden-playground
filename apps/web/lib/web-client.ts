import { range } from "lodash";
import {
  WebClient as MockWebClient,
  AccountId,
} from "@workspace/mock-web-client";

const globalForWebClient = globalThis as unknown as {
  webClient: MockWebClient;
};

export const webClient = async (
  seed: Uint8Array = new Uint8Array(range(32))
) => {
  // if (networkId === "mlcl") {
  //   return mockWebClient();
  // }
  // @ts-ignore
  const { WebClient, MockWebClient } = await import(
    "@demox-labs/miden-sdk-next"
  );
  console.log("WebClient", WebClient);
  console.log("MockWebClient", MockWebClient);
  const serializedMockChainItem = localStorage.getItem("serializedMockChain");
  const serializedMockChain = serializedMockChainItem
    ? new Uint8Array(serializedMockChainItem.split(",").map(Number))
    : null;
  console.log("serializedMockChain", serializedMockChain);
  if (!globalForWebClient.webClient) {
    globalForWebClient.webClient = await MockWebClient.createClient(
      serializedMockChain,
      seed
    );
  }
  return globalForWebClient.webClient;
};
