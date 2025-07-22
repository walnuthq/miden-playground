import { MockWebClient } from "@workspace/mock-web-client";
import { range } from "lodash";

/* export const mockWebClient = async (
  seed: Uint8Array = new Uint8Array(range(32))
) => MockWebClient.createClient(undefined, seed); */

const globalForMockWebClient = globalThis as unknown as {
  mockWebClient: MockWebClient;
};

export const mockWebClient = async (
  seed: Uint8Array = new Uint8Array(range(32))
) => {
  if (!globalForMockWebClient.mockWebClient) {
    globalForMockWebClient.mockWebClient = await MockWebClient.createClient(
      undefined,
      seed
    );
  }
  return globalForMockWebClient.mockWebClient;
};
