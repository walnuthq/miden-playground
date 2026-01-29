import { fromHex } from "viem";
import { fromBase64 } from "@/lib/utils";

// https://github.com/0xMiden/miden-faucet/blob/next/bin/faucet/frontend/app.js
// Function to find a valid nonce for proof of work using the new challenge format
export const findValidNonce = async ({
  challenge,
  target,
}: {
  challenge: string;
  target: number;
}) => {
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
        challengeBytes.length + nonceByteArray.length,
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

export const getPowChallenge = async ({
  backendUrl,
  recipient,
  amount,
}: {
  backendUrl: string;
  recipient: string;
  amount: string;
}) => {
  const response = await fetch(
    `${backendUrl}/pow?${new URLSearchParams({ amount, account_id: recipient })}`,
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

export const getTokens = async ({
  backendUrl,
  challenge,
  nonce,
  recipient,
  amount,
  isPrivateNote,
}: {
  backendUrl: string;
  challenge: string;
  nonce: number;
  recipient: string;
  amount: string;
  isPrivateNote: boolean;
}) => {
  const response = await fetch(
    `${backendUrl}/get_tokens?${new URLSearchParams({
      account_id: recipient,
      is_private_note: isPrivateNote ? "true" : "false",
      asset_amount: amount,
      challenge,
      nonce: nonce.toString(),
    })}`,
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

export const getNote = async ({
  backendUrl,
  noteId,
}: {
  backendUrl: string;
  noteId: string;
}) => {
  const response = await fetch(
    `${backendUrl}/get_note?${new URLSearchParams({ note_id: noteId })}`,
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to get note: ${message}`);
  }
  const result = await response.json();
  const { data_base64: dataBase64 } = result as { data_base64: string };
  return fromBase64(dataBase64);
};
