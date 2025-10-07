import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/tutorial2/step2.mdx";

const useCompleted = () => {
  const { wallets } = useAccounts();
  const { transactions } = useTransactions();
  const walletA = wallets.find(({ name }) => name === "Wallet A");
  const transaction = transactions.find(
    ({ accountId, outputNotes }) =>
      accountId === walletA?.id && outputNotes.length === 1
  );
  return !!transaction;
};

const Step2: TutorialStep = {
  title: "Submit a send transaction.",
  Content: () => {
    const { wallets } = useAccounts();
    const walletA = wallets.find(({ name }) => name === "Wallet A");
    const walletB = wallets.find(({ name }) => name === "Wallet B");
    const completed = useCompleted();
    return (
      <>
        <Step2Content walletA={walletA} walletB={walletB} />
        <TutorialAlert
          completed={completed}
          title="Action required: Submit a send transaction."
          titleWhenCompleted="Your send transaction is submitted."
          description="Follow the instructions above to create and submit a send
            transaction against Wallet A."
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
