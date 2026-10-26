import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  return connectedWallet?.isPrivate;
};

const Step1: TutorialStep = {
  title: "Connect your private Bread Wallet to the Playground.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          In this tutorial, you'll protect your funds with{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/miden-guardian/">
            Miden Guardian
          </ExternalLink>
          , an off-chain service that backs up and syncs private account state
          without being able to move your funds.
        </p>
        <p>
          In the previous tutorial, you saw that the state of a{" "}
          <strong>Private</strong> account stays on your device: only a
          commitment to it is stored on-chain. The flip side is that{" "}
          <strong>losing this state means losing your funds</strong>, just like
          losing a private key. If your private wallet lives on your phone and
          you lose your phone, your assets are gone with it.
        </p>
        <p>
          Miden Guardian solves this by keeping an up-to-date backup of your
          account state. Every change to the Account must be approved by both
          you and Miden Guardian, so Miden Guardian always holds the latest
          state, but it can never move your funds on its own. If you lose your
          device, you can restore the latest state from Miden Guardian, as long
          as you still control the Account's signing key. To learn more, read{" "}
          <ExternalLink href="https://www.miden.xyz/blog/what-is-miden-guardian">
            What is Miden Guardian?
          </ExternalLink>
        </p>
        <p>
          Miden Guardian can back up Accounts controlled by several signers, but
          in this tutorial you'll set up a backup for a solo account, controlled
          by your private Bread Wallet.
        </p>
        <p>
          Bread Wallet accounts are <strong>Private</strong> by default, so you
          can use the account you used in the previous tutorials.
        </p>
        <p>
          Then click the <em>"Select Wallet"</em> button, select{" "}
          <em>"Bread Wallet"</em>, and accept the request to access your account
          by clicking <em>"Connect"</em>.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Connect your private Bread Wallet."
          titleWhenCompleted="Your private Bread Wallet is connected."
          description={
            <p>
              Click the <em>"Select Wallet"</em> button in the top-right corner,
              select <em>"Bread Wallet"</em> and connect a{" "}
              <strong>Private</strong> account to the Playground.
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
