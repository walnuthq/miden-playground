import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { EllipsisVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTutorials from "@/hooks/use-tutorials";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const nonce = multisig?.nonce ?? 0;
  return nonce > 0;
};

const Step5Content = ({ account }: { account?: Account }) => (
  <>
    <p>
      Open the{" "}
      {account ? (
        <TutorialLink href={`/accounts/${account?.identifier}?tab=guardian`}>
          Guardian
        </TutorialLink>
      ) : (
        <em>"Guardian"</em>
      )}{" "}
      tab of your guardian wallet to list its proposals.
    </p>
    <p>
      The consume note proposal created in the previous step is in the{" "}
      <strong>Pending</strong> state: it needs your signature before it can be
      executed.
    </p>
    <p>
      Click the <EllipsisVertical className="size-4 inline" /> icon button in
      the <em>"Proposals"</em> table and select <em>"Sign proposal"</em>, then
      approve the <em>"Opaque signature request"</em> prompts in Bread Wallet.
    </p>
    <p>
      Once signed, the proposal moves from <strong>Pending</strong> to{" "}
      <strong>Ready</strong>. Click the{" "}
      <EllipsisVertical className="size-4 inline" /> icon button again and
      select <em>"Execute proposal"</em> to execute it with your guardian
      wallet.
    </p>
    <p>
      This takes a few moments: the Playground builds the consume transaction
      with your signature and Miden Guardian's, proves it and submits it to the
      network. As this is the guardian wallet's first Transaction, it also
      registers the Account on-chain, and its fee is paid with the USDCx the
      note carries. Miden Guardian then updates its backup with the new state of
      your guardian wallet.
    </p>
    <p>
      Once the Transaction is executed, open the{" "}
      {account ? (
        <TutorialLink href={`/accounts/${account?.identifier}`}>
          Information
        </TutorialLink>
      ) : (
        <em>"Information"</em>
      )}{" "}
      tab of your guardian wallet to see your tokens in its asset vault.
    </p>
    <p>
      When you click <em>"Next step"</em>, the Playground simulates losing your
      device: it disconnects Bread Wallet and deletes the guardian wallet from
      the Playground.
    </p>
  </>
);

const Step5: TutorialStep = {
  title: "Sign and execute the proposal.",
  Content: () => {
    const completed = useCompleted();
    const { multisigs } = useAccounts();
    const [multisig] = multisigs;
    return (
      <>
        <Step5Content account={multisig} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Sign and execute the proposal."
          titleWhenCompleted="Your proposal has been executed."
          description={
            <p>
              In the <em>"Guardian"</em> tab of your guardian wallet, click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button in the
              proposal row and select <em>"Sign proposal"</em>, then{" "}
              <em>"Execute proposal"</em>.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const router = useRouter();
    const { disconnect } = useWallet();
    const { multisigs, deleteAccount } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    const completed = useCompleted();
    return (
      <NextStepButton
        disabled={!completed}
        onClick={() => {
          nextTutorialStep();
          const [multisig] = multisigs;
          if (multisig) {
            disconnect();
            deleteAccount(multisig.id);
            router.push("/accounts");
          }
        }}
      />
    );
  },
};

export default Step5;
