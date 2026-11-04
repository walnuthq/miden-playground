import {
  AllowedPrivateData,
  MidenFiSignerProvider,
  PrivateDataPermission,
  WalletModalProvider,
} from "@miden-sdk/miden-wallet-adapter";
import { MultiSignerProvider, SignerSlot } from "@miden-sdk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import GlobalContextProvider from "@/components/global-context/provider";
import MidenProvider from "@/components/providers/miden-provider";
import MidenFiReconnect from "@/components/providers/midenfi-reconnect";
import { NetworkProvider } from "@/components/providers/network-provider";
import ParaProvider from "@/components/providers/para-provider";
import useNetwork from "@/hooks/use-network";
import { walletAdapterNetworks } from "@/lib/miden-client";

const queryClient = new QueryClient();

// Bread Wallet connects to the sandbox's network. Not keyed by it: that would
// remount the app mid-`resetState`. MidenFiReconnect reconnects a connected
// wallet when the network changes instead.
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

// Signer providers register with MultiSignerProvider through <SignerSlot />
// for the wallet dropdown. They sit inside MidenProvider: they load SDK classes
// when connecting, which needs the WASM module MidenProvider initializes, and
// MidenProvider keeps using the local keystore rather than the active signer.
const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
    // Its anti-flash script never runs in a client-rendered app (index.html has
    // the equivalent): mark it as a data block so React doesn't warn about it.
    scriptProps={{ type: "application/json" }}
  >
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        {/* Above MidenProvider, which unmounts its children while the client
        re-initializes (e.g. on a network switch): the state queued for the
        new network (`nextState`, not persisted) has to survive it. */}
        <GlobalContextProvider>
          <MidenProvider>
            <MultiSignerProvider>
              <BreadWalletProvider>
                <SignerSlot />
                <MidenFiReconnect />
                <WalletModalProvider>
                  <ParaProvider queryClient={queryClient}>
                    {children}
                  </ParaProvider>
                </WalletModalProvider>
              </BreadWalletProvider>
            </MultiSignerProvider>
          </MidenProvider>
        </GlobalContextProvider>
      </NetworkProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default Providers;
