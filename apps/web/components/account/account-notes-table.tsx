import { type Account, type InputNote } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Badge } from "@workspace/ui/components/badge";
import { MoreVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import AccountAddress from "@/components/lib/account-address";
import useTransactions from "@/hooks/use-transactions";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import NoteId from "@/components/lib/note-id";
//
import {
  useWallet,
  ConsumeTransaction,
  type MidenWalletAdapter,
} from "@demox-labs/miden-wallet-adapter";
import useGlobalContext from "@/components/global-context/hook";

const NoteActionsCell = ({
  account,
  inputNote,
}: {
  account: Account;
  inputNote: InputNote;
}) => {
  const { networkId } = useGlobalContext();
  const { wallet } = useWallet();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            if (networkId === "mlcl") {
              const transactionResult = await newConsumeTransactionRequest({
                accountId: account.id,
                noteIds: [inputNote.id],
              });
              openCreateTransactionDialog({
                accountId: account.id,
                transactionType: "consume",
                step: "preview",
                transactionResult,
              });
            } else {
              const [fungibleAsset] = inputNote.fungibleAssets;
              if (!wallet || !fungibleAsset) {
                return;
              }
              const transaction = new ConsumeTransaction(
                inputNote.senderAddress,
                inputNote.id,
                inputNote.type === "Public" ? "public" : "private",
                Number(fungibleAsset.amount),
              );
              const adapter = wallet.adapter as MidenWalletAdapter;
              const txId = await adapter.requestConsume(transaction);
              console.log({ txId });
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
  const { faucets } = useAccounts();
  const { inputNotes } = useNotes();
  const consumableNotes = account.consumableNoteIds
    .map((noteId) => inputNotes.find(({ id }) => id === noteId))
    .filter((note) => note !== undefined);
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Storage mode</TableHead>
            <TableHead>Sender ID</TableHead>
            <TableHead>Assets</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumableNotes.map((inputNote) => (
            <TableRow key={inputNote.id}>
              <TableCell>
                <NoteId noteId={inputNote.id} />
              </TableCell>
              <TableCell>{inputNote.wellKnownNote ?? "Custom"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    inputNote.type === "Public" ? "default" : "destructive"
                  }
                >
                  {inputNote.type}
                </Badge>
              </TableCell>
              <TableCell>
                <AccountAddress address={inputNote.senderAddress} />
              </TableCell>
              <TableCell>
                {inputNote.fungibleAssets.map(({ faucetId, amount }) => {
                  const faucet = faucets.find(({ id }) => id === faucetId);
                  return (
                    <p key={faucetId}>
                      {amount} {faucet?.tokenSymbol ?? "Unknown"}
                    </p>
                  );
                })}
              </TableCell>
              <TableCell>
                <NoteActionsCell account={account} inputNote={inputNote} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountNotesTable;
