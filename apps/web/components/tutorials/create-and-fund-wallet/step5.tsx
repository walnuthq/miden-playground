import { type TutorialStep } from "@/lib/types";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/create-and-fund-wallet/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import useNotes from "@/hooks/use-notes";

const Step5: TutorialStep = {
  title: "Consume the output note.",
  Content: () => {
    const { wallets, faucets } = useAccounts();
    const { transactions } = useTransactions();
    const { inputNotes } = useNotes();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountId }) => accountId === wallet?.id
    );
    const note = inputNotes.find(({ senderId }) => senderId === faucet?.id);
    return (
      <>
        <Step5Content note={note} />
        <TutorialAlert
          completed={!!transaction}
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
    const { wallets } = useAccounts();
    const { transactions } = useTransactions();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const transaction = transactions.find(
      ({ accountId }) => accountId === wallet?.id
    );
    return <NextStepButton disabled={!transaction} />;
  },
};

export default Step5;
