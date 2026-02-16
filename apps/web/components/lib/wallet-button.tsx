// import Image from "next/image";
import {
  WalletMultiButton,
  // useWallet,
  // useWalletModal,
} from "@miden-sdk/miden-wallet-adapter";
// import { useAccount, useModal } from "@getpara/react-sdk";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@workspace/ui/components/dropdown-menu";
// import { Button } from "@workspace/ui/components/button";
// import useAccounts from "@/hooks/use-accounts";
// import { formatAddress } from "@/lib/utils";
// import useGlobalContext from "@/components/global-context/hook";

const WalletButton = () => {
  return <WalletMultiButton />;
  /* const { networkId } = useGlobalContext();
  const { connectedWallet } = useAccounts();
  const { connected: midenWalletConnected } = useWallet();
  const { setVisible } = useWalletModal();
  const { isConnected: paraWalletConnected } = useAccount();
  const { openModal } = useModal();
  if (midenWalletConnected) {
    return <WalletMultiButton />;
  }
  if (paraWalletConnected) {
    return (
      <Button
        className="flex items-center gap-2"
        variant="outline"
        onClick={() => openModal?.()}
      >
        <Image
          className="size-6 rounded-[4px]"
          src="/img/para.jpg"
          alt="Para Logo"
          width={160}
          height={160}
        />
        {connectedWallet
          ? formatAddress(connectedWallet.address, networkId, true)
          : "Loading Wallet…"}
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Select Wallet</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setVisible(true)}>
          Connect With Miden Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openModal?.()}>
          Connect With Para Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );*/
};

export default WalletButton;
