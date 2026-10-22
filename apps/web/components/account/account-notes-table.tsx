import {
  ConsumeTransaction,
  type MidenWalletAdapter,
  useWallet,
} from "@miden-sdk/miden-wallet-adapter";
import { normalizeAccountId, useMiden } from "@miden-sdk/react/lazy";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { CircleCheckBig, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import AccountAddress from "@/components/lib/account-address";
import NoteId from "@/components/lib/note-id";
import useAccounts from "@/hooks/use-accounts";
import useMultisig from "@/hooks/use-multisig";
import useNotes from "@/hooks/use-notes";
import useParaTransaction from "@/hooks/use-para-transaction";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";
import { fromBase64 } from "@/lib/utils";
import { formatAmount } from "@/lib/utils/asset";

const NoteActionsCell = ({
  account,
  inputNote,
}: {
  account: Account;
  inputNote: InputNote;
}) => {
  const { client } = useMiden();
  const { wallet } = useWallet();
  const { loadMultisig, createConsumeNotesProposal } = useMultisig();
  const { faucets, connectedWallet, isParaWallet } = useAccounts();
  const { consumeWithPara } = useParaTransaction();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const [loading, setLoading] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0" disabled={loading}>
          <span className="sr-only">{loading ? "Loading" : "Open menu"}</span>
          {loading ? <Spinner /> : <MoreVertical className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            try {
              if (isParaWallet(account)) {
                setLoading(true);
                await consumeWithPara({ noteIds: [inputNote.id] });
              } else if (connectedWallet?.id === account.id) {
                if (!client) {
                  throw new Error("MidenClient not ready");
                }
                const [fungibleAsset] = inputNote.fungibleAssets;
                const faucet = faucets.find(
                  ({ id }) => id === fungibleAsset?.faucetId,
                );
                if (!wallet || !fungibleAsset || !faucet) {
                  return;
                }
                const adapter = wallet.adapter as MidenWalletAdapter;
                try {
                  if (inputNote.noteFileBytes) {
                    await adapter.importPrivateNote(
                      fromBase64(inputNote.noteFileBytes),
                    );
                  } else {
                    const transaction = new ConsumeTransaction(
                      faucet.identifier,
                      inputNote.id,
                      inputNote.type === "public" ? "public" : "private",
                      Number(fungibleAsset.amount),
                    );
                    const txId = await adapter.requestConsume(transaction);
                    console.info({ txId });
                  }
                } catch (error) {
                  // Rejected in Bread Wallet.
                  console.error(error);
                }
              } else if (account.multisig) {
                const multisig = await loadMultisig(account.id);
                if (!multisig) {
                  return;
                }
                await createConsumeNotesProposal({
                  multisig,
                  noteIds: [inputNote.id],
                });
              } else {
                setLoading(true);
                const { transactionRequest, transactionResult } =
                  await newConsumeTransactionRequest({
                    accountId: account.id,
                    noteIds: [inputNote.id],
                  });
                openCreateTransactionDialog({
                  accountId: account.id,
                  transactionType: "consume",
                  step: "preview",
                  transactionRequest,
                  transactionResult,
                });
              }
            } catch (error) {
              console.error(error);
              toast.error("Transaction failed.", {
                description:
                  error instanceof Error ? error.message : String(error),
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          Consume note with {account.name}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AccountNotesTable = ({ account }: { account: Account }) => {
  const { accounts, faucets, isAuthorized } = useAccounts();
  const { inputNotes } = useNotes();
  const { scripts } = useScripts();
  const consumableNotes = account.consumableNoteIds
    .map((noteId) => inputNotes.find(({ id }) => id === noteId))
    .filter((note) => note !== undefined);
  const showNoteActions = isAuthorized(account);
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Script</TableHead>
            <TableHead>Storage mode</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Assets</TableHead>
            {showNoteActions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumableNotes.map((inputNote) => {
            const script = scripts.find(({ id }) => id === inputNote.scriptId);
            const sender = accounts.find(({ id }) => id === inputNote.senderId);
            const senderAddress = normalizeAccountId(inputNote.senderId);
            return (
              <TableRow key={inputNote.id}>
                <TableCell>
                  <NoteId noteId={inputNote.id} />
                </TableCell>
                <TableCell>
                  {script ? (
                    <Link
                      className="text-primary font-medium underline underline-offset-4 flex items-center gap-2"
                      href={`/scripts/${script.id}`}
                    >
                      {script.name}
                      <CircleCheckBig
                        color="var(--color-green-500)"
                        className="size-4"
                      />
                    </Link>
                  ) : (
                    "Custom"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      inputNote.type === "public" ? "default" : "destructive"
                    }
                    className="capitalize"
                  >
                    {inputNote.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AccountAddress
                    account={{
                      name: sender?.name ?? "",
                      address: senderAddress,
                    }}
                    withName={!!sender}
                    withLink={!!sender}
                  />
                </TableCell>
                <TableCell>
                  {inputNote.fungibleAssets.map(({ faucetId, amount }) => {
                    const faucet = faucets.find(({ id }) => id === faucetId);
                    return (
                      <p key={faucetId}>
                        {formatAmount({ amount, decimals: faucet?.decimals })}{" "}
                        {faucet?.symbol}
                      </p>
                    );
                  })}
                </TableCell>
                {showNoteActions && (
                  <TableCell>
                    <NoteActionsCell account={account} inputNote={inputNote} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountNotesTable;
