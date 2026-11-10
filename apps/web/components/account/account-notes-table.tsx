import { normalizeAccountId } from "@miden-sdk/react";
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
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import AccountAddress from "@/components/lib/account-address";
import NoteId from "@/components/lib/note-id";
import useAccounts from "@/hooks/use-accounts";
import useConsumeNotes from "@/hooks/use-consume-notes";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";
import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";
import { formatAmount } from "@/lib/utils/asset";

const NoteActionsCell = ({
  account,
  inputNote,
}: {
  account: Account;
  inputNote: InputNote;
}) => {
  const { consumeNote } = useConsumeNotes();
  const [loading, setLoading] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="size-8 p-0" disabled={loading} />
        }
      >
        <span className="sr-only">{loading ? "Loading" : "Open menu"}</span>
        {loading ? <Spinner /> : <MoreVertical className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto" align="end">
        <DropdownMenuItem
          onClick={async () => {
            setLoading(true);
            try {
              await consumeNote({ account, inputNote });
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
                      to={`/scripts/${script.id}`}
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
