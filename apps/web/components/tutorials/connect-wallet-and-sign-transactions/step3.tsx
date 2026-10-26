import AccountAddress from "@/components/lib/account-address";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step3Content = ({ wallet }: { wallet?: Account }) => (
  <>
    <p>
      Now that your wallet is funded, let's send some tokens to another wallet.
    </p>
    <p>
      To give you a recipient, the Playground created a new public wallet named{" "}
      <strong>Test Wallet</strong> and added it to your accounts. This wallet
      was created just for you, and its keys are stored in this browser.
    </p>
    {wallet ? <AccountAddress address={wallet.address} /> : null}
    <p>
      Head to the <TutorialLink href="/accounts">accounts page</TutorialLink> to
      see it listed next to your Bread Wallet, then proceed to the next step to
      send it some tokens.
    </p>
  </>
);

const Step3: TutorialStep = {
  title: "Meet the recipient wallet.",
  Content: () => {
    const { wallets, connectedWallet } = useAccounts();
    const recipient = wallets.find(
      ({ address }) => connectedWallet && address !== connectedWallet.address,
    );
    return <Step3Content wallet={recipient} />;
  },
  NextStepButton: () => <NextStepButton />,
};

export default Step3;
