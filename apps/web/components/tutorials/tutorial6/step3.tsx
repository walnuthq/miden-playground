import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial6/step3.mdx";
import useScripts from "@/hooks/use-scripts";
import defaultScripts from "@/lib/types/default-scripts";

const useCompleted = () => {
  const { scripts } = useScripts();
  const defaultScriptIds = defaultScripts.map(({ id }) => id);
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note"
  );
  const firstMatches = script?.rust.match(
    /let\s+timelock_block_height\s*=\s*inputs\[2\];/
  );
  const secondMatches = script?.rust.match(
    /let\s+current_block_height\s*=\s*tx::get_block_number\(\);/
  );
  const thirdMatches = script?.rust.match(
    /assert_lte\s*\(\s*timelock_block_height\s*,\s*current_block_height\s*\);/
  );
  return !!firstMatches && !!secondMatches && !!thirdMatches;
};

const Step3: TutorialStep = {
  title: "Add timelock logic to the P2ID Note.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Compile the script."
          titleWhenCompleted="You compiled the timelock P2ID script."
          description={
            <p>
              Follow the instructions to add timelock logic to your P2ID script.
              When you're done, click on the <em>"Compile"</em> button in the
              editor console to compile your script.
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

export default Step3;
