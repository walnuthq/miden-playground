import { type AssetVault } from "@workspace/mock-web-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import useAccounts from "@/hooks/use-accounts";
import AccountAddress from "@/components/lib/account-address";

const AccountVaultTable = ({ vault }: { vault: AssetVault }) => {
  const { faucets } = useAccounts();
  const fungibleAssets = vault.fungibleAssets();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Type</TableHead>
            <TableHead>Faucet ID</TableHead>
            <TableHead>Token Symbol</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fungibleAssets.map((fungibleAsset) => {
            const faucet = faucets.find(
              ({ id }) => id === fungibleAsset.faucetId().toString(),
            );
            return (
              <TableRow key={fungibleAsset.faucetId().toString()}>
                <TableCell>Fungible Asset</TableCell>
                <TableCell>
                  <AccountAddress address={faucet?.address} />
                </TableCell>
                <TableCell>{faucet?.tokenSymbol ?? "Unknown"}</TableCell>
                <TableCell>{fungibleAsset.amount()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountVaultTable;
