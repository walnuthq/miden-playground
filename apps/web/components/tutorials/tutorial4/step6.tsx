import { useEffect, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step6Content from "@/components/tutorials/tutorial4/step6.mdx";
import { MIDEN_FAUCET_ACCOUNT_ID } from "@/lib/constants";

const useCompleted = () => {
  const [initialBalance, setInitialBalance] = useState(0n);
  const { connectedWallet } = useAccounts();
  const currentBalance = BigInt(
    (connectedWallet?.storageMode === "public" &&
      connectedWallet?.fungibleAssets.find(
        ({ faucetId }) => faucetId === MIDEN_FAUCET_ACCOUNT_ID,
      )?.amount) ??
      "0",
  );
  useEffect(() => {
    if (initialBalance === 0n) {
      setInitialBalance(currentBalance);
    }
  }, [initialBalance, currentBalance]);
  return initialBalance !== 0n && currentBalance > initialBalance;
};

const Step6: TutorialStep = {
  title: "Consume the private note with your public wallet.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step6Content
          wallet={
            connectedWallet?.storageMode === "public"
              ? connectedWallet
              : undefined
          }
        />
        <TutorialAlert
          completed={completed}
          title="Action required: Consume the private note."
          titleWhenCompleted="Your received a private transfer."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the consumable note row in your
              public wallet page details to consume the note with your wallet.
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

export default Step6;
