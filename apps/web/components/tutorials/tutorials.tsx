import createAndFundWallet from "@/components/tutorials/create-and-fund-wallet";
import transferAssetsBetweenWallets from "@/components/tutorials/transfer-assets-between-wallets";
import connectWalletAndSignTransactions from "@/components/tutorials/connect-wallet-and-sign-transactions";
import interactWithTheCounterContract from "@/components/tutorials/interact-with-the-counter-contract";
import deployACounterContract from "@/components/tutorials/deploy-a-counter-contract";

const tutorials = [
  createAndFundWallet,
  transferAssetsBetweenWallets,
  connectWalletAndSignTransactions,
  interactWithTheCounterContract,
  deployACounterContract,
];

export default tutorials;
