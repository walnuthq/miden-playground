import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/create-and-fund-wallet/step3.mdx";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";

const Step3: TutorialStep = {
  title: "Submit a mint transaction on the faucet.",
  Content: () => {
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountId }) => accountId === faucet?.id
    );
    return (
      <>
        <Step3Content faucet={faucet} />
        <TutorialAlert
          completed={!!transaction}
          title="Action required: Submit a mint transaction."
          titleWhenCompleted="Your mint transaction is submitted."
          description="Follow the instructions above to create and submit a mint
            transaction against the faucet."
        />
      </>
    );
  },
  NextStepButton: () => {
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountId }) => accountId === faucet?.id
    );
    return <NextStepButton disabled={!transaction} />;
  },
};

export default Step3;
