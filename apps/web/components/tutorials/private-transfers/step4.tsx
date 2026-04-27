import { useEffect, useState } from "react";
import type { TutorialStep } from "@/lib/types/tutorial";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/private-transfers/step4.mdx";
import { midenFaucetAccountId } from "@/lib/constants";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const [initialBalance, setInitialBalance] = useState(0n);
  const { connectedWallet } = useAccounts();
  const currentBalance = BigInt(
    (connectedWallet?.storageMode === "private" &&
      connectedWallet?.fungibleAssets.find(
        ({ faucetId }) => faucetId === midenFaucetAccountId(networkId),
      )?.amount) ??
      "0",
  );
  useEffect(() => {
    if (initialBalance === 0n) {
      setInitialBalance(currentBalance);
    }
  }, [initialBalance, currentBalance]);
  return initialBalance !== 0n && currentBalance < initialBalance;
};

const Step5: TutorialStep = {
  title: "Send tokens privately to your public wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Send tokens to your public wallet."
          titleWhenCompleted="Private note with sent tokens created."
          description={
            <p>
              Click on the <em>"Create new transaction"</em> button and select
              the <em>"New send transaction"</em> option. Configure and sign a
              send transaction to create a private note consumable by your
              public wallet.
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
