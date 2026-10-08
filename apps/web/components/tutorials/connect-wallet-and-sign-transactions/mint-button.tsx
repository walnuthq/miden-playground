import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";
import {
  NoteFile as WasmNoteFile,
  NoteId as WasmNoteId,
} from "@miden-sdk/miden-sdk/lazy";
import { useMiden } from "@miden-sdk/react/lazy";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { Button } from "@workspace/ui/components/button";
import { waitUntil } from "@/lib/utils";
import { requestTokens } from "@/lib/miden-faucet";
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
        try {
          const { noteId } = await requestTokens({
            networkId,
            recipient: connectedWallet.address,
          });
          console.info({ noteId });
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
