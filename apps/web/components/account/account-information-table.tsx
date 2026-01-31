import { type Account, accountTypes } from "@/lib/types/account";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import AccountAddress from "@/components/lib/account-address";
import { formatAmount } from "@/lib/utils";
import CopyButton from "@/components/lib/copy-button";

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
          <TableCell className="flex items-center gap-2">
            {account.id}
            <CopyButton content="Copy Account ID" copy={account.id} />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Address</TableCell>
          <TableCell>
            <AccountAddress
              address={account.address}
              withLink={false}
              withName={false}
              withTooltip={false}
              formatted={false}
            />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>{accountTypes[account.type]}</TableCell>
        </TableRow>
        {account.isFaucet && (
          <>
            <TableRow>
              <TableCell>Total supply</TableCell>
              <TableCell>
                {formatAmount({
                  amount: account.totalSupply,
                  decimals: account.decimals,
                })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Max supply</TableCell>
              <TableCell>
                {formatAmount({
                  amount: account.maxSupply,
                  decimals: account.decimals,
                })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Decimals</TableCell>
              <TableCell>{account.decimals}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Token symbol</TableCell>
              <TableCell>{account.symbol}</TableCell>
            </TableRow>
          </>
        )}
        <TableRow>
          <TableCell>Storage mode</TableCell>
          <TableCell>
            <Badge
              variant={
                account.storageMode === "public"
                  ? "default"
                  : account.storageMode === "network"
                    ? "secondary"
                    : "destructive"
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
