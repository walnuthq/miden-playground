import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step6Content from "@/components/tutorials/tutorial9/step6.mdx";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note-script",
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
  title: "Create an increment note.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step6Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create the increment note."
          titleWhenCompleted="You created the increment note."
          description={
            <p>Follow the instructions to create a custom increment note.</p>
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
