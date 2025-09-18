import { useState, useEffect } from "react";
import { HandCoins, RotateCw } from "lucide-react";
import useAccounts from "@/hooks/use-accounts";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { Button } from "@workspace/ui/components/button";
import { sha3_256 } from "js-sha3";
import { useInterval } from "usehooks-ts";
import useGlobalContext from "@/components/global-context/hook";
import { FUNGIBLE_FAUCET_DEFAULT_DECIMALS } from "@/lib/constants";

// Function to find a valid nonce for proof of work using the new challenge format
const findValidNonce = async (challenge: string, target: string) => {
  let nonce = 0;
  const targetNum = BigInt(target);

  while (true) {
    // Generate a random nonce
    nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    try {
      // Compute hash using SHA3 with the challenge and nonce
      const hash = sha3_256.create();
      hash.update(challenge); // Use the hex-encoded challenge string directly

      // Convert nonce to 8-byte big-endian format to match backend
      const nonceBytes = new ArrayBuffer(8);
      const nonceView = new DataView(nonceBytes);
      nonceView.setBigUint64(0, BigInt(nonce), false); // false = big-endian
      const nonceByteArray = new Uint8Array(nonceBytes);
      hash.update(nonceByteArray);

      // Take the first 8 bytes of the hash and parse them as u64 in big-endian
      const digest = BigInt(`0x${hash.hex().slice(0, 16)}`);

      // Check if the hash is less than the target
      if (digest < targetNum) {
        return nonce;
      }
    } catch (error) {
      console.error("Error computing hash:", error);
      // throw new Error("Failed to compute hash: " + error.message);
      throw new Error("Failed to compute hash");
    }

    // Yield to browser to prevent freezing
    if (nonce % 1000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
};

const powChallenge = async (accountId: string) => {
  const powResponse = await fetch(
    `https://faucet.testnet.miden.io/pow?${new URLSearchParams({ account_id: accountId })}`
  );
  if (!powResponse.ok) {
    // const message = await powResponse.text();
    return { challenge: "", nonce: 0 };
  }
  const powData = await powResponse.json();
  const { challenge, target } = powData as {
    challenge: string;
    target: string;
  };
  const nonce = await findValidNonce(challenge, target);
  return { challenge, nonce };
};

const requestNote = async (
  accountId: string,
  amount: bigint,
  challenge: string,
  nonce: number
) => {
  try {
    const noteDataRegex = /"data_base64":"([^"]+)"/;
    const noteIdRegex = /"note_id":"([^"]+)"/;
    let noteData = "";
    let noteId = "";
    const response = await fetch(
      `https://faucet.testnet.miden.io/get_tokens?${new URLSearchParams({
        account_id: accountId,
        is_private_note: "false",
        asset_amount: amount.toString(),
        challenge,
        nonce: nonce.toString(),
      })}`,
      {
        headers: { "Content-Type": "text/event-stream" },
      }
    );
    const text = await response.text();
    const noteDataMatch = noteDataRegex.exec(text);
    const noteIdMatch = noteIdRegex.exec(text);
    if (noteDataMatch) {
      noteData = noteDataMatch[1]!;
    }
    if (noteIdMatch) {
      noteId = noteIdMatch[1]!;
    }
    return { noteData, noteId };
  } catch (error) {
    console.error("Error:", error);
  }
};

const MintButton = () => {
  const { wallet, accountId } = useWallet();
  const { syncState } = useGlobalContext();
  const { accounts } = useAccounts();
  const account = accounts.find(({ address }) => address === accountId);
  const [loading, setLoading] = useState(false);
  const [noteId, setNoteId] = useState("");
  useInterval(
    () => {
      const waitForSyncState = async () => {
        await syncState();
      };
      waitForSyncState();
    },
    noteId === "" || account?.consumableNoteIds.includes(noteId) ? null : 1000
  );
  useEffect(() => {
    if (account?.consumableNoteIds.includes(noteId)) {
      setNoteId("");
      setLoading(false);
    }
  }, [account?.consumableNoteIds, noteId]);
  return (
    <Button
      disabled={!wallet || !account || loading}
      onClick={async () => {
        if (!wallet || !account) {
          return;
        }
        setLoading(true);
        const { challenge, nonce } = await powChallenge(account.id);
        const noteResponse = await requestNote(
          account.id,
          100n * 10n ** FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
          challenge,
          nonce
        );
        setNoteId(noteResponse?.noteId ?? "");
      }}
    >
      {loading ? <RotateCw className="animate-spin" /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
