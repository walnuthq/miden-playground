import {
  type WebClient as WebClientType,
  type AccountId as WasmAccountId,
} from "@miden-sdk/miden-sdk/lazy";
import { fromHex } from "@/lib/utils";
import type { NetworkId } from "@/lib/types/network";
import { midenFaucetApiUrl } from "@/lib/constants";
import { clientGetAllInputNotes } from "@/lib/web-client";

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
  const challengeBytes = fromHex(challenge);

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

export const getMetadata = async (backendUrl: string) => {
  const response = await fetch(`${backendUrl}/get_metadata`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to get metadata: ${message}`);
  }
  const result = await response.json();
  // Since 0.17 the faucet owns no account: `id` is the node's funding service account
  // the notes are sent from, and `balance` is what it has left (absent when the funding
  // service is unreachable).
  const {
    version,
    id,
    decimals,
    explorer_url: explorerUrl,
    pow_load_difficulty: powLoadDifficulty,
    base_amount: baseAmount,
    balance,
  } = result as {
    version: string;
    id: string;
    decimals: number;
    explorer_url: string | null;
    pow_load_difficulty: number;
    base_amount: number;
    balance: number | null;
  };
  return {
    version,
    id,
    decimals,
    explorerUrl,
    powLoadDifficulty,
    baseAmount,
    balance,
  };
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
}: {
  backendUrl: string;
  challenge: string;
  nonce: number;
  recipient: string;
  amount: string;
}) => {
  const response = await fetch(
    `${backendUrl}/get_tokens?${new URLSearchParams({
      account_id: recipient,
      asset_amount: amount,
      challenge,
      nonce: nonce.toString(),
    })}`,
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to receive tokens: ${message}`);
  }
  // The faucet forwards the request to the node's funding service, which creates a public
  // P2ID note and includes it in its next funding transaction: there is no faucet
  // transaction, hence no transaction id.
  const result = await response.json();
  const { note_id: noteId } = result as { note_id: string };
  return { noteId };
};

export const requestFundingNote = async ({
  networkId,
  recipient,
  requestedAmount,
}: {
  networkId: NetworkId;
  recipient: WasmAccountId;
  requestedAmount?: number;
}) => {
  const backendUrl = midenFaucetApiUrl(networkId);
  const metadata = await getMetadata(backendUrl);
  const configuredAmount = process.env.NEXT_PUBLIC_MIDEN_FEE_AMOUNT?.trim();
  const amount =
    requestedAmount ??
    (configuredAmount ? Number(configuredAmount) : metadata.baseAmount);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(
      `Invalid fee-funding amount ${String(amount)}; expected a positive safe integer`,
    );
  }
  const { challenge, target } = await getPowChallenge({
    backendUrl,
    recipient: recipient.toString(),
    amount: amount.toString(),
  });
  const nonce = await findValidNonce({ challenge, target });
  return getTokens({
    backendUrl,
    challenge,
    nonce,
    recipient: recipient.toString(),
    amount: amount.toString(),
  });
};

// The funding service batches requests into its next funding transaction, so the note
// can take a while to be committed: wait up to 5 minutes like the faucet frontend does.
const FUNDING_NOTE_POLL_ATTEMPTS = 150;
const FUNDING_NOTE_POLL_INTERVAL_MS = 2000;

export const waitForFundingNote = async ({
  client,
  networkId,
  noteId,
  expectedFaucet,
}: {
  client: WebClientType;
  networkId: NetworkId;
  noteId: string;
  expectedFaucet: WasmAccountId;
}) => {
  for (let attempt = 0; attempt < FUNDING_NOTE_POLL_ATTEMPTS; attempt += 1) {
    const notes = await clientGetAllInputNotes({ client, networkId });
    const note = notes.find((n) => n.id()?.toString() === noteId);
    if (note?.inclusionProof()) {
      // The faucet metadata no longer names the issuing faucet, so check the note
      // actually carries the chain's native fee asset.
      const carriesFeeAsset = note
        .details()
        .assets()
        .fungibleAssets()
        .some(
          (asset) => asset.faucetId().toString() === expectedFaucet.toString(),
        );
      if (!carriesFeeAsset) {
        throw new Error(
          `Fee-funding note ${noteId} does not carry ${networkId}'s native fee asset ${expectedFaucet}`,
        );
      }
      return note;
    }
    if (attempt < FUNDING_NOTE_POLL_ATTEMPTS - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, FUNDING_NOTE_POLL_INTERVAL_MS),
      );
    }
  }
  throw new Error(
    `Fee-funding note ${noteId} was not found after ${FUNDING_NOTE_POLL_ATTEMPTS} sync attempts`,
  );
};
