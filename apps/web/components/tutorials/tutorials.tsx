import { type Tutorial } from "@/lib/types";
import createAndFundWalletTutorial from "@/components/tutorials/create-and-fund-wallet";
import transferAssetsBetweenWalletsTutorial from "@/components/tutorials/transfer-assets-between-wallets";
import connectWalletAndSignTransactions from "@/components/tutorials/connect-wallet-and-sign-transactions";

/* const SwapAssetsStep1 = {
  title: "",
  Content: () => {
    return (
      <>
        <p>TODO</p>
      </>
    );
  },
  NextStepButton: () => {
    return <NextStepButton disabled onClick={() => {}} />;
  },
}; */

const tutorials: Tutorial[] = [
  createAndFundWalletTutorial,
  transferAssetsBetweenWalletsTutorial,
  connectWalletAndSignTransactions,
];

export default tutorials;
