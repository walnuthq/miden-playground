import { type Dispatch, type SetStateAction } from "react";
import { ChevronsUpDown, HandCoins, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useAccounts from "@/hooks/use-accounts";

const SelectAccountDropdownMenu = ({
  value,
  onValueChange,
  selectWallets = false,
  selectFaucets = false,
  without = "",
  showFaucetsAsAssets = false,
}: {
  value: string;
  onValueChange: Dispatch<SetStateAction<string>>;
  selectWallets?: boolean;
  selectFaucets?: boolean;
  without?: string;
  showFaucetsAsAssets?: boolean;
}) => {
  const { accounts, wallets, faucets } = useAccounts();
  const account = accounts.find(({ id }) => id === value);
  const shownAccounts = accounts.filter(({ id }) => id !== without);
  const shownWallets = wallets.filter(({ id }) => id !== without);
  const showWallets = selectWallets && shownWallets.length > 0;
  const shownFaucets = faucets.filter(({ id }) => id !== without);
  const showFaucets = selectFaucets && shownFaucets.length > 0;
  const disabled =
    (selectWallets && !showWallets) || (selectFaucets && !showFaucets);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="justify-between"
          variant="secondary"
          disabled={disabled}
        >
          {account
            ? showFaucetsAsAssets
              ? account?.symbol
              : account.name
            : disabled
              ? "No accounts found."
              : `Select ${showFaucetsAsAssets ? "asset" : "account"}`}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {!showWallets && !showFaucets ? (
            <>
              {shownAccounts.map((account) => (
                <DropdownMenuRadioItem key={account.id} value={account.id}>
                  {account.name}
                </DropdownMenuRadioItem>
              ))}
            </>
          ) : (
            <>
              {showWallets && (
                <>
                  {showFaucets && (
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Wallet className="size-4" /> Wallets
                    </DropdownMenuLabel>
                  )}
                  {shownWallets.map((wallet) => (
                    <DropdownMenuRadioItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </DropdownMenuRadioItem>
                  ))}
                </>
              )}
              {showWallets && showFaucets && <DropdownMenuSeparator />}
              {showFaucets && (
                <>
                  {showWallets && (
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <HandCoins className="size-4" /> Faucets
                    </DropdownMenuLabel>
                  )}
                  {shownFaucets.map((faucet) => (
                    <DropdownMenuRadioItem key={faucet.name} value={faucet.id}>
                      {showFaucetsAsAssets ? faucet.symbol : faucet.name}
                    </DropdownMenuRadioItem>
                  ))}
                </>
              )}
            </>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SelectAccountDropdownMenu;
