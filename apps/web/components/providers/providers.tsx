"use client";
import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  MidenWalletAdapter,
  WalletProvider,
  WalletModalProvider,
  PrivateDataPermission,
  AllowedPrivateData,
} from "@miden-sdk/miden-wallet-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SimpleAnalyticsProvider from "@/components/providers/simple-analytics-provider";
import { NetworkProvider } from "@/components/providers/network-provider";
import MidenProvider from "@/components/providers/miden-provider";
import GlobalContextProvider from "@/components/global-context/provider";

const walletAdapter = new MidenWalletAdapter({ appName: "Miden Playground" });
const queryClient = new QueryClient();

const Providers = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    // defaultTheme="system"
    // enableSystem
    forcedTheme="light"
    disableTransitionOnChange
    enableColorScheme
  >
    <WalletProvider
      wallets={[walletAdapter]}
      privateDataPermission={PrivateDataPermission.Auto}
      allowedPrivateData={AllowedPrivateData.All}
      autoConnect
    >
      <WalletModalProvider>
        <QueryClientProvider client={queryClient}>
          <SimpleAnalyticsProvider>
            <NetworkProvider>
              <MidenProvider>
                <GlobalContextProvider>{children}</GlobalContextProvider>
              </MidenProvider>
            </NetworkProvider>
          </SimpleAnalyticsProvider>
        </QueryClientProvider>
      </WalletModalProvider>
    </WalletProvider>
  </NextThemesProvider>
);

export default Providers;
