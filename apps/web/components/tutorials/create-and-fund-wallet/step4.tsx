import { type TutorialStep } from "@/lib/types/tutorial";
import Step4Content from "@/components/tutorials/create-and-fund-wallet/step4.mdx";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";

const Step4: TutorialStep = {
  title: "Analyze the mint transaction.",
  Content: () => {
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountId }) => accountId === faucet?.id
    );
    return <Step4Content transaction={transaction} />;
  },
};

export default Step4;
