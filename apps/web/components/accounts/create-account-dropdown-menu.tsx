import { Plus, Wallet, HandCoins, Download, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";

const CreateAccountDropdownMenu = () => {
  const { networkId } = useGlobalContext();
  const {
    openCreateWalletDialog,
    openCreateFaucetDialog,
    openImportAccountDialog,
    openDeployAccountDialog,
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
        {networkId === "mlcl" && (
          <>
            <DropdownMenuItem onClick={openCreateWalletDialog}>
              <Wallet />
              Create new wallet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openCreateFaucetDialog}>
              <HandCoins />
              Create new fungible faucet
            </DropdownMenuItem>
          </>
        )}
        {networkId === "mtst" && (
          <>
            <DropdownMenuItem onClick={openImportAccountDialog}>
              <Download />
              Import account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openDeployAccountDialog}>
              <Upload />
              Deploy account
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateAccountDropdownMenu;
