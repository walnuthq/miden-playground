import { createContext, type ReactNode, useState } from "react";
import type { NetworkId } from "@/lib/types/network";
import storage from "@/lib/utils/storage";

const initialNetworkId = storage.get<NetworkId>("networkId") ?? "mtst";

export const NetworkContext = createContext<{
  networkId: NetworkId;
  switchNetwork: (newNetworkId: NetworkId) => void;
}>({
  networkId: initialNetworkId,
  switchNetwork: () => {},
});

// In the app shell's graph (OuterProviders), so it imports nothing from the
// SDK: `storage` is the SDK's `createMidenStorage` layout, without it.
export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [networkId, setNetworkId] = useState<NetworkId>(initialNetworkId);
  const switchNetwork = (newNetworkId: NetworkId) => {
    setNetworkId(newNetworkId);
    storage.set("networkId", newNetworkId);
  };
  return (
    <NetworkContext value={{ networkId, switchNetwork }}>
      {children}
    </NetworkContext>
  );
};
