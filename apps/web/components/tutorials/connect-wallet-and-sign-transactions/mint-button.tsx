import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import { AccountId as WasmAccountId } from "@miden-sdk/miden-sdk";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import useNetwork from "@/hooks/use-network";
import { defaultInputNote } from "@/lib/utils/note";
import { Button } from "@workspace/ui/components/button";
import {
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  P2ID_NOTE_CODE,
  midenFaucetApiUrl,
  midenFaucetAccountId,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils/asset";
import { getPowChallenge, findValidNonce, getTokens } from "@/lib/miden-faucet";

const MintButton = () => {
  const { networkId } = useNetwork();
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
          backendUrl: midenFaucetApiUrl(networkId),
          recipient: connectedWallet.address,
          amount,
        });
        const nonce = await findValidNonce({ challenge, target });
        const { noteId, txId } = await getTokens({
          backendUrl: midenFaucetApiUrl(networkId),
          challenge,
          nonce,
          recipient: connectedWallet.address,
          amount,
          isPrivateNote: false,
        });
        console.log({ noteId, txId });
        if (connectedWallet?.isNew) {
          const accountId = WasmAccountId.fromHex(connectedWallet.id);
          addNote({
            ...defaultInputNote(),
            id: noteId,
            senderId: midenFaucetAccountId(networkId),
            scriptRoot: P2ID_NOTE_CODE,
            scriptId: "p2id",
            fungibleAssets: [
              { faucetId: midenFaucetAccountId(networkId), amount },
            ],
            storage: [
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
