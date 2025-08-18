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
import useNotes from "@/hooks/use-notes";
import NoteId from "@/components/lib/note-id";
//
import { ConsumeTransaction } from "@demox-labs/miden-wallet-adapter-base";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { MidenWalletAdapter } from "@demox-labs/miden-wallet-adapter-miden";

const NoteActionsCell = ({
  account,
  inputNote,
}: {
  account: Account;
  inputNote: InputNote;
}) => {
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const { wallet } = useWallet();
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
            const [fungibleAsset] = inputNote.fungibleAssets;
            if (!wallet || !fungibleAsset) {
              return;
            }
            const transaction = new ConsumeTransaction(
              inputNote.senderAddress,
              inputNote.id,
              inputNote.type === "Public" ? "public" : "private",
              Number(fungibleAsset.amount)
            );
            const adapter = wallet.adapter as MidenWalletAdapter;
            const txId = await adapter.requestConsume(transaction);
            console.log({ txId });
            /* const transactionResult = await newConsumeTransactionRequest({
              accountId: account.id,
              noteIds: [noteId],
            });
            openCreateTransactionDialog({
              accountId: account.id,
              transactionType: "consume",
              step: "preview",
              transactionResult,
            }); */
          }}
        >
          Consume note with {account.name}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AccountNotesTable = ({ account }: { account: Account }) => {
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
