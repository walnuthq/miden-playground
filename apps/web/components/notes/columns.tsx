import { normalizeAccountId } from "@miden-sdk/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";
import useConsumeNotes from "@/hooks/use-consume-notes";
import type { DataTableFeatures } from "@/lib/table";
import { type InputNote, noteStates } from "@/lib/types/note";
import { formatId } from "@/lib/utils";
import { noteConsumed } from "@/lib/utils/note";

const InputNoteSenderCell = ({ inputNote }: { inputNote: InputNote }) => {
  const { accounts } = useAccounts();
  const sender = accounts.find(({ id }) => id === inputNote.senderId);
  const senderAddress = normalizeAccountId(inputNote.senderId);
  return (
    <AccountAddress
      account={{ name: sender?.name ?? "", address: senderAddress }}
      withName={!!sender}
      withLink={!!sender}
    />
  );
};

const InputNoteActionsCell = ({ inputNote }: { inputNote: InputNote }) => {
  const { accounts, isAuthorized } = useAccounts();
  const { consumeNote } = useConsumeNotes();
  const targetAccount = accounts.find(({ consumableNoteIds }) =>
    consumableNoteIds.includes(inputNote.id),
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="size-8 p-0" />}
      >
        <span className="sr-only">Open menu</span>
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto" align="end">
        {!noteConsumed(inputNote) &&
          targetAccount &&
          isAuthorized(targetAccount) && (
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await consumeNote({ account: targetAccount, inputNote });
                } catch (error) {
                  console.error(error);
                  toast.error("Transaction failed.", {
                    description:
                      error instanceof Error ? error.message : String(error),
                  });
                }
              }}
            >
              Consume note
            </DropdownMenuItem>
          )}
        <DropdownMenuItem disabled onClick={() => {}}>
          Export note
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Columns the table hides on phones (`mobileColumnClassName`).
export const mobileHiddenColumns = ["type", "tag", "senderId"];

export const columns: ColumnDef<DataTableFeatures, InputNote>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => formatId(row.original.id),
  },
  {
    accessorKey: "type",
    header: "Storage mode",
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === "public" ? "default" : "destructive"}
        className="capitalize"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => noteStates[row.original.state],
  },
  {
    accessorKey: "tag",
    header: "Tag",
  },
  {
    accessorKey: "senderId",
    header: "Sender",
    cell: ({ row }) => <InputNoteSenderCell inputNote={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <InputNoteActionsCell inputNote={row.original} />,
  },
];
