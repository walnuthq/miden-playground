import { type Account, accountTypes } from "@/lib/types/account";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import AccountAddress from "@/components/lib/account-address";

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
          <TableCell>
            <AccountAddress
              address={account.address}
              withLink={false}
              withName={false}
              formatted={false}
              withTooltip={false}
            />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>{accountTypes[account.type]}</TableCell>
        </TableRow>
        {account.isFaucet && (
          <TableRow>
            <TableCell>Token symbol</TableCell>
            <TableCell>{account.tokenSymbol ?? "Unknown"}</TableCell>
          </TableRow>
        )}
        <TableRow>
          <TableCell>Storage mode</TableCell>
          <TableCell>
            <Badge
              variant={
                account.storageMode === "public" ? "default" : "destructive"
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
