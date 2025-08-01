import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import NoteId from "@/components/lib/note-id";
import { type Note } from "@/lib/types";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";

const TransactionNoteTable = ({ notes }: { notes: Note[] }) => {
  const { faucets } = useAccounts();
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note) => (
            <TableRow key={note.id}>
              <TableCell>
                <NoteId noteId={note.id} />
              </TableCell>
              <TableCell>{note.wellKnownNote ?? "Custom"}</TableCell>
              <TableCell>
                <Badge
                  variant={note.type === "Public" ? "default" : "destructive"}
                >
                  {note.type}
                </Badge>
              </TableCell>
              <TableCell>
                <AccountAddress address={note.senderAddress} />
              </TableCell>
              <TableCell>
                {note.fungibleAssets.map(({ faucetId, amount }) => {
                  const faucet = faucets.find(({ id }) => id === faucetId);
                  return (
                    <p key={faucetId}>
                      {amount} {faucet?.tokenSymbol ?? "Unknown"}
                    </p>
                  );
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionNoteTable;
