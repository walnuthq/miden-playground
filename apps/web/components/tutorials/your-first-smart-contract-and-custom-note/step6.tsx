import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ senderId, scriptId, state, type }) =>
      senderId === connectedWallet?.id &&
      scriptId === script?.id &&
      state === "committed" &&
      type === "public",
  );
  return !!note;
};

const Step6: TutorialStep = {
  title: "Create the increment note.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Let's create the increment note by executing a Transaction that
          outputs a Note with your <strong>counter-note</strong> script. Your
          wallet signs this Transaction, so make sure it's connected to the
          Playground before continuing.
        </p>
        <p>
          From the <TutorialLink href="/notes">notes page</TutorialLink>, click
          the <em>"Add note"</em> button and select the <em>"Create note"</em>{" "}
          option.
        </p>
        <p>
          A <em>"Create Note"</em> dialog shows up to help you configure the
          note creation transaction. Set the recipient account to the counter
          contract you deployed in the previous step, select the{" "}
          <strong>counter-note</strong> script and leave the note type set to{" "}
          <strong>Public</strong>. Leave the <em>"Network note"</em> toggle off:
          unlike in the <em>"Network transactions"</em> tutorial, you'll consume
          this Note yourself.
        </p>
        <p>
          Don't add any note assets or note storage: the Note doesn't need to
          carry assets or take any parameters.
        </p>
        <p>
          Once you're done, click the <em>"Create"</em> button and confirm the
          Transaction in your wallet.
        </p>
        <p>
          It takes some time for your Note to be committed on testnet: wait
          until it shows up in the notes list with the{" "}
          <strong>Committed</strong> state.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the increment note."
          titleWhenCompleted="Your increment note has been committed."
          description={
            <p>
              Click the <em>"Add note"</em> button on the notes page, select the{" "}
              <em>"Create note"</em> option and create a public note with the{" "}
              <strong>counter-note</strong> script for your counter contract.
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
