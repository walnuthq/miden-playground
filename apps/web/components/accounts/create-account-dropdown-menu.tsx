import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Download,
  HandCoins,
  Plus,
  ShieldCheck,
  // Signature,
  ShieldPlus,
  Upload,
  Wallet,
} from "lucide-react";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useNetwork from "@/hooks/use-network";
import useTutorials from "@/hooks/use-tutorials";
import { defaultComponentIds } from "@/lib/types/default-components";

const CreateAccountDropdownMenu = () => {
  const { networkId } = useNetwork();
  const {
    connectedWallet,
    openCreateWalletDialog,
    openCreateFaucetDialog,
    openImportAccountDialog,
    openDeployAccountDialog,
    openDeployMultisigDialog,
  } = useAccounts();
  const { components } = useComponents();
  const { isTutorial } = useTutorials();
  const showCreateWalletsFaucets = isTutorial || networkId === "mmck";
  const showImportDeployAccounts = true;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus />
          <span className="hidden lg:inline">Create new account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {showCreateWalletsFaucets && (
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
        {showImportDeployAccounts && (
          <>
            <DropdownMenuItem onClick={() => openImportAccountDialog()}>
              <Download />
              Import account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openDeployAccountDialog}
              disabled={
                components.filter(
                  ({ id, type }) =>
                    !defaultComponentIds.includes(id) &&
                    type === "account-component",
                ).length === 0
              }
            >
              <Upload />
              Deploy account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openDeployMultisigDialog}
              disabled={!connectedWallet?.isPrivate}
            >
              <ShieldPlus />
              Deploy guardian wallet
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openImportAccountDialog(true)}
              disabled={!connectedWallet?.isPrivate}
            >
              <ShieldCheck />
              Restore guardian wallet
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateAccountDropdownMenu;
