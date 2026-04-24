import { useState } from "react";
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
import {
  getPowChallenge,
  findValidNonce,
  getTokens,
  getNote,
} from "@/lib/miden-faucet";
import useNotes from "@/hooks/use-notes";
import { useMiden } from "@miden-sdk/react";

// const downloadBlob = (blob: Blob, fileName: string) => {
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.style.display = "none";
//   a.href = url;
//   a.download = fileName;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   URL.revokeObjectURL(url);
// };

const MintButton = () => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { connectedWallet } = useAccounts();
  const { importNoteFromFile } = useNotes();
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
        const { noteId, txId } = await getTokens({
          backendUrl: midenFaucetApiUrl(networkId),
          challenge,
          nonce,
          recipient: connectedWallet.address,
          amount,
          isPrivateNote: true,
        });
        console.log({ noteId, txId });
        const noteFileBytes = await getNote({
          backendUrl: midenFaucetApiUrl(networkId),
          noteId,
        });
        await importNoteFromFile(noteFileBytes);
        // const noteFileBlob = new Blob([noteFileBytes], {
        //   type: "application/octet-stream",
        // });
        // downloadBlob(noteFileBlob, "note.mno");
        setLoading(false);
      }}
    >
      {loading ? <Spinner /> : <HandCoins />}
      {loading ? "Minting…" : "Mint"}
    </Button>
  );
};

export default MintButton;
