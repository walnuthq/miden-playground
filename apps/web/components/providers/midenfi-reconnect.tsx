import {
  useMidenFiWallet,
  WalletReadyState,
} from "@miden-sdk/miden-wallet-adapter";
import { useEffect, useRef } from "react";
import useNetwork from "@/hooks/use-network";
import storage from "@/lib/utils/storage";

const CONNECTED_KEY = "midenFiConnected";

// Stands in for MidenFiSignerProvider's autoConnect, which reconnects whenever
// the wallet is selected but disconnected: the provider reselects its only
// wallet right after a disconnect or a dismissed connection request, so the
// extension prompt would keep coming back. This reconnects a wallet that was
// connected at most once per page load, and forgets it as soon as it
// disconnects, so a disconnect or a dismissed prompt sticks.
const MidenFiReconnect = () => {
  const { wallet, connected, connecting, connect, disconnect } =
    useMidenFiWallet();
  const { networkId } = useNetwork();
  const wasConnected = useRef(false);
  const reconnected = useRef(false);
  const connectedNetworkId = useRef(networkId);
  // A session is for one network: on a switch (e.g. testnet to mainnet
  // sandbox), reconnect a connected wallet so it prompts for the new one.
  useEffect(() => {
    if (connectedNetworkId.current === networkId) {
      return;
    }
    connectedNetworkId.current = networkId;
    if (connected) {
      disconnect()
        .then(() => connect())
        .catch(console.error);
    }
  }, [networkId, connected, connect, disconnect]);
  useEffect(() => {
    if (connected) {
      wasConnected.current = true;
      storage.set(CONNECTED_KEY, true);
      return;
    }
    if (wasConnected.current) {
      wasConnected.current = false;
      storage.remove(CONNECTED_KEY);
      return;
    }
    const installed =
      wallet?.readyState === WalletReadyState.Installed ||
      wallet?.readyState === WalletReadyState.Loadable;
    if (
      reconnected.current ||
      connecting ||
      !installed ||
      !storage.get<boolean>(CONNECTED_KEY)
    ) {
      return;
    }
    reconnected.current = true;
    connect().catch(console.error);
  }, [wallet?.readyState, connected, connecting, connect]);
  return null;
};

export default MidenFiReconnect;
