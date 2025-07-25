import { noteType, noteSenderAddress, type Account } from "@/lib/types";
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
import useGlobalContext from "@/components/global-context/hook";
import useTransactions from "@/hooks/use-transactions";
import useNotes from "@/hooks/use-notes";
import NoteId from "@/components/lib/note-id";
import NoteScriptRoot from "@/components/lib/note-script-root";

const NoteActionsCell = ({
  account,
  noteId,
}: {
  account: Account;
  noteId: string;
}) => {
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
            const transactionResult = await newConsumeTransactionRequest({
              accountId: account.id,
              noteIds: [noteId],
            });
            openCreateTransactionDialog({
              accountId: account.id,
              transactionType: "consume",
              step: "preview",
              transactionResult,
            });
          }}
        >
          Consume note with {account.name}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AccountNotesTable = ({ account }: { account: Account }) => {
  const { networkId } = useGlobalContext();
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
            <TableHead>Script Root</TableHead>
            <TableHead>Storage mode</TableHead>
            <TableHead>Sender ID</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumableNotes.map((inputNote) => {
            const type = noteType(inputNote.inputNote);
            return (
              <TableRow key={inputNote.id}>
                <TableCell>
                  <NoteId inputNote={inputNote} />
                </TableCell>
                <TableCell>
                  <NoteScriptRoot inputNote={inputNote} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={type === "Public" ? "default" : "destructive"}
                  >
                    {type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AccountAddress
                    address={noteSenderAddress(inputNote.inputNote, networkId)}
                  />
                </TableCell>
                <TableCell>
                  <NoteActionsCell account={account} noteId={inputNote.id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountNotesTable;
