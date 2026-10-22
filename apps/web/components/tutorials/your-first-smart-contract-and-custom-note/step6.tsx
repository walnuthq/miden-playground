import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step6Content from "@/components/tutorials/your-first-smart-contract-and-custom-note/step6.mdx";
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
        <Step6Content />
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
