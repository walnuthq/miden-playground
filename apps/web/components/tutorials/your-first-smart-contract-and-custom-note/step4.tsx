import NextStepButton from "@/components/tutorials/next-step-button";
import {
  CodeBlock,
  ExternalLink,
  InlineCode,
  NumberedList,
} from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  return script?.status === "compiled";
};

// The lines quoted here are apps/api/templates/counter-note.masm's, the
// source the script is created from: after editing the template, check them.
const Step4: TutorialStep = {
  title: "Understand and compile the counter note script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Now let's examine the note script you created. A{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/note/">
            Note
          </ExternalLink>{" "}
          carries a script that runs when an Account consumes it, in a
          Transaction of that Account: the script can call the consuming
          Account's procedures.
        </p>
        <p>
          <strong>Imports and Errors</strong>
        </p>
        <CodeBlock
          code={`use counter_account

const ERR_COUNT_NOT_INCREMENTED = "the count didn't go up by one"`}
        />
        <p>
          <InlineCode>use counter_account</InlineCode> imports the module of the{" "}
          <strong>counter-account</strong> script you added as a dependency.{" "}
          <strong>
            <InlineCode>ERR_COUNT_NOT_INCREMENTED</InlineCode>
          </strong>{" "}
          is an error message the script uses when its check fails.
        </p>
        <p>
          <strong>The Note Script Procedure</strong>
        </p>
        <CodeBlock
          code={`@note_script
@locals(1)
pub proc main()
    call.counter_account::get_count
    add.1 loc_store.0
    call.counter_account::increment_count
    drop call.counter_account::get_count
    loc_load.0 assert_eq.err=ERR_COUNT_NOT_INCREMENTED
end`}
        />
        <p>
          This is the procedure without its comments. The{" "}
          <strong>
            <InlineCode>@note_script</InlineCode>
          </strong>{" "}
          attribute marks{" "}
          <strong>
            <InlineCode>main</InlineCode>
          </strong>{" "}
          as the entry point of the note script, executed when the Note is
          consumed. <InlineCode>@locals(1)</InlineCode> reserves one slot of
          local memory for the procedure. The procedure:
        </p>
        <NumberedList>
          <li>
            <strong>Reads the initial counter value</strong>:{" "}
            <InlineCode>call</InlineCode> runs the consuming Account's{" "}
            <InlineCode>get_count</InlineCode> on the top 16 elements of the
            stack and puts its 16 outputs in their place, the count on top.
          </li>
          <li>
            <strong>Keeps the expected value</strong>:{" "}
            <InlineCode>add.1</InlineCode> adds one to the count, and{" "}
            <InlineCode>loc_store.0</InlineCode> moves the result from the stack
            to the local slot.
          </li>
          <li>
            <strong>
              Calls <InlineCode>increment_count</InlineCode>
            </strong>{" "}
            to increment the counter, then drops the new count it returns.
          </li>
          <li>
            <strong>Checks that the increment succeeded</strong>: it reads the
            count again with <InlineCode>get_count</InlineCode>,{" "}
            <InlineCode>loc_load.0</InlineCode> pushes the expected value back,
            and <InlineCode>assert_eq</InlineCode> checks that the two top
            values are equal.
          </li>
        </NumberedList>
        <p>
          If the assertion fails, the Transaction consuming the Note fails too.
          The Playground then shows its error as an error code, not as the{" "}
          <InlineCode>ERR_COUNT_NOT_INCREMENTED</InlineCode> message.
        </p>
        <p>
          A <InlineCode>call</InlineCode> names a procedure by its MAST root, a
          hash of its code: the Account consuming the Note must have the{" "}
          <strong>counter-account</strong> component, or it has no such
          procedure and can't consume the Note. This example demonstrates a
          complete interaction pattern: the account contract manages persistent
          state, while the note script triggers state changes when the Note is
          consumed.
        </p>
        <p>
          Once you've read the note script code, click the <em>"Compile"</em>{" "}
          button to compile the script. If you compiled it before adding the
          dependency, the button reads <em>"Re-compile"</em>.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Compile the counter note script."
          titleWhenCompleted="You compiled the counter note script."
          description={
            <p>
              Once you've read the note script code, click the{" "}
              <em>"Compile"</em> button to compile the script.
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
