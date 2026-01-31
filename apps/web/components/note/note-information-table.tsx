import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { type InputNote, noteStates } from "@/lib/types/note";
import AccountAddress from "@/components/lib/account-address";
import { CircleCheckBig } from "lucide-react";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import useGlobalContext from "@/components/global-context/hook";
import { type Script } from "@/lib/types/script";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { accountIdToAddress } from "@/lib/web-client";

const NoteInformationTable = ({
  inputNote,
  script,
}: {
  inputNote: InputNote;
  script: Script | null;
}) => {
  const { midenSdk } = useMidenSdk();
  const { networkId } = useGlobalContext();
  const { accounts } = useAccounts();
  const { openVerifyNoteScriptDialog } = useNotes();
  const sender = accounts.find(({ id }) => id === inputNote.senderId);
  const senderAddress = accountIdToAddress({
    accountId: inputNote.senderId,
    networkId,
    midenSdk,
  });
  return (
    <div className="rounded-md border">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>
              {networkId === "mtst" ? (
                <a
                  href={`https://testnet.midenscan.com/note/${inputNote.id}`}
                  className="text-primary font-medium underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {inputNote.id}
                </a>
              ) : (
                inputNote.id
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Script Root</TableCell>
            <TableCell>{inputNote.scriptRoot}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Serial Number</TableCell>
            <TableCell>{inputNote.serialNum}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Script</TableCell>
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
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Unknown note script
                  </span>
                  <Button
                    size="sm"
                    onClick={() => openVerifyNoteScriptDialog(inputNote.id)}
                  >
                    Verify note script
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Storage mode</TableCell>
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
          </TableRow>
          <TableRow>
            <TableCell>State</TableCell>
            <TableCell>{noteStates[inputNote.state]}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Nullifier</TableCell>
            <TableCell>{inputNote.nullifier}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>{inputNote.tag}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sender</TableCell>
            <TableCell>
              <AccountAddress
                account={{ name: sender?.name ?? "", address: senderAddress }}
                withName={!!sender}
                withLink={!!sender}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default NoteInformationTable;
