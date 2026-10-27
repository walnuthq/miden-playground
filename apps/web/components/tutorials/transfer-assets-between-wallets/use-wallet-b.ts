import { AccountId as WasmAccountId } from "@miden-sdk/miden-sdk";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import {
  midenFaucetAccountId,
  midenFaucetFunderAccountId,
  P2ID_NOTE_CODE,
} from "@/lib/constants";
import { requestFundingNote } from "@/lib/miden-faucet";
import type { NetworkId } from "@/lib/types/network";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

// Every user gets their own Wallet B: a shared one collects every note ever
// sent to it, which the client then has to sync. It's created unfunded when the
// tutorial starts, and the faucet is asked for a note carrying the fee asset.
// Wallet B consumes that note together with the MDN note in step 4, paying its
// fee out of it.

type FeeNoteRequest = "idle" | "requesting" | "requested" | "failed";

// Kept outside React: each step mounts its own components, and the request has
// to outlive them.
let creatingWallet = false;
let feeNoteRequest: FeeNoteRequest = "idle";
const listeners = new Set<() => void>();

const setFeeNoteRequest = (value: FeeNoteRequest) => {
  feeNoteRequest = value;
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const requestFeeNote = async (networkId: NetworkId, walletId: string) => {
  setFeeNoteRequest("requesting");
  try {
    await requestFundingNote({
      networkId,
      recipient: WasmAccountId.fromHex(walletId),
    });
    setFeeNoteRequest("requested");
  } catch (error) {
    console.error(error);
    toast.error("Failed to request fees for Wallet B.", {
      description: error instanceof Error ? error.message : String(error),
    });
    setFeeNoteRequest("failed");
  }
};

const useWalletB = () => {
  const { networkId } = useNetwork();
  const { wallets, newWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const request = useSyncExternalStore(
    subscribe,
    () => feeNoteRequest,
    () => feeNoteRequest,
  );
  const walletA = wallets.find(({ name }) => name === "Wallet A");
  const walletB = wallets.find(({ name }) => name === "Wallet B");
  const feeNote = inputNotes.find(
    ({ senderId, scriptRoot, storage, fungibleAssets }) =>
      !!walletB &&
      senderId === midenFaucetFunderAccountId(networkId) &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1] ?? "", storage[0] ?? "") ===
        walletB.id &&
      fungibleAssets.some(
        ({ faucetId }) => faucetId === midenFaucetAccountId(networkId),
      ),
  );
  // Wallet A comes with the tutorial state, once its store has been imported.
  const storeReady = !!walletA;
  useEffect(() => {
    if (!storeReady || walletB || creatingWallet || request === "failed") {
      return;
    }
    creatingWallet = true;
    // Holds off the request below until the wallet's own one has started.
    setFeeNoteRequest("requesting");
    newWallet({ name: "Wallet B", storageMode: "public", fund: false })
      .then((wallet) => requestFeeNote(networkId, wallet.id))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to create Wallet B.", {
          description: error instanceof Error ? error.message : String(error),
        });
        setFeeNoteRequest("failed");
      })
      .finally(() => {
        creatingWallet = false;
      });
  }, [storeReady, walletB, request, newWallet, networkId]);
  // Requests the fee note again after a reload interrupted the first request
  // (the status above only lives in memory), or when the user retries a failed
  // one. A duplicate is harmless: Wallet B consumes it along with the others.
  const needsFeeNote = !!walletB && walletB.nonce === 0 && !feeNote;
  useEffect(() => {
    // Several steps' components run this hook: check the live status, not the
    // one they rendered with.
    if (
      walletB &&
      needsFeeNote &&
      request === "idle" &&
      feeNoteRequest === "idle"
    ) {
      requestFeeNote(networkId, walletB.id);
    }
  }, [walletB, needsFeeNote, request, networkId]);
  return {
    walletA,
    walletB,
    feeNote,
    // Wallet B can pay for its consume transaction once the fee note is
    // committed, or once it has consumed it.
    funded: !!feeNote && feeNote.state !== "expected",
    // Retrying creates Wallet B, if that's what failed, then requests the note.
    failed: request === "failed",
    retry: () => setFeeNoteRequest("idle"),
  };
};

export default useWalletB;
