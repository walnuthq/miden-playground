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
import { Badge } from "@workspace/ui/components/badge";
import { MoreVertical } from "lucide-react";
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
} from "@demox-labs/miden-wallet-adapter";
import useGlobalContext from "@/components/global-context/hook";
import useScripts from "@/hooks/use-scripts";
import { formatAmount, getAddressPart } from "@/lib/utils";

const NoteActionsCell = ({
  account,
  inputNote,
}: {
  account: Account;
  inputNote: InputNote;
}) => {
  const { wallet } = useWallet();
  const { networkId } = useGlobalContext();
  const { faucets } = useAccounts();
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
            if (networkId === "mlcl") {
              const { transactionRequest, transactionResult } =
                await newConsumeTransactionRequest({
                  accountId: account.id,
                  noteIds: [inputNote.id],
                });
              openCreateTransactionDialog({
                accountId: account.id,
                transactionType: "consume",
                step: "preview",
                transactionRequest,
                transactionResult,
              });
            } else {
              const faucet = faucets.find(
                ({ id }) => id === inputNote.senderId
              );
              const [fungibleAsset] = inputNote.fungibleAssets;
              if (!wallet || !fungibleAsset || !faucet) {
                return;
              }
              const transaction = new ConsumeTransaction(
                getAddressPart(faucet.address),
                inputNote.id,
                inputNote.type === "public" ? "public" : "private",
                Number(fungibleAsset.amount)
              );
              const adapter = wallet.adapter as MidenWalletAdapter;
              try {
                const txId = await adapter.requestConsume(transaction);
                console.log({ txId });
              } catch (error) {
                console.error("ERROR");
                console.error(error);
              }
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
  const { networkId } = useGlobalContext();
  const { faucets, connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const { scripts } = useScripts();
  const consumableNotes = account.consumableNoteIds
    .map((noteId) => inputNotes.find(({ id }) => id === noteId))
    .filter((note) => note !== undefined);
  const showNoteActions =
    networkId === "mlcl" || connectedWallet?.address === account.address;
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
            {showNoteActions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumableNotes.map((inputNote) => {
            const script = scripts.find(
              ({ root }) => root === inputNote.scriptRoot
            );
            return (
              <TableRow key={inputNote.id}>
                <TableCell>
                  <NoteId noteId={inputNote.id} />
                </TableCell>
                <TableCell>{script?.name ?? "Custom"}</TableCell>
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
                  <AccountAddress id={inputNote.senderId} />
                </TableCell>
                <TableCell>
                  {inputNote.fungibleAssets.map(({ faucetId, amount }) => {
                    const faucet = faucets.find(({ id }) => id === faucetId);
                    return (
                      <p key={faucetId}>
                        {formatAmount(amount, faucet?.decimals)}{" "}
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
