"use client";
import { createMidenStorage } from "@miden-sdk/react";
import { createContext, useState, type ReactNode } from "react";
import type { NetworkId } from "@/lib/types/network";
import { noop } from "lodash";

const store = createMidenStorage("miden-playground");
const initialNetworkId = store.get<NetworkId>("networkId") ?? "mtst";

export const NetworkContext = createContext<{
  networkId: NetworkId;
  switchNetwork: (newNetworkId: NetworkId) => void;
}>({
  networkId: initialNetworkId,
  switchNetwork: noop,
});

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [networkId, setNetworkId] = useState<NetworkId>(initialNetworkId);
  const switchNetwork = (newNetworkId: NetworkId) => {
    setNetworkId(newNetworkId);
    store.set("networkId", newNetworkId);
  };
  return (
    <NetworkContext value={{ networkId, switchNetwork }}>
      {children}
    </NetworkContext>
  );
};
