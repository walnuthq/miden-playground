import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ChevronsUpDown, HandCoins, Wallet } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import useAccounts from "@/hooks/use-accounts";

const SelectAccountDropdownMenu = ({
  value,
  onValueChange,
  selectWallets = false,
  selectFaucets = false,
  withoutFaucets = false,
  without = "",
  showFaucetsAsAssets = false,
}: {
  value: string;
  onValueChange: Dispatch<SetStateAction<string>>;
  selectWallets?: boolean;
  selectFaucets?: boolean;
  withoutFaucets?: boolean;
  without?: string;
  showFaucetsAsAssets?: boolean;
}) => {
  const { accounts, wallets, faucets } = useAccounts();
  const account = accounts.find(({ id }) => id === value);
  const shownWallets = wallets.filter(({ id }) => id !== without);
  const showWallets = selectWallets && shownWallets.length > 0;
  const shownFaucets = faucets.filter(({ id }) => id !== without);
  const showFaucets =
    selectFaucets && shownFaucets.length > 0 && !withoutFaucets;
  const faucetIds = faucets.map(({ id }) => id);
  const shownAccounts = accounts.filter(
    ({ id }) =>
      id !== without && (withoutFaucets ? !faucetIds.includes(id) : true),
  );
  const disabled =
    (selectWallets && !showWallets) || (selectFaucets && !showFaucets);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="justify-between"
            variant="secondary"
            disabled={disabled}
          />
        }
      >
        {account
          ? showFaucetsAsAssets
            ? account?.symbol
            : account.name
          : disabled
            ? "No accounts found."
            : `Select ${showFaucetsAsAssets ? "asset" : "account"}`}
        <ChevronsUpDown className="opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {!showWallets && !showFaucets ? (
            shownAccounts.map((account) => (
              <DropdownMenuRadioItem
                closeOnClick
                key={account.id}
                value={account.id}
              >
                {account.name}
              </DropdownMenuRadioItem>
            ))
          ) : (
            <>
              {showWallets && (
                <DropdownMenuGroup>
                  {showFaucets && (
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Wallet className="size-4" /> Wallets
                    </DropdownMenuLabel>
                  )}
                  {shownWallets.map((wallet) => (
                    <DropdownMenuRadioItem
                      closeOnClick
                      key={wallet.id}
                      value={wallet.id}
                    >
                      {wallet.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuGroup>
              )}
              {showWallets && showFaucets && <DropdownMenuSeparator />}
              {showFaucets && (
                <DropdownMenuGroup>
                  {showWallets && (
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <HandCoins className="size-4" /> Faucets
                    </DropdownMenuLabel>
                  )}
                  {shownFaucets.map((faucet) => (
                    <DropdownMenuRadioItem
                      closeOnClick
                      key={faucet.name}
                      value={faucet.id}
                    >
                      {showFaucetsAsAssets ? faucet.symbol : faucet.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuGroup>
              )}
            </>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SelectAccountDropdownMenu;
