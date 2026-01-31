"use client";
import { type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  MidenWalletAdapter,
  WalletProvider,
  WalletModalProvider,
  PrivateDataPermission,
  AllowedPrivateData,
} from "@demox-labs/miden-wallet-adapter";
// import { ParaProvider } from "@getpara/react-sdk";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MidenSdkProvider } from "@/components/miden-sdk-context";
import GlobalContextProvider from "@/components/global-context/provider";
import { WebClientProvider } from "@/components/web-client-context";

const walletAdapter = new MidenWalletAdapter({ appName: "Miden Playground" });
// const queryClient = new QueryClient();

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
      // privateDataPermission={PrivateDataPermission.Auto}
      privateDataPermission={PrivateDataPermission.Auto}
      allowedPrivateData={AllowedPrivateData.All}
      autoConnect
    >
      <WalletModalProvider>
        {/*<QueryClientProvider client={queryClient}>
          <ParaProvider
            paraClientConfig={{
              apiKey: "beta_4054315d8c318e5274cce0e8179efb6d",
            }}
            config={{ appName: "Miden Playground" }}
          >*/}
        <MidenSdkProvider>
          <GlobalContextProvider>
            <WebClientProvider>{children}</WebClientProvider>
          </GlobalContextProvider>
        </MidenSdkProvider>
        {/*</ParaProvider>
        </QueryClientProvider>*/}
      </WalletModalProvider>
    </WalletProvider>
  </NextThemesProvider>
);

export default Providers;
