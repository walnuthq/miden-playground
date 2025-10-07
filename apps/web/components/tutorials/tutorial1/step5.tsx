import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/tutorial1/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import useNotes from "@/hooks/use-notes";

const useCompleted = () => {
  const { wallets } = useAccounts();
  const { transactions } = useTransactions();
  const wallet = wallets.find(({ isPublic }) => isPublic);
  const transaction = transactions.find(
    ({ accountId }) => accountId === wallet?.id
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
        <TutorialAlert
          completed={completed}
          title="Action required: Consume the note."
          titleWhenCompleted="The note has been consumed."
          description={
            <p>
              Click on <em>"Consume note with {wallet?.name}"</em>, preview and
              submit the resulting transaction.
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
