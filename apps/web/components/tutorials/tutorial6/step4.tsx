import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial6/step4.mdx";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { P2IDE_NOTE_CODE, TEST_WALLET_ACCOUNT_ID } from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";
import useGlobalContext from "@/components/global-context/hook";

const useCompleted = () => {
  const { wallets, connectedWallet } = useAccounts();
  const senderAccount = wallets.find(
    ({ address }) => address === connectedWallet?.address
  );
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ senderId, scriptRoot, inputs, state, type }) =>
      senderId === senderAccount?.id &&
      scriptRoot === P2IDE_NOTE_CODE &&
      accountIdFromPrefixSuffix(inputs[1]!, inputs[0]!) ===
        TEST_WALLET_ACCOUNT_ID &&
      state === "committed" &&
      type === "public"
  );
  return !!note;
};

const Step4: TutorialStep = {
  title: "Create a note by executing a transaction.",
  Content: () => {
    const { blockNum } = useGlobalContext();
    const completed = useCompleted();
    return (
      <>
        <Step4Content blockNum={blockNum + 100} />
        <TutorialAlert
          completed={completed}
          title="Action required: Create the note."
          titleWhenCompleted="You created the timelock P2ID note."
          description={
            <p>
              Follow the instructions to create your custom timelock P2ID note.
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
