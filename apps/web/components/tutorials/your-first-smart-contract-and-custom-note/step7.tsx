import { EllipsisVertical } from "lucide-react";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step7Content from "@/components/tutorials/your-first-smart-contract-and-custom-note/step7.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const { components } = useComponents();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  const component = components.find(({ scriptId }) => scriptId === script?.id);
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? ""),
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
      ({ id, type }) =>
        !defaultScriptIds.includes(id) && type === "account-component",
    );
    const component = components.find(
      ({ scriptId }) => scriptId === script?.id,
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? ""),
    );
    return (
      <>
        <Step7Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Consume the increment note."
          titleWhenCompleted="Your increment note has been consumed."
          description={
            <p>
              Under <em>"Consumable Notes"</em> on your counter contract's
              details page, click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button at the
              end of your Note's row and select the{" "}
              <em>"Consume note with …"</em> option.
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
