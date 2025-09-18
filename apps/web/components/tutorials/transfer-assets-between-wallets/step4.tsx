import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/transfer-assets-between-wallets/step4.mdx";

const Step4: TutorialStep = {
  title: "Consume the output note.",
  Content: () => {
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountId }) => accountId === walletB?.id
    );
    return (
      <>
        <Step4Content walletB={walletB} />
        <TutorialAlert
          completed={!!transaction}
          title="Action required: Consume the note."
          titleWhenCompleted="The note has been consumed."
          description={
            <p>
              Click on <em>"Consume all notes"</em>, preview and submit the
              resulting transaction.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountId }) => accountId === walletB?.id
    );
    return <NextStepButton disabled={!transaction} />;
  },
};

export default Step4;
