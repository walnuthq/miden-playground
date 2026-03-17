import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import {
  MIDEN_FAUCET_API_URL,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils";
import { getPowChallenge, findValidNonce, getTokens } from "@/lib/miden-faucet";

const MintButton = () => {
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
        const amount = parseAmount(
          "100",
          FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
        ).toString();
        const { challenge, target } = await getPowChallenge({
          backendUrl: MIDEN_FAUCET_API_URL,
          recipient: multisig.address,
          amount,
        });
        const nonce = await findValidNonce({ challenge, target });
        const { noteId, txId } = await getTokens({
          backendUrl: MIDEN_FAUCET_API_URL,
          challenge,
          nonce,
          recipient: multisig.address,
          amount,
          isPrivateNote: false,
        });
        console.log({ noteId, txId });
        setNoteId(noteId);
      }}
    >
      {loading ? <Spinner /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
