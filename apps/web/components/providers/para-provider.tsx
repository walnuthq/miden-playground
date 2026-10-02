"use client";
import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import {
  ParaSignerProvider,
  useModal,
  useParaSigner,
} from "@miden-sdk/para-react";
import { ParaWalletContext } from "@/components/providers/para-wallet-context";

const ParaWalletBridge = ({ children }: { children: ReactNode }) => {
  const { isConnected, wallet } = useParaSigner();
  const { openModal } = useModal();
  return (
    <ParaWalletContext
      value={{
        isConnected,
        address: wallet?.address ?? null,
        openModal: () => openModal(),
      }}
    >
      {children}
    </ParaWalletContext>
  );
};

// Mounted inside MidenProvider rather than around it: as an ancestor it would
// become MidenProvider's external keystore, holding the client back until Para
// connects and moving it to a per-wallet store. Para only drives the wallet
// connection here.
const ParaProvider = ({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) =>
  process.env.NEXT_PUBLIC_PARA_API_KEY ? (
    <ParaSignerProvider
      apiKey={process.env.NEXT_PUBLIC_PARA_API_KEY}
      environment={process.env.NEXT_PUBLIC_PARA_ENVIRONMENT ?? "BETA"}
      appName="Miden Playground"
      queryClient={queryClient}
      // Only Para's embedded wallets count as connected, so external wallets
      // are turned off; with no partner list Para would load every connector.
      paraProviderConfig={{ externalWalletConfig: { wallets: [] } }}
    >
      <ParaWalletBridge>{children}</ParaWalletBridge>
    </ParaSignerProvider>
  ) : (
    children
  );

export default ParaProvider;
