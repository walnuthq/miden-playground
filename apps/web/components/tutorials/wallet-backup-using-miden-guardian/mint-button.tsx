import { useState, useEffect } from "react";
import { HandCoins } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import {
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  midenFaucetApiUrl,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils/asset";
import { getPowChallenge, findValidNonce, getTokens } from "@/lib/miden-faucet";

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
        const amount = parseAmount(
          "100",
          FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
        ).toString();
        const { challenge, target } = await getPowChallenge({
          backendUrl: midenFaucetApiUrl(networkId),
          recipient: multisig.address,
          amount,
        });
        const nonce = await findValidNonce({ challenge, target });
        const { noteId, txId } = await getTokens({
          backendUrl: midenFaucetApiUrl(networkId),
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
