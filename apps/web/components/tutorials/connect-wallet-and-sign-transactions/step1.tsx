import { usePathname } from "next/navigation";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { connectedWallet } = useAccounts();
  return (
    connectedWallet?.isPrivate &&
    pathname === `/accounts/${connectedWallet?.identifier}`
  );
};

const Step1Content = ({ wallet }: { wallet?: Account }) => (
  <>
    <p>
      In this tutorial, you'll connect your{" "}
      <ExternalLink href="https://chromewebstore.google.com/detail/bread-wallet-by-miden/coajhopfooegmaifelglfboehacldcbo">
        Bread Wallet
      </ExternalLink>{" "}
      to the Playground and use it to sign Transactions: receiving tokens from a
      faucet and sending tokens to another wallet.
    </p>
    <p>
      Make sure the Bread Wallet extension is pinned in your browser, then click
      the <em>"Select Wallet"</em> button, select <em>"Bread Wallet"</em> and
      accept the connection request in Bread Wallet.
    </p>
    <p>
      The Playground automatically imports your wallet. Once it appears on the
      accounts page,{" "}
      {wallet ? (
        <TutorialLink href={`/accounts/${wallet?.identifier}`}>
          click its name
        </TutorialLink>
      ) : (
        "click its name"
      )}{" "}
      to inspect it and proceed to the next step.
    </p>
  </>
);

const Step1: TutorialStep = {
  title: "Connect your wallet to the Playground.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step1Content wallet={connectedWallet} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Connect your wallet."
          titleWhenCompleted="Your wallet is connected and imported."
          description={
            <p>
              Click the <em>"Select Wallet"</em> button in the top-right corner
              and select <em>"Bread Wallet"</em> to connect it to the
              Playground. Once your wallet is imported, open its account details
              page.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step1;
