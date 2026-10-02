"use client";
import { createContext, useContext } from "react";

// Kept free of @miden-sdk/para-react imports: that package imports Para's
// stylesheet, and any route segment importing it gets its own copy of that
// stylesheet, loaded after globals.css, whose preflight then overrides the
// app's base rules (e.g. border colors). Only ParaProvider imports the package.
export type ParaWallet = {
  isConnected: boolean;
  address: string | null;
  openModal: () => void;
};

// null when Para isn't configured (no API key).
export const ParaWalletContext = createContext<ParaWallet | null>(null);

export const useParaWallet = () => useContext(ParaWalletContext);
