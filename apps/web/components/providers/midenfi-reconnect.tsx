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
// connected at most once per page load and per network, and forgets it as
// soon as it disconnects, so a disconnect or a dismissed prompt sticks.
//
// A session is for one network: on a switch (e.g. testnet to mainnet sandbox),
// a connected wallet is disconnected, and reconnected like a remembered one,
// so it prompts for the new network. (The provider stays mounted across the
// switch: it sits above MidenClientGate.)
const MidenFiReconnect = () => {
  const { wallet, connected, connecting, connect, disconnect } =
    useMidenFiWallet();
  const { networkId } = useNetwork();
  const wasConnected = useRef(false);
  const reconnected = useRef(false);
  const connectedNetworkId = useRef(networkId);
  // Set while a switch disconnects the wallet: that disconnect keeps the
  // connection remembered.
  const switching = useRef(false);
  useEffect(() => {
    const switched = connectedNetworkId.current !== networkId;
    if (switched) {
      connectedNetworkId.current = networkId;
      reconnected.current = false;
    }
    if (connected) {
      wasConnected.current = true;
      storage.set(CONNECTED_KEY, true);
      if (switched) {
        switching.current = true;
        disconnect().catch((error) => {
          switching.current = false;
          console.error(error);
        });
      }
      return;
    }
    if (wasConnected.current) {
      wasConnected.current = false;
      if (!switching.current) {
        storage.remove(CONNECTED_KEY);
        return;
      }
      switching.current = false;
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
  }, [
    networkId,
    wallet?.readyState,
    connected,
    connecting,
    connect,
    disconnect,
  ]);
  return null;
};

export default MidenFiReconnect;
