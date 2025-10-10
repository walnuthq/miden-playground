import { EllipsisVertical } from "lucide-react";
import { useInterval } from "usehooks-ts";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/tutorial3/step5.mdx";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { P2ID_NOTE_CODE } from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";

const useCompleted = () => {
  const { accountId } = useWallet();
  const { syncState } = useGlobalContext();
  const { wallets } = useAccounts();
  const senderAccount = wallets.find(({ address }) => address === accountId);
  const recipientAccount = wallets.find(({ address }) => address !== accountId);
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ senderId, scriptRoot, inputs, state, type }) =>
      senderId === senderAccount?.id &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(inputs[1]!, inputs[0]!) ===
        recipientAccount?.id &&
      state === "committed" &&
      type === "public"
  );
  useInterval(syncState, note ? null : 1000);
  return !!note;
};

const Step5: TutorialStep = {
  title: "Send tokens to the recipient wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Send tokens to recipient."
          titleWhenCompleted="Output note with sent tokens created."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on your wallet row in the accounts page and select the{" "}
              <em>"New send transaction"</em> option. Configure and sign a send
              transaction to the recipient wallet to finish this tutorial.
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
