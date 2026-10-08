import { useState } from "react";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";
import {
  NoteFile as WasmNoteFile,
  NoteId as WasmNoteId,
} from "@miden-sdk/miden-sdk/lazy";
import { useMiden } from "@miden-sdk/react/lazy";
import { Spinner } from "@workspace/ui/components/spinner";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import { waitUntil } from "@/lib/utils";
import { requestTokens } from "@/lib/miden-faucet";
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
        try {
          const { noteId } = await requestTokens({
            networkId,
            recipient: connectedWallet.address,
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
        } catch (error) {
          console.error(error);
          toast.error("Failed to request tokens from the faucet.", {
            description: error instanceof Error ? error.message : String(error),
          });
          setLoading(false);
        }
      }}
    >
      {loading ? <Spinner /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
