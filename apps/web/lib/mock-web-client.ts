import { MockWebClient } from "@workspace/mock-web-client";

const globalForMockWebClient = globalThis as unknown as {
  mockWebClient: MockWebClient;
};

export const mockWebClient = async (seed?: Uint8Array) => {
  // const testSeed = new Uint8Array(32);
  if (!globalForMockWebClient.mockWebClient) {
    globalForMockWebClient.mockWebClient = await MockWebClient.createClient(
      undefined,
      seed
    );
  }
  return globalForMockWebClient.mockWebClient;
};
