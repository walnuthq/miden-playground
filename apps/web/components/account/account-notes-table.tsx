import { useState } from "react";
import Link from "next/link";
import { type Account } from "@/lib/types/account";
import { type InputNote } from "@/lib/types/note";
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
import { Spinner } from "@workspace/ui/components/spinner";
import { Badge } from "@workspace/ui/components/badge";
import { MoreVertical, CircleCheckBig } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import AccountAddress from "@/components/lib/account-address";
import useTransactions from "@/hooks/use-transactions";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import NoteId from "@/components/lib/note-id";
import {
  useWallet,
  ConsumeTransaction,
  type MidenWalletAdapter,
} from "@miden-sdk/miden-wallet-adapter";
import useGlobalContext from "@/components/global-context/hook";
import useScripts from "@/hooks/use-scripts";
import { formatAmount } from "@/lib/utils";
import useWebClient from "@/hooks/use-web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { clientExportInputNoteFile } from "@/lib/web-client";
import { accountIdToAddress } from "@/lib/web-client";

const NoteActionsCell = ({
  account,
  inputNote,
}: {
  account: Account;
  inputNote: InputNote;
}) => {
  const { midenSdk } = useMidenSdk();
  const { client } = useWebClient();
  const { wallet } = useWallet();
  const { networkId } = useGlobalContext();
  const { faucets } = useAccounts();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const [loading, setLoading] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0" disabled={loading}>
          <span className="sr-only">{loading ? "Loading" : "Open menu"}</span>
          {loading ? <Spinner /> : <MoreVertical className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            if (
              networkId === "mmck" ||
              account.components.includes("no-auth") ||
              account.components.includes("ecdsa-k256-keccak-auth")
            ) {
              setLoading(true);
              const { transactionRequest, transactionResult } =
                await newConsumeTransactionRequest({
                  accountId: account.id,
                  noteIds: [inputNote.id],
                });
              setLoading(false);
              openCreateTransactionDialog({
                accountId: account.id,
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
          Consume note with {account.name}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AccountNotesTable = ({ account }: { account: Account }) => {
  const { midenSdk } = useMidenSdk();
  const { networkId } = useGlobalContext();
  const { accounts, faucets, connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const { scripts } = useScripts();
  const consumableNotes = account.consumableNoteIds
    .map((noteId) => inputNotes.find(({ id }) => id === noteId))
    .filter((note) => note !== undefined);
  const showNoteActions =
    networkId === "mmck" ||
    connectedWallet?.address === account.address ||
    account.components.includes("no-auth");
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
            const script = scripts.find(
              ({ digest }) => digest === inputNote.scriptRoot,
            );
            const sender = accounts.find(({ id }) => id === inputNote.senderId);
            const senderAddress = accountIdToAddress({
              accountId: inputNote.senderId,
              networkId,
              midenSdk,
            });
            return (
              <TableRow key={inputNote.id}>
                <TableCell>
                  <NoteId noteId={inputNote.id} />
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
