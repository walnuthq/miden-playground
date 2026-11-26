import MissingScriptsAlert from "@/components/tutorials/network-transactions/missing-scripts-alert";
import useNetworkCounter from "@/components/tutorials/network-transactions/use-network-counter";
import { CodeBlock, InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

// The lines quoted here are
// apps/api/examples/counter-contract/increment-note/increment_note.masm's, the
// source of the increment-note script the tutorial starts with: after editing
// it, check them.
const Step3: TutorialStep = {
  title: "Understand the increment note script.",
  Content: () => {
    const { noteScript, counterScript } = useNetworkCounter();
    return (
      <>
        <MissingScriptsAlert />
        <p>
          Now that your network counter is registered on testnet, you'll create
          a public Note that the network transaction builder consumes to
          increment it, from <strong>0</strong> to <strong>1</strong>.
        </p>
        <p>
          Take some time to read the{" "}
          <TutorialLink
            href={noteScript ? `/scripts/${noteScript.id}` : "/scripts"}
          >
            increment-note script
          </TutorialLink>
          , its source file{" "}
          <strong>
            <InlineCode>increment_note.masm</InlineCode>
          </strong>
          . It starts by naming the module its procedures come from:
        </p>
        <CodeBlock code="use counter_account" />
        <p>
          <InlineCode>counter_account</InlineCode> is the{" "}
          <TutorialLink
            href={counterScript ? `/scripts/${counterScript.id}` : "/scripts"}
          >
            counter-account
          </TutorialLink>{" "}
          script, your network counter's account component, which the note
          script depends on. Its procedures aren't part of the Note: they belong
          to the consuming Account, here your network counter.
        </p>
        <p>
          The{" "}
          <strong>
            <InlineCode>main</InlineCode>
          </strong>{" "}
          procedure, marked{" "}
          <strong>
            <InlineCode>@note_script</InlineCode>
          </strong>
          , is the note script itself: it runs when an Account consumes the
          Note. It first reads the count:
        </p>
        <CodeBlock
          code={`call.counter_account::get_count
add.1 loc_store.0`}
        />
        <p>
          <InlineCode>call</InlineCode> runs one of the Account's procedures on
          the top 16 elements of the stack and puts its 16 outputs in their
          place: <InlineCode>get_count</InlineCode> leaves the count on top.{" "}
          <InlineCode>add.1</InlineCode> adds one to it, the count expected
          after the increment, and <InlineCode>loc_store.0</InlineCode> moves
          that value to the procedure's local memory:{" "}
          <InlineCode>@locals(1)</InlineCode> above the procedure reserves one
          slot for it.
        </p>
        <CodeBlock
          code={`call.counter_account::increment_count
drop call.counter_account::get_count
loc_load.0 assert_eq.err=ERR_COUNT_NOT_INCREMENTED`}
        />
        <p>
          It then calls <InlineCode>increment_count</InlineCode>, drops the new
          count that procedure returns and reads the count again with{" "}
          <InlineCode>get_count</InlineCode>.{" "}
          <InlineCode>loc_load.0</InlineCode> pushes the expected count back,
          and <InlineCode>assert_eq</InlineCode> checks that the two top values
          are equal.
        </p>
        <p>
          If the contract didn't implement the increment logic correctly, the
          assertion would fail, and so would the Transaction consuming the Note.
          The error would show as an error code, not as the{" "}
          <InlineCode>ERR_COUNT_NOT_INCREMENTED</InlineCode> message.
        </p>
        <p>
          A network note is a public Note that carries an attachment identifying
          its target network account. Once the network transaction builder picks
          it up, it executes a Transaction against the target account that
          consumes the Note.
        </p>
      </>
    );
  },
};

export default Step3;
