import { Plus, Wallet, HandCoins, Import } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useAccounts from "@/hooks/use-accounts";

const CreateAccountDropdownMenu = () => {
  const {
    openCreateWalletDialog,
    openCreateFaucetDialog,
    openImportAccountDialog,
  } = useAccounts();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus />
          <span className="hidden lg:inline">Create new account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={openCreateWalletDialog}>
          <Wallet />
          Create new wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openCreateFaucetDialog}>
          <HandCoins />
          Create new fungible faucet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openImportAccountDialog}>
          <Import />
          Import account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateAccountDropdownMenu;
