import { type Tutorial } from "@/lib/types";
import createAndFundWalletTutorial from "@/components/tutorials/create-and-fund-wallet";
import transferAssetsBetweenWalletsTutorial from "@/components/tutorials/transfer-assets-between-wallets";
import connectWalletAndSignTransactions from "@/components/tutorials/connect-wallet-and-sign-transactions";
import interactWithTheCounterContract from "@/components/tutorials/interact-with-the-counter-contract";

const tutorials: Tutorial[] = [
  createAndFundWalletTutorial,
  transferAssetsBetweenWalletsTutorial,
  connectWalletAndSignTransactions,
  interactWithTheCounterContract,
];

export default tutorials;
