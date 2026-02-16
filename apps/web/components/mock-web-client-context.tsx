"use client";
import { createContext, useState, useEffect, type ReactNode } from "react";
import { isEqual } from "lodash";
import { type MockWebClient as MockWebClientType } from "@miden-sdk/miden-sdk";
import { type MidenSdk } from "@/lib/types";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { storeName } from "@/lib/types/store";
import useGlobalContext from "@/components/global-context/hook";
import useAppState from "@/hooks/use-app-state";

export const MockWebClientContext = createContext<{
  client: MockWebClientType | null;
}>({
  client: null,
});

export const createMockWebClient = async ({
  serializedMockChain,
  midenSdk: { MockWebClient },
}: {
  serializedMockChain: Uint8Array;
  midenSdk: MidenSdk;
}) =>
  MockWebClient.createClient(
    serializedMockChain.length === 0 ? undefined : serializedMockChain,
  );

let initializedClient = false;

export const MockWebClientProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { midenSdk } = useMidenSdk();
  const {
    networkId,
    serializedMockChain,
    initializingMockWebClient,
    nextStore,
  } = useGlobalContext();
  const { mockWebClientInitializing, mockWebClientInitialized } = useAppState();
  const [client, setClient] = useState<MockWebClientType | null>(null);
  useEffect(() => {
    if (initializingMockWebClient || networkId !== "mmck") {
      return;
    }
    const initializeClient = async () => {
      // console.log("INITIALIZE_MOCK_WEB_CLIENT");
      client?.terminate();
      mockWebClientInitializing();
      const newClient = await createMockWebClient({
        serializedMockChain,
        midenSdk,
      });
      if (nextStore) {
        await newClient.forceImportStore(
          JSON.stringify(nextStore),
          storeName("mmck"),
        );
      }
      const syncSummary = await newClient.syncState();
      setClient(newClient);
      mockWebClientInitialized({
        blockNum: syncSummary.blockNum(),
        serializedMockChain: newClient.serializeMockChain(),
      });
    };
    const clientSerializedMockChain =
      client?.serializeMockChain() ?? serializedMockChain;
    if (
      !initializedClient ||
      !isEqual(serializedMockChain, clientSerializedMockChain)
    ) {
      initializedClient = true;
      initializeClient();
    }
  }, [
    client,
    initializingMockWebClient,
    networkId,
    serializedMockChain,
    midenSdk,
    nextStore,
    mockWebClientInitializing,
    mockWebClientInitialized,
  ]);
  return (
    <MockWebClientContext value={{ client }}>{children}</MockWebClientContext>
  );
};
