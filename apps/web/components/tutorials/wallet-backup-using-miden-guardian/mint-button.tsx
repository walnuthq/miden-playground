import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { HandCoins } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { requestTokens } from "@/lib/miden-faucet";

const MintButton = () => {
  const { networkId } = useNetwork();
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const [loading, setLoading] = useState(false);
  const [noteId, setNoteId] = useState("");
  useEffect(() => {
    if (multisig?.consumableNoteIds.includes(noteId)) {
      setNoteId("");
      setLoading(false);
    }
  }, [multisig?.consumableNoteIds, noteId]);
  return (
    <Button
      disabled={!multisig || loading}
      onClick={async () => {
        if (!multisig) {
          return;
        }
        setLoading(true);
        try {
          const { noteId } = await requestTokens({
            networkId,
            recipient: multisig.address,
          });
          console.info({ noteId });
          setNoteId(noteId);
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
