import { EllipsisVertical } from "lucide-react";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";
import { getIdentifierPart } from "@/lib/utils/account";

const Step5Content = ({ address }: { address: string }) => (
  <>
    <p>
      Your timelocked note is committed on testnet. On the{" "}
      <TutorialLink href={`/accounts/${address}`}>Test Wallet</TutorialLink>'s
      page, take a look at the <em>"Consumable Notes"</em> section: the Note you
      created is listed there, since the Test Wallet is its target account.
    </p>
    <p>
      See your timelock at work: click the{" "}
      <EllipsisVertical className="size-4 inline" /> icon button at the end of
      the Note's row and select the <em>"Consume note with Test Wallet"</em>{" "}
      option. The Transaction fails with an{" "}
      <em>"assertion failed with error code"</em> error: that's the assertion
      you added, since testnet hasn't reached the timelock block height yet. A
      failed assertion doesn't carry its error's message, only a code derived
      from it: the code of your <InlineCode>ERR_P2ID_TIMELOCKED</InlineCode>.
      Once the height is reached, the same option moves the note's assets into
      the Test Wallet's vault.
    </p>
    <p>
      The Test Wallet is a standard wallet, and your note calls the standard
      basic wallet's <InlineCode>receive_asset</InlineCode>: a timelocked note
      targeted at your Bread Wallet or a Para wallet can be consumed from them
      the same way, once its height is reached.
    </p>
    <p>
      Congratulations! You have successfully used the Miden Playground to create
      your first custom note using a timelock pattern.
    </p>
    <p>
      You performed advanced testnet operations: you developed your own note
      script and used it to create a custom note on the network.
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
