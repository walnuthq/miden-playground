import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step7Content from "@/components/tutorials/tutorial9/step7.mdx";
import useScripts from "@/hooks/use-scripts";
import useComponents from "@/hooks/use-components";
import { defaultScriptIds } from "@/lib/types/default-scripts";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const { components } = useComponents();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "account"
  );
  const component = components.find(({ scriptId }) => scriptId === script?.id);
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? "")
  );
  return counter?.consumableNoteIds.length === 0;
};

const Step7: TutorialStep = {
  title: "Consume the increment note.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const { scripts } = useScripts();
    const { components } = useComponents();
    const script = scripts.find(
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "account"
    );
    const component = components.find(
      ({ scriptId }) => scriptId === script?.id
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? "")
    );
    return (
      <>
        <Step7Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Consume the increment note."
          titleWhenCompleted="Increment note has been consumed."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the consumable note row in the
              counter account page details to consume the note with the counter
              contract.
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

export default Step7;
