import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial2/step4.mdx";

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
        <TutorialAlert
          completed={completed}
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
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step4;
