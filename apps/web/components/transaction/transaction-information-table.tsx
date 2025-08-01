import { type Transaction } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import AccountAddress from "@/components/lib/account-address";

const TransactionInformationTable = ({
  transaction,
}: {
  transaction: Transaction;
}) => (
  <div className="rounded-md border">
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>ID</TableCell>
          <TableCell>{transaction.id}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Status</TableCell>
          <TableCell>{transaction.status}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Account ID</TableCell>
          <TableCell>
            <AccountAddress address={transaction.accountAddress} />
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

export default TransactionInformationTable;
