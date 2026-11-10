import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { FileInput } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useAccounts from "@/hooks/use-accounts";
import useConsumeNotes from "@/hooks/use-consume-notes";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";

const ConsumeNoteButton = ({
  inputNote,
  targetAccount,
}: {
  inputNote: InputNote;
  targetAccount: Account;
}) => {
  const { connectedWallet, isParaWallet } = useAccounts();
  const { consumeNote } = useConsumeNotes();
  const { createTransactionDialogOpen } = useTransactions();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!createTransactionDialogOpen) {
      setLoading(false);
    }
  }, [createTransactionDialogOpen]);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        setLoading(true);
        try {
          await consumeNote({ account: targetAccount, inputNote });
          // The dialog stays open (and `loading` on) only on the local path.
          if (
            isParaWallet(targetAccount) ||
            connectedWallet?.id === targetAccount.id ||
            targetAccount.multisig
          ) {
            setLoading(false);
          }
        } catch (error) {
          console.error(error);
          toast.error("Transaction failed.", {
            description: error instanceof Error ? error.message : String(error),
          });
          setLoading(false);
        }
      }}
      disabled={loading}
    >
      {loading ? <Spinner /> : <FileInput />}
      <span className="sr-only lg:not-sr-only">
        {loading
          ? "Consuming note…"
          : `Consume note with ${targetAccount.name}`}
      </span>
    </Button>
  );
};

export default ConsumeNoteButton;
