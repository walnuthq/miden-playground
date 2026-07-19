"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  type MessageSignerWalletAdapter,
  WalletAdapterNetwork,
  PrivateDataPermission,
} from "@miden-sdk/miden-wallet-adapter";
import { PublicKeyFormat } from "@openzeppelin/miden-multisig-client";
import type { ExternalWalletState } from "@/lib/types/wallet";

export function useMidenWallet(adapter: MessageSignerWalletAdapter | null) {
  const [session, setSession] = useState<ExternalWalletState>({
    source: "miden-wallet",
    connected: false,
    publicKey: null,
    commitment: null,
    scheme: null,
  });
  const [connectError, setConnectError] = useState<string | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    if (!adapter) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleConnect = (_address: string) => {
      const pk = adapter.publicKey;
      if (!pk) {
        setConnectError(
          "Miden Wallet connected but did not provide a public key",
        );
        return;
      }
      const { scheme, publicKeyHex, commitment } = PublicKeyFormat.parse(pk);
      if (!commitment) {
        setConnectError(
          `Failed to derive commitment from ${scheme} public key (len=${pk.length})`,
        );
        return;
      }
      // The wallet exposes only a 32-byte Poseidon2 commitment, which is
      // identical for both schemes, so PublicKeyFormat.parse cannot tell them
      // apart and guesses falcon. Miden Wallet signs ECDSA (its signatures
      // carry the EcdsaK256Keccak tag 0x01), so the guess is wrong and the
      // server would verify a 65-byte r||s||v with the falcon parser.
      const resolvedScheme = pk.length === 32 ? "ecdsa" : scheme;
      setConnectError(null);
      setSession({
        source: "miden-wallet",
        connected: true,
        publicKey: publicKeyHex,
        commitment,
        scheme: resolvedScheme,
      });
    };

    const handleDisconnect = () => {
      setConnectError(null);
      setSession((prev) => ({
        ...prev,
        connected: false,
        publicKey: null,
        commitment: null,
        scheme: null,
      }));
    };

    const handleError = (err: Error) => {
      setConnectError(err.message || err.name || "Unknown wallet error");
    };

    adapter.on("connect", handleConnect);
    adapter.on("disconnect", handleDisconnect);
    adapter.on("error", handleError);

    if (adapter.connected && adapter.address) {
      handleConnect(adapter.address);
    }

    return () => {
      adapter.off("connect", handleConnect);
      adapter.off("disconnect", handleDisconnect);
      adapter.off("error", handleError);
    };
  }, [adapter]);

  const connect = useCallback(async () => {
    if (!adapter || connectingRef.current) return;
    connectingRef.current = true;
    try {
      await adapter.connect(
        PrivateDataPermission.UponRequest,
        WalletAdapterNetwork.Testnet,
      );
    } finally {
      connectingRef.current = false;
    }
  }, [adapter]);

  const disconnect = useCallback(async () => {
    if (!adapter) return;
    await adapter.disconnect();
  }, [adapter]);

  const signBytes = useCallback(
    async (
      data: Uint8Array,
      kind: "word" | "signingInputs",
    ): Promise<Uint8Array> => {
      if (!adapter) throw new Error("Miden Wallet not connected");
      return adapter.signBytes(data, kind);
    },
    [adapter],
  );

  return { session, connect, disconnect, signBytes, connectError };
}
