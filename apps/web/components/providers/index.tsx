"use client";
import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  MidenFiSignerProvider,
  WalletModalProvider,
  PrivateDataPermission,
  AllowedPrivateData,
} from "@miden-sdk/miden-wallet-adapter";
import { MultiSignerProvider, SignerSlot } from "@miden-sdk/react/lazy";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SimpleAnalyticsProvider from "@/components/providers/simple-analytics-provider";
import { NetworkProvider } from "@/components/providers/network-provider";
import MidenProvider from "@/components/providers/miden-provider";
import ParaProvider from "@/components/providers/para-provider";
import MidenFiReconnect from "@/components/providers/midenfi-reconnect";
import GlobalContextProvider from "@/components/global-context/provider";

const queryClient = new QueryClient();

// Signer providers register with MultiSignerProvider through <SignerSlot />
// for the wallet dropdown. They sit inside MidenProvider: they load SDK classes
// when connecting, which needs the WASM module MidenProvider initializes, and
// MidenProvider keeps using the local keystore rather than the active signer.
const Providers = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    // defaultTheme="system"
    // enableSystem
    forcedTheme="light"
    disableTransitionOnChange
    enableColorScheme
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
                <SimpleAnalyticsProvider>
                  <ParaProvider queryClient={queryClient}>
                    <GlobalContextProvider>{children}</GlobalContextProvider>
                  </ParaProvider>
                </SimpleAnalyticsProvider>
              </WalletModalProvider>
            </MidenFiSignerProvider>
          </MultiSignerProvider>
        </MidenProvider>
      </NetworkProvider>
    </QueryClientProvider>
  </NextThemesProvider>
);

export default Providers;
