"use client";
import { createContext, useState, useEffect, type ReactNode } from "react";
import { type WebClient as WebClientType } from "@demox-labs/miden-sdk";
import { type MidenSdk } from "@/lib/types";
import { type NetworkId } from "@/lib/types/network";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import {
  MIDEN_TESTNET_RPC_URL,
  MIDEN_NOTE_TRANSPORT_URL,
} from "@/lib/constants";

const globalForWebClient = globalThis as unknown as {
  webClient: WebClientType;
};

export const WebClientContext = createContext<{
  client: WebClientType;
}>({
  client: {} as WebClientType,
});

export const createClient = async ({
  networkId,
  serializedMockChain,
  // @ts-expect-error MockWebClient not exported
  midenSdk: { WebClient, MockWebClient },
}: {
  networkId: NetworkId;
  serializedMockChain: Uint8Array | null;
  midenSdk: MidenSdk;
}) => {
  if (networkId === "mlcl") {
    return MockWebClient.createClient(serializedMockChain);
  } else {
    if (!globalForWebClient.webClient) {
      globalForWebClient.webClient = await WebClient.createClient(
        MIDEN_TESTNET_RPC_URL,
        MIDEN_NOTE_TRANSPORT_URL,
      );
    }
    return globalForWebClient.webClient;
  }
};

export const WebClientProvider = ({ children }: { children: ReactNode }) => {
  const { midenSdk } = useMidenSdk();
  const { networkId, serializedMockChain } = useGlobalContext();
  const [client, setClient] = useState<WebClientType | null>(null);
  useEffect(() => {
    const initClient = async () => {
      const client = await createClient({
        networkId,
        serializedMockChain,
        midenSdk,
      });
      setClient(client);
    };
    initClient();
  }, [networkId, serializedMockChain, midenSdk]);
  if (!client) {
    return null;
  }
  return <WebClientContext value={{ client }}>{children}</WebClientContext>;
};
