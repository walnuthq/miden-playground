import { useInterval } from "usehooks-ts";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial6/step4.mdx";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { P2IDE_NOTE_CODE, TEST_WALLET_ACCOUNT_ID } from "@/lib/constants";
import { noteInputsToAccountId } from "@/lib/types/note";

const useCompleted = () => {
  const { accountId } = useWallet();
  const { syncState } = useGlobalContext();
  const { wallets } = useAccounts();
  const senderAccount = wallets.find(({ address }) => address === accountId);
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ senderId, scriptRoot, inputs, state, type }) =>
      senderId === senderAccount?.id &&
      scriptRoot === P2IDE_NOTE_CODE &&
      noteInputsToAccountId(inputs) === TEST_WALLET_ACCOUNT_ID &&
      state === "committed" &&
      type === "public"
  );
  useInterval(
    () => {
      const waitForSyncState = async () => {
        await syncState();
      };
      waitForSyncState();
    },
    note ? null : 1000
  );
  return !!note;
};

const Step4: TutorialStep = {
  title: "Create a note by executing a transaction.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
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
