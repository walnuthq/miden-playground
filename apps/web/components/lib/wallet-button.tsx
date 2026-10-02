import Image from "next/image";
import {
  WalletMultiButton,
  useWallet,
  useWalletModal,
} from "@miden-sdk/miden-wallet-adapter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { useParaWallet } from "@/components/providers/para-wallet-context";

const formatEvmAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const SelectWalletDropdown = ({
  onSelectPara,
}: {
  onSelectPara?: () => void;
}) => {
  const { setVisible } = useWalletModal();
  return (
    // Non-modal: Para's dialog uses its own bundled copy of Radix, and opening
    // it while a modal menu is closing leaves `pointer-events: none` on body.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Select Wallet</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setVisible(true)}>
          Bread Wallet
        </DropdownMenuItem>
        {onSelectPara && (
          <DropdownMenuItem onClick={onSelectPara}>
            Para Wallet
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const WalletButton = () => {
  const { connected: breadWalletConnected } = useWallet();
  const paraWallet = useParaWallet();
  if (breadWalletConnected) {
    return <WalletMultiButton />;
  }
  if (!paraWallet?.isConnected) {
    return <SelectWalletDropdown onSelectPara={paraWallet?.openModal} />;
  }
  return (
    <Button
      className="flex items-center gap-2"
      variant="outline"
      onClick={paraWallet.openModal}
    >
      <Image
        className="size-6 rounded-[4px]"
        src="/img/para.jpg"
        alt="Para Logo"
        width={160}
        height={160}
      />
      {paraWallet.address
        ? formatEvmAddress(paraWallet.address)
        : "Para Wallet"}
    </Button>
  );
};

export default WalletButton;
