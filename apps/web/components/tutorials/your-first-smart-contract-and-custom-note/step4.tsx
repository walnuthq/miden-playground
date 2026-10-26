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

const Step4: TutorialStep = {
  title: "Understand and compile the counter note script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>Now let's examine the note script you created.</p>
        <p>
          <strong>No-std Setup</strong>
        </p>
        <p>
          Like the counter contract, the note script uses{" "}
          <strong>
            <InlineCode>#![no_std]</InlineCode>
          </strong>{" "}
          and enables the{" "}
          <strong>
            <InlineCode>alloc_error_handler</InlineCode>
          </strong>{" "}
          language feature.
        </p>
        <p>
          <strong>Miden Imports</strong>
        </p>
        <CodeBlock code={`use miden::*;`} />
        <p>
          The note script imports the whole{" "}
          <strong>
            <InlineCode>miden</InlineCode>
          </strong>{" "}
          prelude: the{" "}
          <strong>
            <InlineCode>#[note]</InlineCode>
          </strong>{" "}
          and{" "}
          <strong>
            <InlineCode>#[account]</InlineCode>
          </strong>{" "}
          macros, the basic field and word types (
          <strong>
            <InlineCode>Felt</InlineCode>
          </strong>
          ,{" "}
          <strong>
            <InlineCode>Word</InlineCode>
          </strong>
          ), and free functions such as{" "}
          <strong>
            <InlineCode>assert_eq</InlineCode>
          </strong>
          .
        </p>
        <p>
          <strong>Note Script Structure</strong>
        </p>
        <p>
          Note scripts use a struct-based pattern. The{" "}
          <strong>
            <InlineCode>#[note]</InlineCode>
          </strong>{" "}
          attribute on both the struct and the{" "}
          <strong>
            <InlineCode>impl</InlineCode>
          </strong>{" "}
          block marks this as a Miden note script:
        </p>
        <CodeBlock
          code={`#[account(counter_account::CounterContract)]
pub struct CounterAccount;

#[note]
struct CounterNote;

#[note]
impl CounterNote {
    #[note_script]
    fn run(self, _arg: Word, account: &mut CounterAccount) { ... }
}`}
        />
        <p>
          The{" "}
          <strong>
            <InlineCode>CounterNote</InlineCode>
          </strong>{" "}
          struct provides a named type for the note script. Unlike account
          contracts, note scripts don't store persistent data: the struct serves
          as the entry point container.
        </p>
        <p>
          The{" "}
          <strong>
            <InlineCode>CounterAccount</InlineCode>
          </strong>{" "}
          type is declared with{" "}
          <strong>
            <InlineCode>
              #[account(counter_account::CounterContract)]
            </InlineCode>
          </strong>
          , which binds it to the{" "}
          <strong>
            <InlineCode>CounterContract</InlineCode>
          </strong>{" "}
          interface of the <strong>counter-account</strong> script you added as
          a dependency. That's how the note script can call the counter
          contract's procedures on the Account that consumes the Note.
        </p>
        <p>
          Learn more about{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/note/">
            Notes
          </ExternalLink>{" "}
          in the Miden docs.
        </p>
        <p>
          <strong>The Note Script Function</strong>
        </p>
        <CodeBlock
          code={`#[note_script]
fn run(self, _arg: Word, account: &mut CounterAccount) {
    let initial_value = account.get_count();
    account.increment_count();
    let expected_value = initial_value + felt!(1);
    let final_value = account.get_count();
    assert_eq(final_value, expected_value);
}`}
        />
        <p>
          The{" "}
          <strong>
            <InlineCode>#[note_script]</InlineCode>
          </strong>{" "}
          attribute marks this method as the entry point of the note script,
          executed when the Note is consumed. The{" "}
          <strong>
            <InlineCode>self</InlineCode>
          </strong>{" "}
          parameter is required for methods in the{" "}
          <strong>
            <InlineCode>impl</InlineCode>
          </strong>{" "}
          block. The function:
        </p>
        <NumberedList>
          <li>
            <strong>Reads the initial counter value</strong> by calling{" "}
            <strong>
              <InlineCode>get_count</InlineCode>
            </strong>{" "}
            on the consuming account.
          </li>
          <li>
            <strong>
              Calls <InlineCode>increment_count</InlineCode>
            </strong>{" "}
            to increment the counter.
          </li>
          <li>
            <strong>Checks that the increment succeeded</strong> by asserting
            that the final value equals the initial value plus one.
          </li>
        </NumberedList>
        <p>
          If the assertion fails, the Transaction consuming the Note fails too.
        </p>
        <p>
          This example demonstrates a complete interaction pattern: the account
          contract manages persistent state, while the note script triggers
          state changes when the Note is consumed.
        </p>
        <p>
          Once you've read the note script code, click the <em>"Compile"</em>{" "}
          button to compile the script.
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
