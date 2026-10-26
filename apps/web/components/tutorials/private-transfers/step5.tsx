import { EllipsisVertical } from "lucide-react";
import NextStepButton from "@/components/tutorials/next-step-button";
import useTransferNote from "@/components/tutorials/private-transfers/use-transfer-note";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";
import { formatId } from "@/lib/utils";

const useCompleted = () => {
  const note = useTransferNote();
  return !!note?.state.startsWith("consumed-");
};

const Step5Content = ({
  noteId,
  wallet,
}: {
  noteId?: string;
  wallet?: Account;
}) => (
  <>
    <p>
      The private note is on its way: only the Para Wallet can consume it, which
      requires a consume transaction signed by the Para Wallet.
    </p>
    <p>
      Disconnect Bread Wallet by clicking your wallet address button in the
      top-right corner and selecting <em>"Disconnect"</em>.
    </p>
    <p>
      Then click the <em>"Select Wallet"</em> button, select{" "}
      <em>"Para Wallet"</em> and log in again with your email address and the
      verification code Para sends you.
    </p>
    <p>
      Open your{" "}
      {wallet ? (
        <TutorialLink href={`/accounts/${wallet?.identifier}`}>
          Para Wallet details page
        </TutorialLink>
      ) : (
        "Para Wallet details page"
      )}
      : the private note sent by your Bread Wallet appears in the{" "}
      <em>"Consumable Notes"</em> section.
    </p>
    <p>
      If several Notes are listed, for example Notes left over from a previous
      run of this tutorial, consume the newest one: the Note sent in the
      previous step
      {noteId ? (
        <>
          , with ID <strong>{formatId(noteId)}</strong>
        </>
      ) : (
        ""
      )}
      .
    </p>
    <p>
      Click the <EllipsisVertical className="size-4 inline" /> icon button in
      the <em>"Consumable Notes"</em> table and select{" "}
      <em>"Consume note with Para Wallet"</em>. Para opens a confirmation modal
      summarizing the consume transaction: approve it right away to sign the
      Transaction, which moves the tokens into your Para Wallet's vault. Moving
      USDCx triggers the USDCx Faucet's transfer policy, which makes the
      Transaction expire about a minute after it's executed.
    </p>
    <p>
      If this is your Para Wallet's first Transaction, it also deploys the
      Account on-chain. Once the Transaction is committed, the Note leaves the{" "}
      <em>"Consumable Notes"</em> table.
    </p>
  </>
);

const Step5: TutorialStep = {
  title: "Consume the private note with your Para Wallet.",
  Content: () => {
    const { wallets } = useAccounts();
    const note = useTransferNote();
    const completed = useCompleted();
    return (
      <>
        <Step5Content
          wallet={wallets.find(({ name }) => name === "Para Wallet")}
          noteId={note?.id}
        />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Consume the private note."
          titleWhenCompleted="Your Para Wallet received a private transfer."
          description={
            <p>
              Disconnect Bread Wallet and reconnect Para Wallet. Then click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button in the{" "}
              <em>"Consumable Notes"</em> table of your Para Wallet details page
              and select <em>"Consume note with Para Wallet"</em>.
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

export default Step5;
