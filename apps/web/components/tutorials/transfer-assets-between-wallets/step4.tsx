import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { wallets } = useAccounts();
  const { transactions } = useTransactions();
  const walletB = wallets.find(({ name }) => name === "Wallet B");
  const transaction = transactions.find(
    ({ accountId }) => accountId === walletB?.id,
  );
  return !!transaction;
};

const Step4Content = ({
  walletA,
  walletB,
}: {
  walletA?: Account;
  walletB?: Account;
}) => (
  <>
    <p>
      To complete the transfer, the output note has to be consumed by its target
      account.
    </p>
    <p>
      On{" "}
      <TutorialLink href={`/accounts/${walletB?.identifier}`}>
        Wallet B
      </TutorialLink>
      's page, take a look at the <em>"Consumable Notes"</em> section: the{" "}
      <strong>P2ID</strong> output note has been automatically detected as
      consumable by its recipient.
    </p>
    <p>
      You'll find a second <strong>P2ID</strong> note there, holding USDCx.
      Every Transaction pays a fee in the network's fee asset (USDCx on
      testnet), but Wallet B is brand new and its vault is empty. So the
      Playground asked the testnet faucet to send it some USDCx.
    </p>
    <p>
      Click the <em>"Consume all notes"</em> button to create a consume
      transaction. A single Transaction can consume multiple Notes at once: this
      one consumes both, and pays its fee out of the USDCx it receives.
      Consuming the MDN note on its own would fail, since Wallet B would have
      nothing to pay the fee with.
    </p>
    <p>
      The preview dialog lets you check the asset changes about to occur, and
      the fee. Then click <em>"Submit"</em> to complete the transfer.
    </p>
    {/* biome-ignore lint/a11y/useMediaCaption: silent animated diagram */}
    <video className="max-h-64 object-contain" autoPlay loop>
      <source
        src="/img/transfer-assets-transactions-video.mp4"
        type="video/mp4"
      />
      <p>Your browser does not support the video tag.</p>
    </video>
    <p>
      Take a look at this animated diagram: in this tutorial,{" "}
      <strong>Account 1</strong> is{" "}
      <TutorialLink href={`/accounts/${walletA?.identifier}`}>
        Wallet A
      </TutorialLink>{" "}
      and <strong>tx1</strong> is the send transaction you submitted in step 2.{" "}
      <strong>Account 2</strong> is{" "}
      <TutorialLink href={`/accounts/${walletB?.identifier}`}>
        Wallet B
      </TutorialLink>{" "}
      and <strong>tx2</strong> is the consume transaction you've just submitted.
    </p>
  </>
);

const Step4: TutorialStep = {
  title: "Consume the output note.",
  Content: () => {
    const { accounts } = useAccounts();
    const walletA = accounts.find(({ name }) => name === "Wallet A");
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const completed = useCompleted();
    return (
      <>
        <Step4Content walletA={walletA} walletB={walletB} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Consume the Note."
          titleWhenCompleted="The Note has been consumed."
          description={
            <p>
              Click <em>"Consume all notes"</em> to consume both notes at once,
              then preview and submit the resulting Transaction.
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

export default Step4;
