"use client";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { ParaWeb, Wallet } from "@getpara/web-sdk";
import { ParaSignerProvider, useParaSigner } from "@miden-sdk/para-react";
import { SignerSlot } from "@miden-sdk/react/lazy";
import { ParaWalletContext } from "@/components/providers/para-wallet-context";
import useNetwork from "@/hooks/use-network";
import { createParaClient, type ParaClient } from "@/lib/para-client";

// Creates the Para MidenClient once per mount (see lib/para-client.ts); it's
// remounted (keyed) for a new wallet, network or reset, and terminates its
// client when unmounted.
const ParaClientLoader = ({
  para,
  wallet,
  onReady,
}: {
  para: ParaWeb;
  wallet: Wallet;
  onReady: (paraClient: ParaClient | null) => void;
}) => {
  const { networkId } = useNetwork();
  const [initialProps] = useState({ para, wallet, networkId });
  useEffect(() => {
    let cancelled = false;
    let paraClient: ParaClient | null = null;
    createParaClient(initialProps)
      .then((createdParaClient) => {
        if (cancelled) {
          createdParaClient.client.terminate();
          return;
        }
        paraClient = createdParaClient;
        onReady(createdParaClient);
      })
      .catch((error) => console.error("ERROR: createParaClient", error));
    return () => {
      cancelled = true;
      if (paraClient) {
        onReady(null);
        paraClient.client.terminate();
      }
    };
  }, [initialProps, onReady]);
  return null;
};

const ParaWalletBridge = ({ children }: { children: ReactNode }) => {
  const { para, wallet } = useParaSigner();
  const { networkId } = useNetwork();
  const [paraClient, setParaClient] = useState<ParaClient | null>(null);
  const [epoch, setEpoch] = useState(0);
  const resetClient = useCallback(() => setEpoch((epoch) => epoch + 1), []);
  const paraWallet = useMemo(
    () => ({
      address: wallet?.address ?? null,
      client: paraClient?.client ?? null,
      accountId: paraClient?.accountId ?? null,
      takeSignError: paraClient?.takeSignError ?? (() => null),
      resetClient,
    }),
    [wallet?.address, paraClient, resetClient],
  );
  return (
    <ParaWalletContext value={paraWallet}>
      {wallet && (
        <ParaClientLoader
          key={`${wallet.id}:${networkId}:${epoch}`}
          para={para}
          wallet={wallet}
          onReady={setParaClient}
        />
      )}
      {children}
    </ParaWalletContext>
  );
};

// Mounted inside MidenProvider rather than around it: as an ancestor it would
// become MidenProvider's external keystore, holding the client back until Para
// connects and moving it to a per-wallet store. Para only drives the wallet
// connection here, registered with MultiSignerProvider through <SignerSlot />.
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
      <SignerSlot />
      <ParaWalletBridge>{children}</ParaWalletBridge>
    </ParaSignerProvider>
  ) : (
    children
  );

export default ParaProvider;
