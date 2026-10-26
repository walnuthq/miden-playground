import { useLocation } from "react-router";
import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList, ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { pathname } = useLocation();
  const { connectedWallet } = useAccounts();
  return (
    connectedWallet?.name === "Bread Wallet" &&
    connectedWallet.isPrivate &&
    pathname === `/accounts/${connectedWallet.identifier}`
  );
};

const Step1Content = ({ wallet }: { wallet?: Account }) => (
  <>
    <p>
      In this tutorial, you'll transfer assets privately between two different
      wallets: your{" "}
      <ExternalLink href="https://chromewebstore.google.com/detail/bread-wallet-by-miden/coajhopfooegmaifelglfboehacldcbo">
        Bread Wallet
      </ExternalLink>{" "}
      and a{" "}
      <ExternalLink href="https://www.getpara.com/">Para Wallet</ExternalLink>,
      an embedded wallet you log into with your email address.
    </p>
    <p>
      On Miden, every Account is either public or private, a choice encoded in
      its{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/id#account-type">
        Account ID
      </ExternalLink>
      :
    </p>
    <BulletList>
      <li>
        <strong>Public Accounts</strong>: the Account's state (code, storage and
        vault) is stored on-chain, so anyone can see its balance and activity,
        much like an account on most blockchains.
      </li>
      <li>
        <strong>Private Accounts</strong>: only a commitment (hash) to the
        Account's state is stored on-chain. The state itself stays on your
        device, so your balance and activity remain private to you.
      </li>
    </BulletList>
    <p>
      The Bread Wallet used in this tutorial must be a <strong>Private</strong>{" "}
      account. The Para Wallet that you'll create later in this tutorial is a{" "}
      <strong>Public</strong> account.
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
  title: "Connect your private Bread Wallet to the Playground.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step1Content
          wallet={
            connectedWallet?.name === "Bread Wallet"
              ? connectedWallet
              : undefined
          }
        />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Connect your private Bread Wallet."
          titleWhenCompleted="Your Bread Wallet is connected and imported."
          description={
            <p>
              Click the <em>"Select Wallet"</em> button in the top-right corner
              and select <em>"Bread Wallet"</em> to connect a{" "}
              <strong>Private</strong> Bread Wallet account to the Playground.
              Once your wallet is imported, open its account details page.
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
