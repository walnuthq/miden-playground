import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step5Content = ({ walletB }: { walletB?: Account }) => (
  <>
    <p>
      The <em>"Assets"</em> table of{" "}
      <TutorialLink href={`/accounts/${walletB?.identifier}`}>
        Wallet B
      </TutorialLink>{" "}
      should now list the MDN tokens you transferred, along with the USDCx left
      after paying the fee. Its nonce went from 0 to 1: the consume transaction
      was its first.
    </p>
    <p>
      Congratulations! You have successfully used the Miden Playground to
      transfer assets between two wallets.
    </p>
    <p>
      Along the way, you performed core Miden operations: executing and proving
      Transactions, and creating and consuming Notes.
    </p>
  </>
);

const Step5: TutorialStep = {
  title: "Confirm the assets have been transferred.",
  Content: () => {
    const { wallets } = useAccounts();
    const walletB = wallets.find(({ name }) => name === "Wallet B");
    return <Step5Content walletB={walletB} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step5;
