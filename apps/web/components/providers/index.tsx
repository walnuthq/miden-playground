import {
  AllowedPrivateData,
  MidenFiSignerProvider,
  PrivateDataPermission,
  WalletModalProvider,
} from "@miden-sdk/miden-wallet-adapter";
import { MultiSignerProvider, SignerSlot } from "@miden-sdk/react";
import type { ReactNode } from "react";
import MidenProvider, {
  MidenClientGate,
} from "@/components/providers/miden-provider";
import MidenFiReconnect from "@/components/providers/midenfi-reconnect";
import ParaProvider, {
  ParaWalletProvider,
} from "@/components/providers/para-provider";
import PauseSyncWhenHidden from "@/components/providers/pause-sync-when-hidden";
import useNetwork from "@/hooks/use-network";
import { walletAdapterNetworks } from "@/lib/miden-client";

// Bread Wallet connects to the sandbox's network. Not keyed by it: that would
// remount the providers below it, and the page, mid-`resetState`.
// MidenFiReconnect reconnects a connected wallet when the network changes
// instead.
const BreadWalletProvider = ({ children }: { children: ReactNode }) => {
  const { networkId } = useNetwork();
  return (
    <MidenFiSignerProvider
      appName="Miden Playground"
      network={walletAdapterNetworks[networkId]}
      privateDataPermission={PrivateDataPermission.Auto}
      allowedPrivateData={AllowedPrivateData.All}
      // No autoConnect, see MidenFiReconnect.
    >
      {children}
    </MidenFiSignerProvider>
  );
};

// The SDK-bound providers, in RootLayout (a lazy route: importing the SDK
// awaits the WASM). The SDK-free ones they rely on (theme, query client,
// network, app state) are `OuterProviders`, around the router, so the app
// shell has them before this module loads.
//
// Signer providers register with MultiSignerProvider through <SignerSlot />
// for the wallet dropdown. They sit inside MidenProvider: they load SDK classes
// when connecting, which needs the WASM module MidenProvider initializes, and
// MidenProvider keeps using the local keystore rather than the active signer.
// And above MidenClientGate, which shows the app shell in place of the page
// while the client initializes: they stay mounted, with their connections,
// across a network switch (which re-initializes the client).
const Providers = ({ children }: { children: ReactNode }) => (
  <MidenProvider>
    <MultiSignerProvider>
      <BreadWalletProvider>
        <SignerSlot />
        <MidenFiReconnect />
        <PauseSyncWhenHidden />
        <WalletModalProvider>
          <ParaProvider>
            <MidenClientGate>
              <ParaWalletProvider>{children}</ParaWalletProvider>
            </MidenClientGate>
          </ParaProvider>
        </WalletModalProvider>
      </BreadWalletProvider>
    </MultiSignerProvider>
  </MidenProvider>
);

export default Providers;
