import {
  Plus,
  Wallet,
  HandCoins,
  Download,
  Upload,
  // Signature,
  ShieldPlus,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import useTutorials from "@/hooks/use-tutorials";

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
                    !defaultComponentIds.includes(id) && type === "account",
                ).length === 0
              }
            >
              <Upload />
              Deploy account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openDeployMultisigDialog}
              disabled={
                !connectedWallet || connectedWallet.storageMode !== "private"
              }
            >
              <ShieldPlus />
              Deploy guardian
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openImportAccountDialog(true)}
              disabled={
                !connectedWallet || connectedWallet.storageMode !== "private"
              }
            >
              <ShieldCheck />
              Restore guardian
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateAccountDropdownMenu;
