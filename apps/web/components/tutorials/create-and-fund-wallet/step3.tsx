import Step3Content from "@/components/tutorials/create-and-fund-wallet/step3.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { faucets } = useAccounts();
  const { transactions } = useTransactions();
  const faucet = faucets.find(({ name }) => name === "MDN Faucet");
  const transaction = transactions.find(
    ({ accountId }) => accountId === faucet?.id,
  );
  return !!transaction;
};

const Step3: TutorialStep = {
  title: "Submit a mint transaction on the faucet.",
  Content: () => {
    const { faucets } = useAccounts();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const completed = useCompleted();
    return (
      <>
        <Step3Content faucet={faucet} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Submit a mint transaction."
          titleWhenCompleted="Your mint transaction has been submitted."
          description="Follow the instructions above to create and submit a mint
            transaction on the faucet."
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step3;
