import { usePathname } from "next/navigation";
import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  return pathname === `/accounts/${multisig?.identifier}`;
};

const Step2: TutorialStep = {
  title: "Deploy a guardian wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>A wallet backed up by Miden Guardian involves two Accounts:</p>
        <BulletList>
          <li>
            <strong>Guardian wallet</strong>: a new <strong>Private</strong>{" "}
            wallet account that holds your funds. Miden Guardian stores a backup
            of its state off-chain, and every Transaction it executes requires
            both your signature and Miden Guardian's.
          </li>
          <li>
            <strong>Signer</strong>: your private Bread Wallet. Its key is
            registered as the only signer of the guardian wallet: it approves
            every change to the guardian wallet, and it's what lets you restore
            the guardian wallet if you lose its state.
          </li>
        </BulletList>
        <p>
          Let's deploy a guardian wallet with your connected Bread Wallet as its
          signer: on the{" "}
          <TutorialLink href="/accounts">accounts page</TutorialLink>, click the{" "}
          <em>"Create new account"</em> button and select the{" "}
          <em>"Deploy guardian wallet"</em> option.
        </p>
        <p>
          Give your guardian wallet a name and click <em>"Deploy"</em>. This
          registers the guardian wallet with Miden Guardian, with your Bread
          Wallet as its signer.
        </p>
        <p>
          Bread Wallet will then show several{" "}
          <em>"Opaque signature request"</em> prompts in a row: approve each of
          them. This is normal and expected, and it will happen again every time
          you interact with your guardian wallet in this tutorial. The
          Playground signs raw data, such as requests sent to Miden Guardian and
          proposal approvals, that Bread Wallet can't decode and display to you.
        </p>
        <p>
          Approving a signature you can't read is called{" "}
          <strong>blind signing</strong>, and it's risky: a malicious app could
          disguise an approval that moves your funds as an opaque request. Only
          approve opaque signature requests from apps you trust, and only right
          after an action you triggered yourself.
        </p>
        <p>
          Once it's deployed, click your guardian wallet's name on the accounts
          page to open its details page.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Deploy a guardian wallet."
          titleWhenCompleted="Your guardian wallet has been deployed."
          description={
            <p>
              Click the <em>"Create new account"</em> button, select{" "}
              <em>"Deploy guardian wallet"</em>, then open its details page.
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

export default Step2;
