"use client";
import { MoreVertical } from "lucide-react";
import { type InputNote, noteStates } from "@/lib/types/note";
import { noteConsumed } from "@/lib/utils/note";
import { formatId } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  useWallet,
  ConsumeTransaction,
  type MidenWalletAdapter,
} from "@miden-sdk/miden-wallet-adapter";
import useTransactions from "@/hooks/use-transactions";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";
import { clientExportInputNoteFile } from "@/lib/web-client";
import { normalizeAccountId, useMiden } from "@miden-sdk/react";

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
  const { client } = useMiden();
  const { wallet } = useWallet();
  const { accounts, faucets, connectedWallet, isAuthorized } = useAccounts();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const targetAccount = accounts.find(({ consumableNoteIds }) =>
    consumableNoteIds.includes(inputNote.id),
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!noteConsumed(inputNote) &&
          targetAccount &&
          isAuthorized(targetAccount) && (
            <DropdownMenuItem
              onClick={async () => {
                if (connectedWallet?.id === targetAccount.id) {
                  const [fungibleAsset] = inputNote.fungibleAssets;
                  const faucet = faucets.find(
                    ({ id }) => id === fungibleAsset?.faucetId,
                  );
                  if (!client || !wallet || !fungibleAsset || !faucet) {
                    return;
                  }
                  const noteFileBytes =
                    inputNote.type === "public"
                      ? undefined
                      : await clientExportInputNoteFile({
                          client,
                          noteId: inputNote.id,
                        });
                  const transaction = new ConsumeTransaction(
                    faucet.identifier,
                    inputNote.id,
                    inputNote.type === "public" ? "public" : "private",
                    Number(fungibleAsset.amount),
                    noteFileBytes,
                  );
                  const adapter = wallet.adapter as MidenWalletAdapter;
                  const txId = await adapter.requestConsume(transaction);
                  console.log({ txId });
                } else {
                  const { transactionRequest, transactionResult } =
                    await newConsumeTransactionRequest({
                      accountId: targetAccount.id,
                      noteIds: [inputNote.id],
                    });
                  openCreateTransactionDialog({
                    accountId: targetAccount.id,
                    transactionType: "consume",
                    step: "preview",
                    transactionRequest,
                    transactionResult,
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

export const columns: ColumnDef<InputNote>[] = [
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
