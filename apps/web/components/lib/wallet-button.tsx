import { useState } from "react";
import Image from "next/image";
import {
  WalletMultiButton,
  WalletReadyState,
  useWallet,
} from "@miden-sdk/miden-wallet-adapter";
import { useMultiSigner } from "@miden-sdk/react/lazy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { useParaWallet } from "@/components/providers/para-wallet-context";

const signerLabels: Record<string, string> = {
  MidenFi: "Bread Wallet",
  Para: "Para Wallet",
};

const formatEvmAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const InstallBreadWalletDialog = ({
  url,
  open,
  onOpenChange,
}: {
  url?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Discover Miden</DialogTitle>
        <DialogDescription>
          Experience the next evolution of blockchain technology with Miden.
          Install the Bread Wallet and access a seamless, decentralized
          ecosystem today.
        </DialogDescription>
      </DialogHeader>
      {url && (
        <Button
          nativeButton={false}
          render={<a href={url} target="_blank" rel="noopener noreferrer" />}
        >
          Install from the Chrome Web Store
        </Button>
      )}
    </DialogContent>
  </Dialog>
);

const SelectWalletButton = ({ signerNames }: { signerNames: string[] }) => {
  const multiSigner = useMultiSigner();
  const { wallet } = useWallet();
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const midenFiInstalled =
    wallet?.readyState === WalletReadyState.Installed ||
    wallet?.readyState === WalletReadyState.Loadable;
  const selectSigner = (name: string) => {
    // Without the extension, MidenFi's connect() opens the store in a new tab
    // and throws. The adapter's Bread modal can't be used either: it calls
    // connect() whenever a wallet is selected, and MidenFiSignerProvider
    // re-selects its only wallet after each failure, looping forever.
    if (name === "MidenFi" && !midenFiInstalled) {
      setInstallDialogOpen(true);
      return;
    }
    multiSigner?.connectSigner(name).catch(console.error);
  };
  return (
    <>
      {signerNames.length === 1 ? (
        <Button variant="outline" onClick={() => selectSigner(signerNames[0]!)}>
          Select Wallet
        </Button>
      ) : (
        // Non-modal: Para's dialog uses its own bundled copy of Radix, and
        // opening it while a modal menu is closing leaves `pointer-events:
        // none` on body.
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Select Wallet</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {signerNames.map((name) => (
              <DropdownMenuItem key={name} onClick={() => selectSigner(name)}>
                {signerLabels[name] ?? name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <InstallBreadWalletDialog
        url={wallet?.adapter.url}
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
      />
    </>
  );
};

const WalletButton = ({
  enabledSigners,
}: {
  // Names of the signers to offer (as registered with MultiSignerProvider, e.g.
  // "MidenFi", "Para"); all registered signers when undefined.
  enabledSigners?: string[];
}) => {
  const multiSigner = useMultiSigner();
  const paraWallet = useParaWallet();
  const signers =
    multiSigner?.signers.filter(
      ({ name }) => !enabledSigners || enabledSigners.includes(name),
    ) ?? [];
  const activeSigner = signers.find(
    ({ name }) => name === multiSigner?.activeSigner?.name,
  );
  // activeSigner is only set by connectSigner(), so sessions restored on load
  // (MidenFi reconnect, Para) fall back to whichever signer is connected.
  const connectedSigner = activeSigner?.isConnected
    ? activeSigner
    : (signers.find(({ isConnected }) => isConnected) ?? null);
  if (connectedSigner?.name === "MidenFi") {
    return <WalletMultiButton />;
  }
  if (connectedSigner?.name === "Para") {
    return (
      <Button
        className="flex items-center gap-2"
        variant="outline"
        onClick={() => connectedSigner.connect()}
      >
        <Image
          className="size-6 rounded-[4px]"
          src="/img/para.jpg"
          alt="Para Logo"
          width={160}
          height={160}
        />
        {paraWallet?.address
          ? formatEvmAddress(paraWallet.address)
          : "Para Wallet"}
      </Button>
    );
  }
  if (signers.length === 0) {
    return null;
  }
  return <SelectWalletButton signerNames={signers.map(({ name }) => name)} />;
};

export default WalletButton;
