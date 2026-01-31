import { useState } from "react";
import { HandCoins } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import {
  MIDEN_FAUCET_API_URL,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils";
import {
  getPowChallenge,
  findValidNonce,
  getTokens,
  getNote,
} from "@/lib/miden-faucet";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const MintButton = () => {
  const { connectedWallet } = useAccounts();
  const [loading, setLoading] = useState(false);
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
          isPrivateNote: true,
        });
        console.log({ noteId, txId });
        const noteFileBytes = await getNote({
          backendUrl: MIDEN_FAUCET_API_URL,
          noteId,
        });
        const noteFileBlob = new Blob([noteFileBytes], {
          type: "application/octet-stream",
        });
        downloadBlob(noteFileBlob, "note.mno");
        setLoading(false);
      }}
    >
      {loading ? <Spinner /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
