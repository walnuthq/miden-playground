import Step5Content from "@/components/tutorials/create-and-fund-wallet/step5.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import useTransactions from "@/hooks/use-transactions";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { wallets } = useAccounts();
  const { transactions } = useTransactions();
  const wallet = wallets.find(({ isPublic }) => isPublic);
  const transaction = transactions.find(
    ({ accountId }) => accountId === wallet?.id,
  );
  return !!transaction;
};

const Step5: TutorialStep = {
  title: "Consume the output note.",
  Content: () => {
    const { wallets, faucets } = useAccounts();
    const { inputNotes } = useNotes();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const note = inputNotes.find(({ senderId }) => senderId === faucet?.id);
    const completed = useCompleted();
    return (
      <>
        <Step5Content note={note} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Consume the Note."
          titleWhenCompleted="The Note has been consumed."
          description={
            <p>
              Click <em>"Consume note with {wallet?.name}"</em>, then preview
              and submit the resulting Transaction.
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
