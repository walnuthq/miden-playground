import { type TableTransaction } from "@/lib/types";
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
  transaction: TableTransaction;
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
          <TableCell>{transaction.inputNotesCount}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Output Notes Count</TableCell>
          <TableCell>{transaction.outputNotesCount}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export default TransactionInformationTable;
