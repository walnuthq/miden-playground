import { type Transaction } from "@/lib/types/transaction";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import AccountAddress from "@/components/lib/account-address";
import { midenExplorerUrl } from "@/lib/constants";
import useNetwork from "@/hooks/use-network";

const TransactionInformationTable = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  const { networkId } = useNetwork();
  return (
    <div className="rounded-md border">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>
              {networkId !== "mmck" ? (
                <a
                  href={`${midenExplorerUrl(networkId)}/tx/${transaction.id}`}
                  className="text-primary font-medium underline underline-offset-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  {transaction.id}
                </a>
              ) : (
                transaction.id
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>{transaction.status}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Account ID</TableCell>
            <TableCell className="px-3">
              <AccountAddress id={transaction.accountId} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Script Root</TableCell>
            <TableCell>{transaction.scriptRoot}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Input Notes Count</TableCell>
            <TableCell>{transaction.inputNotes.length}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Output Notes Count</TableCell>
            <TableCell>{transaction.outputNotes.length}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionInformationTable;
