"use client";
import { createContext, useState, useEffect, type ReactNode } from "react";
import { type WebClient as WebClientType } from "@miden-sdk/miden-sdk";
import { type MidenSdk } from "@/lib/types";
import { type NetworkId } from "@/lib/types/network";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import {
  MIDEN_NOTE_TRANSPORT_URL,
  MIDEN_DEVNET_RPC_URL,
  MIDEN_TESTNET_RPC_URL,
} from "@/lib/constants";
import useAppState from "@/hooks/use-app-state";
import { storeName } from "@/lib/types/store";

export const WebClientContext = createContext<{
  client: WebClientType | null;
}>({
  client: null,
});

const createWebClient = async ({
  networkId,
  midenSdk: { WebClient },
}: {
  networkId: NetworkId;
  midenSdk: MidenSdk;
}) =>
  WebClient.createClient(
    networkId === "mdev" ? MIDEN_DEVNET_RPC_URL : MIDEN_TESTNET_RPC_URL,
    MIDEN_NOTE_TRANSPORT_URL,
  );

let initializedClient = false;

export const WebClientProvider = ({ children }: { children: ReactNode }) => {
  const { midenSdk } = useMidenSdk();
  const { networkId, initializingWebClient, nextState, nextStore } =
    useGlobalContext();
  const { webClientInitializing, webClientInitialized } = useAppState();
  const [client, setClient] = useState<WebClientType | null>(null);
  useEffect(() => {
    if (initializingWebClient || networkId === "mmck") {
      return;
    }
    const initializeClient = async () => {
      // console.log("INITIALIZE_WEB_CLIENT");
      client?.terminate();
      webClientInitializing();
      const newClient = await createWebClient({
        networkId,
        midenSdk,
      });
      if (nextStore) {
        await newClient.forceImportStore(
          JSON.stringify(nextStore),
          storeName(networkId),
        );
      }
      const syncSummary = await newClient.syncState();
      setClient(newClient);
      webClientInitialized({ blockNum: syncSummary.blockNum() });
    };
    if (!initializedClient) {
      initializedClient = true;
      initializeClient();
    }
  }, [
    client,
    initializingWebClient,
    networkId,
    midenSdk,
    nextStore,
    webClientInitializing,
    webClientInitialized,
  ]);
  useEffect(() => {
    if (networkId === "mmck" && nextState?.networkId !== "mmck") {
      initializedClient = false;
    }
  }, [networkId, nextState]);
  return <WebClientContext value={{ client }}>{children}</WebClientContext>;
};
