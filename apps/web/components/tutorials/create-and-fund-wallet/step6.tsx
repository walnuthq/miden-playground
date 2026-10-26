import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step6Content = ({ wallet }: { wallet?: Account }) => (
  <>
    <p>
      The asset vault of{" "}
      <TutorialLink href={`/accounts/${wallet?.identifier}`}>
        your wallet
      </TutorialLink>{" "}
      should now contain the MDN tokens minted by the faucet.
    </p>
    <p>
      Congratulations! You have successfully used the Miden Playground to
      interact with the Miden network and a faucet.
    </p>
    <p>
      Along the way, you performed core Miden operations: executing and proving
      Transactions, and creating and consuming Notes.
    </p>
  </>
);

const Step6: TutorialStep = {
  title: "Confirm your wallet is funded.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return <Step6Content wallet={wallet} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step6;
