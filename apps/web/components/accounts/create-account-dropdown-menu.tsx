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
import useNetwork from "@/hooks/use-network";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";
import { deployableAccountComponents } from "@/lib/utils/account-components";

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
  const { scripts } = useScripts();
  const { isTutorial } = useTutorials();
  const showCreateWalletsFaucets = isTutorial || networkId === "mmck";
  const showImportDeployAccounts = true;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <Plus />
        <span className="sr-only lg:not-sr-only">Create new account</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
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
            {/* The mock RPC panics on an account its chain doesn't hold. */}
            {networkId !== "mmck" && (
              <DropdownMenuItem onClick={() => openImportAccountDialog()}>
                <Download />
                Import account
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={openDeployAccountDialog}
              disabled={deployableAccountComponents(scripts).length === 0}
            >
              <Upload />
              Deploy account
            </DropdownMenuItem>
            {/* Miden Guardian signs for real networks, with a wallet. */}
            {networkId !== "mmck" && (
              <>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateAccountDropdownMenu;
