import NextStepButton from "@/components/tutorials/next-step-button";
import Step4Content from "@/components/tutorials/transfer-assets-between-wallets/step4.mdx";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
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
              Click <em>"Consume all notes"</em>, then preview and submit the
              resulting Transaction.
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
