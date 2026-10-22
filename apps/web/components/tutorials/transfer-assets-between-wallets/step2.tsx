import NextStepButton from "@/components/tutorials/next-step-button";
import Step2Content from "@/components/tutorials/transfer-assets-between-wallets/step2.mdx";
import useWalletB from "@/components/tutorials/transfer-assets-between-wallets/use-wallet-b";
import WalletBAlert from "@/components/tutorials/transfer-assets-between-wallets/wallet-b-alert";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useTransactions from "@/hooks/use-transactions";
import type { TutorialStep } from "@/lib/types/tutorial";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

const useCompleted = () => {
  const { walletA, walletB } = useWalletB();
  const { transactions } = useTransactions();
  const transaction = transactions.find(({ accountId, outputNotes }) => {
    const [outputNote] = outputNotes;
    const [suffix = "", prefix = ""] = outputNote?.storage ?? [];
    const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
    return accountId === walletA?.id && targetAccountId === walletB?.id;
  });
  return !!transaction;
};

const Step2: TutorialStep = {
  title: "Submit a send transaction.",
  Content: () => {
    const { walletA, walletB } = useWalletB();
    const completed = useCompleted();
    return (
      <>
        <Step2Content walletA={walletA} walletB={walletB} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Submit a send transaction."
          titleWhenCompleted="Your send transaction has been submitted."
          description="Follow the instructions above to create and submit a send
            transaction from Wallet A."
        />
        <WalletBAlert />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step2;
