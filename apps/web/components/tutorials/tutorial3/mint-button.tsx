import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { defaultInputNote } from "@/lib/types/note";
import { Button } from "@workspace/ui/components/button";
import {
  MIDEN_FAUCET_API_URL,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  MIDEN_FAUCET_ACCOUNT_ID,
  P2ID_NOTE_CODE,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { getPowChallenge, findValidNonce, getTokens } from "@/lib/miden-faucet";

const MintButton = () => {
  const {
    midenSdk: { AccountId },
  } = useMidenSdk();
  const { connectedWallet } = useAccounts();
  const { addNote } = useNotes();
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
          FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
        ).toString();
        const { challenge, target } = await getPowChallenge({
          backendUrl: MIDEN_FAUCET_API_URL,
          recipient: connectedWallet.address,
          amount,
        });
        const nonce = await findValidNonce({ challenge, target });
        const { noteId, txId } = await getTokens({
          backendUrl: MIDEN_FAUCET_API_URL,
          challenge,
          nonce,
          recipient: connectedWallet.address,
          amount,
          isPrivateNote: false,
        });
        console.log({ noteId, txId });
        if (connectedWallet?.isNew) {
          const accountId = AccountId.fromHex(connectedWallet.id);
          addNote({
            ...defaultInputNote(),
            id: noteId,
            senderId: MIDEN_FAUCET_ACCOUNT_ID,
            scriptRoot: P2ID_NOTE_CODE,
            scriptId: "p2id",
            fungibleAssets: [{ faucetId: MIDEN_FAUCET_ACCOUNT_ID, amount }],
            inputs: [
              accountId.suffix().toString(),
              accountId.prefix().toString(),
            ],
          });
          setLoading(false);
        } else {
          setNoteId(noteId);
        }
      }}
    >
      {loading ? <Spinner /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
