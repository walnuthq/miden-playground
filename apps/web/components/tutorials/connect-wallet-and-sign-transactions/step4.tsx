import { EllipsisVertical } from "lucide-react";
import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step4.mdx";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { P2ID_NOTE_CODE } from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

const useCompleted = () => {
  const { wallets, connectedWallet } = useAccounts();
  const senderAccount = wallets.find(
    ({ address }) => address === connectedWallet?.address,
  );
  const recipientAccount = wallets.find(
    ({ address }) => address !== connectedWallet?.address,
  );
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ senderId, scriptRoot, storage, state, type }) =>
      senderId === senderAccount?.id &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1] ?? "", storage[0] ?? "") ===
        recipientAccount?.id &&
      state === "committed" &&
      type === "private",
  );
  return !!note;
};

const Step4: TutorialStep = {
  title: "Send tokens to the recipient wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Send tokens to the recipient."
          titleWhenCompleted="The output note carrying your tokens has been created."
          description={
            <p>
              Click the <EllipsisVertical className="size-4 inline" /> icon
              button in your wallet's row on the accounts page and select the{" "}
              <em>"New send transaction"</em> option. Send at most 0.001 USDCX
              to the recipient wallet in a private note, then confirm the
              transaction in Bread Wallet.
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

export default Step4;
