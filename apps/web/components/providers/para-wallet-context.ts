"use client";
import { createContext, useContext } from "react";
import type { MidenClient } from "@miden-sdk/miden-sdk/lazy";

// Kept free of @miden-sdk/para-react imports: that package imports Para's
// stylesheet, and any route segment importing it gets its own copy of that
// stylesheet, loaded after globals.css, whose preflight then overrides the
// app's base rules (e.g. border colors). Only ParaProvider imports the package.
// Connection state comes from useMultiSigner(); this only carries what the
// signer interface doesn't expose.
export type ParaWallet = {
  address: string | null;
  // The Para MidenClient and the Miden account it set up for the EVM wallet,
  // null until Para is connected and the client is ready.
  client: MidenClient | null;
  accountId: string | null;
  // See ParaClient.takeSignError (lib/para-client.ts).
  takeSignError: () => unknown;
  // Recreates the Para MidenClient, e.g. after the client store it shares
  // with MidenProvider was replaced, so it sets the account up again.
  resetClient: () => void;
};

// null when Para isn't configured (no API key).
export const ParaWalletContext = createContext<ParaWallet | null>(null);

export const useParaWallet = () => useContext(ParaWalletContext);
