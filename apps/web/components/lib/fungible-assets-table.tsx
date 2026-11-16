import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";
import type { FungibleAsset } from "@/lib/types/asset";
import { formatAmount } from "@/lib/utils/asset";

// What a table shows for a faucet the app doesn't know.
export type FaucetLabel = { name: string; symbol: string; decimals: number };

const FungibleAssetsTable = ({
  fungibleAssets,
  withAccountAddress = true,
  faucetLabels,
}: {
  fungibleAssets: FungibleAsset[];
  withAccountAddress?: boolean;
  // Describes faucets the app doesn't know, by id: the mock client's faucet
  // of a simulation.
  faucetLabels?: Record<string, FaucetLabel>;
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
              ({ id }) => id === fungibleAsset.faucetId,
            );
            const label = faucet
              ? undefined
              : faucetLabels?.[fungibleAsset.faucetId];
            return (
              <TableRow key={fungibleAsset.faucetId}>
                <TableCell>Fungible Asset</TableCell>
                <TableCell>
                  {label ? (
                    label.name
                  ) : (
                    <AccountAddress
                      address={faucet?.address}
                      withCopyButton={withAccountAddress}
                      withTooltip={withAccountAddress}
                      withLink={withAccountAddress}
                    />
                  )}
                </TableCell>
                <TableCell>{faucet?.symbol ?? label?.symbol}</TableCell>
                <TableCell
                  className={cn({
                    "text-green-500": fungibleAsset.amount.startsWith("+"),
                    "text-red-500": fungibleAsset.amount.startsWith("-"),
                  })}
                >
                  {formatAmount({
                    amount: fungibleAsset.amount,
                    decimals: faucet?.decimals ?? label?.decimals,
                    signDisplay: fungibleAsset.amount.startsWith("+")
                      ? "exceptZero"
                      : "auto",
                  })}
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
