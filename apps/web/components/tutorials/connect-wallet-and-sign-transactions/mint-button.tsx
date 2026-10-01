import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import {
  NoteFile as WasmNoteFile,
  NoteId as WasmNoteId,
} from "@miden-sdk/miden-sdk/lazy";
import { useMiden } from "@miden-sdk/react/lazy";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { Button } from "@workspace/ui/components/button";
import {
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  midenFaucetApiUrl,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils/asset";
import { waitUntil } from "@/lib/utils";
import { getPowChallenge, findValidNonce, getTokens } from "@/lib/miden-faucet";
import { clientGetNotesById } from "@/lib/web-client";

const MintButton = () => {
  const { client } = useMiden();
  const { networkId } = useNetwork();
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
        if (!client || !connectedWallet) {
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
        console.info({ noteId, txId });
        await waitUntil(async () => {
          const wasmFetchedNotes = await clientGetNotesById({
            networkId,
            noteIds: [noteId],
          });
          return wasmFetchedNotes.length > 0;
        });
        await client.importNoteFile(
          WasmNoteFile.fromNoteId(WasmNoteId.fromHex(noteId)),
        );
        setLoading(false);
      }}
    >
      {loading ? <Spinner /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
