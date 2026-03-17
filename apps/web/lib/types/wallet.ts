import type { SignatureScheme } from "@openzeppelin/miden-multisig-client";

export type WalletSource = "local" | "para" | "miden-wallet";

export type ExternalWalletState = {
  source: WalletSource;
  connected: boolean;
  publicKey: string | null;
  commitment: string | null;
  scheme: SignatureScheme | null;
};
