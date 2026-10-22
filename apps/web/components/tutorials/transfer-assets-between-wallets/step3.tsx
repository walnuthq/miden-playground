import NextStepButton from "@/components/tutorials/next-step-button";
import Step3Content from "@/components/tutorials/transfer-assets-between-wallets/step3.mdx";
import useWalletB from "@/components/tutorials/transfer-assets-between-wallets/use-wallet-b";
import WalletBAlert from "@/components/tutorials/transfer-assets-between-wallets/wallet-b-alert";
import useTransactions from "@/hooks/use-transactions";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step3: TutorialStep = {
  title: "Inspect the transaction and its output note.",
  Content: () => {
    const { walletA, walletB } = useWalletB();
    const { transactions } = useTransactions();
    const transaction = transactions.find(
      ({ accountId, outputNotes }) =>
        accountId === walletA?.id && outputNotes.length === 2,
    );
    const note = transaction?.outputNotes[0];
    return (
      <>
        <Step3Content transaction={transaction} note={note} walletB={walletB} />
        <WalletBAlert />
      </>
    );
  },
  // Step 4 has Wallet B pay its fee out of the fee note: wait for it.
  NextStepButton: () => {
    const { funded } = useWalletB();
    return (
      <NextStepButton
        text={funded ? undefined : "Funding Wallet B…"}
        disabled={!funded}
      />
    );
  },
};

export default Step3;
