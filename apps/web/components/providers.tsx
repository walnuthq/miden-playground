"use client";
import { type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  MidenWalletAdapter,
  WalletProvider,
  WalletModalProvider,
  PrivateDataPermission,
} from "@demox-labs/miden-wallet-adapter";
import { MidenSdkProvider } from "@/components/miden-sdk-context";
import GlobalContextProvider from "@/components/global-context/provider";
import { WebClientProvider } from "@/components/web-client-context";

const walletAdapter = new MidenWalletAdapter({ appName: "Miden Playground" });

const Providers = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
  >
    <WalletProvider
      wallets={[walletAdapter]}
      privateDataPermission={PrivateDataPermission.UponRequest}
      autoConnect
    >
      <WalletModalProvider>
        <MidenSdkProvider>
          <GlobalContextProvider>
            <WebClientProvider>{children}</WebClientProvider>
          </GlobalContextProvider>
        </MidenSdkProvider>
      </WalletModalProvider>
    </WalletProvider>
  </NextThemesProvider>
);

export default Providers;
