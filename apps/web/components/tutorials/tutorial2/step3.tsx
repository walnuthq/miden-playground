import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import Step3Content from "@/components/tutorials/tutorial2/step3.mdx";

const Step3: TutorialStep = {
  title: "Inspect transaction and output note.",
  Content: () => {
    const { wallets } = useAccounts();
    const { transactions } = useTransactions();
    const walletA = wallets.find(({ name }) => name === "Wallet A");
    const walletB = wallets.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountId, outputNotes }) =>
        accountId === walletA?.id && outputNotes.length === 1
    );
    const note = transaction?.outputNotes[0];
    return (
      <Step3Content transaction={transaction} note={note} walletB={walletB} />
    );
  },
};

export default Step3;
