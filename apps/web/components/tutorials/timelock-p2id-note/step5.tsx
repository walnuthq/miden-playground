import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";
import { getIdentifierPart } from "@/lib/utils/account";

const Step5Content = ({ address }: { address: string }) => (
  <>
    <p>
      Congratulations! You have successfully used the Miden Playground to create
      your first custom note using a timelock pattern.
    </p>
    <p>
      You performed advanced testnet operations: you developed your own note
      script and used it to create a custom note on the network.
    </p>
    <p>
      On the{" "}
      <TutorialLink href={`/accounts/${address}`}>Test Wallet</TutorialLink>'s
      page, take a look at the <em>"Consumable Notes"</em> section: the Note you
      created is listed there, since the Test Wallet is its target account.
      However, the Test Wallet won't be able to claim the note's assets until
      the timelock block height has been reached.
    </p>
  </>
);

const Step5: TutorialStep = {
  title: "Check the Test Wallet's consumable notes.",
  Content: () => {
    const { wallets } = useAccounts();
    const testWallet = wallets.find(({ name }) => name === "Test Wallet");
    return (
      <Step5Content address={getIdentifierPart(testWallet?.address ?? "")} />
    );
  },
  NextStepButton: NextTutorialButton,
};

export default Step5;
