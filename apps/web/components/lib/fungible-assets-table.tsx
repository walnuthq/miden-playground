import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { type FungibleAsset } from "@/lib/types/asset";
import useAccounts from "@/hooks/use-accounts";
import AccountAddress from "@/components/lib/account-address";
import { cn } from "@workspace/ui/lib/utils";
import { decodeFungibleFaucetMetadata } from "@/lib/types/account";

const FungibleAssetsTable = ({
  fungibleAssets,
  withAccountAddress = true,
}: {
  fungibleAssets: FungibleAsset[];
  withAccountAddress?: boolean;
}) => {
  const { faucets } = useAccounts();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Faucet ID</TableHead>
            <TableHead>Token Symbol</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fungibleAssets.map((fungibleAsset) => {
            const faucet = faucets.find(
              ({ id }) => id === fungibleAsset.faucetId
            );
            const { tokenSymbol } = decodeFungibleFaucetMetadata(faucet);
            return (
              <TableRow key={fungibleAsset.faucetId}>
                <TableCell>Fungible Asset</TableCell>
                <TableCell>
                  <AccountAddress
                    address={faucet?.address}
                    withCopyButton={withAccountAddress}
                    withTooltip={withAccountAddress}
                    withLink={withAccountAddress}
                  />
                </TableCell>
                <TableCell>{tokenSymbol}</TableCell>
                <TableCell
                  className={cn({
                    "text-green-500": fungibleAsset.amount.startsWith("+"),
                    "text-red-500": fungibleAsset.amount.startsWith("-"),
                  })}
                >
                  {fungibleAsset.amount}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default FungibleAssetsTable;
