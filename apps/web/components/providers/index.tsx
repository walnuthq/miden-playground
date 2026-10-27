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

const queryClient = new QueryClient();

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
        <MidenProvider>
          <MultiSignerProvider>
            <MidenFiSignerProvider
              appName="Miden Playground"
              privateDataPermission={PrivateDataPermission.Auto}
              allowedPrivateData={AllowedPrivateData.All}
              // No autoConnect, see MidenFiReconnect.
            >
              <SignerSlot />
              <MidenFiReconnect />
              <WalletModalProvider>
                <ParaProvider queryClient={queryClient}>
                  <GlobalContextProvider>{children}</GlobalContextProvider>
                </ParaProvider>
              </WalletModalProvider>
            </MidenFiSignerProvider>
          </MultiSignerProvider>
        </MidenProvider>
      </NetworkProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default Providers;
