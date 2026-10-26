import CopyButton from "@/components/lib/copy-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  const dependenciesLength = script?.dependencies.length ?? 0;
  return dependenciesLength > 0;
};

const Step3: TutorialStep = {
  title: "Create the counter note script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Now that the counter contract is compiled, let's create the note
          script that calls its{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedure when the Note is consumed.
        </p>
        <p>
          Head to the <TutorialLink href="/scripts">scripts page</TutorialLink>,
          click the <em>"Create new script"</em> button and enter a name, for
          example <strong>counter-note</strong>{" "}
          <CopyButton content="Copy Script Name" copy="counter-note" />. Then
          select the <strong>Note Script</strong> type and the{" "}
          <strong>Counter Note</strong> example.
        </p>
        <p>
          Once your script is created, add the <strong>counter-account</strong>{" "}
          script as a dependency. The note script calls the counter contract's{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          and{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedures, so it needs to import the interface of the{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#accountcomponent">
            account component
          </ExternalLink>{" "}
          that defines them.
        </p>
        <p>
          Click the <em>"Metadata"</em> tab, then click the{" "}
          <em>"Add dependency"</em> button. In the <em>"Add Dependency"</em>{" "}
          dialog, select the <strong>counter-account</strong> script and click
          the <em>"Add"</em> button.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter note script."
          titleWhenCompleted="You created the counter note script and added its dependency."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create a{" "}
              <strong>Note Script</strong> from the{" "}
              <strong>Counter Note</strong> example, then add the{" "}
              <strong>counter-account</strong> script as a dependency in the{" "}
              <em>"Metadata"</em> tab.
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
