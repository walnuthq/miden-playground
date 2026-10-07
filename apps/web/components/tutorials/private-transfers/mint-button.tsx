import { useState } from "react";
import { HandCoins } from "lucide-react";
import {
  NoteFile as WasmNoteFile,
  NoteId as WasmNoteId,
} from "@miden-sdk/miden-sdk/lazy";
import { useMiden } from "@miden-sdk/react/lazy";
import { Spinner } from "@workspace/ui/components/spinner";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
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
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { connectedWallet } = useAccounts();
  const [loading, setLoading] = useState(false);
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
        const { noteId } = await getTokens({
          backendUrl: midenFaucetApiUrl(networkId),
          challenge,
          nonce,
          recipient: connectedWallet.address,
          amount,
        });
        console.info({ noteId });
        // The faucet only creates public notes, so wait for the note to be committed
        // and import it by id.
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
