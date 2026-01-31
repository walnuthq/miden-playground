import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
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
import { type TransactionNote } from "@/lib/types/transaction";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { formatAmount } from "@/lib/utils";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import { accountIdToAddress } from "@/lib/web-client";

const TransactionNoteTable = ({ notes }: { notes: TransactionNote[] }) => {
  const { midenSdk } = useMidenSdk();
  const { networkId } = useGlobalContext();
  const { accounts, faucets } = useAccounts();
  const { scripts } = useScripts();
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note) => {
            const script = scripts.find(
              ({ digest }) => digest === note.scriptRoot,
            );
            const sender = accounts.find(({ id }) => id === note.senderId);
            const senderAddress = accountIdToAddress({
              accountId: note.senderId,
              networkId,
              midenSdk,
            });
            return (
              <TableRow key={note.id}>
                <TableCell>
                  <NoteId noteId={note.id} />
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
                    variant={note.type === "public" ? "default" : "destructive"}
                    className="capitalize"
                  >
                    {note.type}
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
                  {note.fungibleAssets.map(({ faucetId, amount }) => {
                    const faucet = faucets.find(({ id }) => id === faucetId);
                    return (
                      <p key={faucetId}>
                        {formatAmount({ amount, decimals: faucet?.decimals })}{" "}
                        {faucet?.symbol}
                      </p>
                    );
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionNoteTable;
