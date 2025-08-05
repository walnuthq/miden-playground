import { type Account } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";

const AccountInformationTable = ({ account }: { account: Account }) => (
  <div className="rounded-md border">
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>{account.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>ID</TableCell>
          <TableCell>{account.address}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>{account.type}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Storage mode</TableCell>
          <TableCell>
            <Badge
              variant={
                account.storageMode === "Public" ? "default" : "destructive"
              }
              className="capitalize"
            >
              {account.storageMode}
            </Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Nonce</TableCell>
          <TableCell>{account.nonce}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export default AccountInformationTable;
