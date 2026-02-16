"use client";
import { MoreVertical } from "lucide-react";
import { type InputNote, noteConsumed, noteStates } from "@/lib/types/note";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";
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
import useScripts from "@/hooks/use-scripts";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import { clientExportInputNoteFile } from "@/lib/web-client";
import useWebClient from "@/hooks/use-web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { accountIdToAddress } from "@/lib/web-client";

const InputNoteSenderCell = ({ inputNote }: { inputNote: InputNote }) => {
  const { midenSdk } = useMidenSdk();
  const { networkId } = useGlobalContext();
  const { accounts } = useAccounts();
  const sender = accounts.find(({ id }) => id === inputNote.senderId);
  const senderAddress = accountIdToAddress({
    accountId: inputNote.senderId,
    networkId,
    midenSdk,
  });
  return (
    <AccountAddress
      account={{ name: sender?.name ?? "", address: senderAddress }}
      withName={!!sender}
      withLink={!!sender}
    />
  );
};

const InputNoteActionsCell = ({ inputNote }: { inputNote: InputNote }) => {
  const { midenSdk } = useMidenSdk();
  const { client } = useWebClient();
  const { wallet } = useWallet();
  const { networkId } = useGlobalContext();
  const { faucets } = useAccounts();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const { scripts } = useScripts();
  const script = scripts.find(({ digest }) => digest === inputNote.scriptRoot);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {script?.id === "p2id" && !noteConsumed(inputNote) && (
          <DropdownMenuItem
            onClick={async () => {
              // const targetAccountId = accountIdFromPrefixSuffix(
              //   inputNote.inputs[1]!,
              //   inputNote.inputs[0]!
              // );
              // const { transactionRequest, transactionResult } =
              //   await newConsumeTransactionRequest({
              //     accountId: targetAccountId,
              //     noteIds: [inputNote.id],
              //   });
              // openCreateTransactionDialog({
              //   accountId: targetAccountId,
              //   transactionType: "consume",
              //   step: "preview",
              //   transactionRequest,
              //   transactionResult,
              // });
              if (networkId === "mmck") {
                const targetAccountId = accountIdFromPrefixSuffix(
                  inputNote.inputs[1]!,
                  inputNote.inputs[0]!,
                );
                const { transactionRequest, transactionResult } =
                  await newConsumeTransactionRequest({
                    accountId: targetAccountId,
                    noteIds: [inputNote.id],
                  });
                openCreateTransactionDialog({
                  accountId: targetAccountId,
                  transactionType: "consume",
                  step: "preview",
                  transactionRequest,
                  transactionResult,
                });
              } else {
                const [fungibleAsset] = inputNote.fungibleAssets;
                const faucet = faucets.find(
                  ({ id }) => id === fungibleAsset?.faucetId,
                );
                if (!wallet || !fungibleAsset || !faucet) {
                  return;
                }
                const noteFileBytes =
                  inputNote.type === "public"
                    ? undefined
                    : await clientExportInputNoteFile({
                        client,
                        noteId: inputNote.id,
                        midenSdk,
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
