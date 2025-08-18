"use client";
import { type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MidenWalletAdapter } from "@demox-labs/miden-wallet-adapter-miden";
import { WalletProvider } from "@demox-labs/miden-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/miden-wallet-adapter-reactui";
import GlobalContextProvider from "@/components/global-context/provider";

const walletAdapter = new MidenWalletAdapter({ appName: "Miden Playground" });

const Providers = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
  >
    <WalletProvider wallets={[walletAdapter]} autoConnect>
      <WalletModalProvider>
        <GlobalContextProvider>{children}</GlobalContextProvider>
      </WalletModalProvider>
    </WalletProvider>
  </NextThemesProvider>
);

export default Providers;
