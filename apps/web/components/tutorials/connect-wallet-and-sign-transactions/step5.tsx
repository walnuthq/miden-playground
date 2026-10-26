import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step5: TutorialStep = {
  title: "Check your wallet activity.",
  Content: () => (
    <>
      <p>
        Congratulations! You have used the Miden Playground to connect your
        Bread Wallet and sign Transactions on testnet.
      </p>
      <p>
        You performed basic testnet operations: requesting tokens from the
        public USDCx Faucet and sending tokens to another wallet.
      </p>
      <p>
        Open the Bread Wallet browser extension to review your activity and see
        all the operations you performed while interacting with the Playground.
      </p>
    </>
  ),
  NextStepButton: NextTutorialButton,
};

export default Step5;
