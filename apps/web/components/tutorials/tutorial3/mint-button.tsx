import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import {
  MIDEN_FAUCET_API_URL,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils";
import { fromHex } from "viem";

// https://github.com/0xMiden/miden-faucet/blob/next/bin/faucet/frontend/app.js
// Function to find a valid nonce for proof of work using the new challenge format
const findValidNonce = async (challenge: string, target: number) => {
  let nonce = 0;
  const targetNum = BigInt(target);
  const challengeBytes = fromHex(`0x${challenge}`, "bytes");

  while (true) {
    // Generate a random nonce
    nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    try {
      // Convert nonce to 8-byte big-endian format to match backend
      const nonceBytes = new ArrayBuffer(8);
      const nonceView = new DataView(nonceBytes);
      nonceView.setBigUint64(0, BigInt(nonce), false); // false = big-endian
      const nonceByteArray = new Uint8Array(nonceBytes);

      // Combine challenge and nonce
      const combined = new Uint8Array(
        challengeBytes.length + nonceByteArray.length
      );
      combined.set(challengeBytes);
      combined.set(nonceByteArray, challengeBytes.length);

      // Compute SHA-256 hash using Web Crypto API
      const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
      const hashArray = new Uint8Array(hashBuffer);

      // Take the first 8 bytes of the hash and parse them as u64 in big-endian
      const first8Bytes = hashArray.slice(0, 8);
      const dataView = new DataView(first8Bytes.buffer);
      const digest = dataView.getBigUint64(0, false); // false = big-endian

      // Check if the hash is less than the target
      if (digest < targetNum) {
        return nonce;
      }
    } catch (error) {
      console.error("Error computing hash:", error);
      throw new Error("Failed to compute hash");
    }

    // Yield to browser to prevent freezing
    if (nonce % 1000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
};

const getPowChallenge = async (
  backendUrl: string,
  recipient: string,
  amount: string
) => {
  const response = await fetch(
    `${backendUrl}/pow?${new URLSearchParams({ amount, account_id: recipient })}`
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to get PoW challenge: ${message}`);
  }
  const result = await response.json();
  const { challenge, target } = result as {
    challenge: string;
    target: number;
  };
  return { challenge, target };
};

const getTokens = async (
  backendUrl: string,
  challenge: string,
  nonce: number,
  recipient: string,
  amount: string,
  isPrivateNote: boolean
) => {
  const response = await fetch(
    `${backendUrl}/get_tokens?${new URLSearchParams({
      account_id: recipient,
      is_private_note: isPrivateNote ? "true" : "false",
      asset_amount: amount,
      challenge,
      nonce: nonce.toString(),
    })}`
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to receive tokens: ${message}`);
  }
  const result = await response.json();
  const { note_id: noteId, tx_id: txId } = result as {
    note_id: string;
    tx_id: string;
  };
  return { noteId, txId };
};

const MintButton = () => {
  const { connectedWallet } = useAccounts();
  const [loading, setLoading] = useState(false);
  const [noteId, setNoteId] = useState("");
  useEffect(() => {
    if (connectedWallet?.consumableNoteIds.includes(noteId)) {
      setNoteId("");
      setLoading(false);
    }
  }, [connectedWallet?.consumableNoteIds, noteId]);
  return (
    <Button
      disabled={!connectedWallet || loading}
      onClick={async () => {
        if (!connectedWallet) {
          return;
        }
        setLoading(true);
        const amount = parseAmount(
          "100",
          FUNGIBLE_FAUCET_DEFAULT_DECIMALS
        ).toString();
        const { challenge, target } = await getPowChallenge(
          MIDEN_FAUCET_API_URL,
          connectedWallet.address,
          amount
        );
        const nonce = await findValidNonce(challenge, target);
        const { noteId, txId } = await getTokens(
          MIDEN_FAUCET_API_URL,
          challenge,
          nonce,
          connectedWallet.address,
          amount,
          false
        );
        setNoteId(noteId);
        console.log({ txId });
      }}
    >
      {loading ? <Spinner /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
