import { type Tutorial } from "@/lib/types";
import createAndFundWalletTutorial from "@/components/tutorials/create-and-fund-wallet";
import transferAssetsBetweenWalletsTutorial from "@/components/tutorials/transfer-assets-between-wallets";

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
  /* {
    id: "swap-assets",
    title: "Swap assets",
    tagline: "Swap an asset for another.",
    description: "Learn how to perform a simple swap on Miden.",
    initialRoute: "/accounts",
    storeDump: JSON.stringify(tutorial3StoreDump),
    state: JSON.stringify(tutorial3State),
    steps: [SwapAssetsStep1],
  }, */
];

export default tutorials;
