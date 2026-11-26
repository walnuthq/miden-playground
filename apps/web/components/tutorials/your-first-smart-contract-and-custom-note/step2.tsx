import NextStepButton from "@/components/tutorials/next-step-button";
import {
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  return script?.status === "compiled";
};

// The lines quoted here are apps/api/templates/counter-account.masm's, the
// source the script is created from: after editing the template, check them.
const Step2: TutorialStep = {
  title: "Understand and compile the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          The script you created holds the source file{" "}
          <strong>
            <InlineCode>counter_account.masm</InlineCode>
          </strong>
          , the Miden Assembly code of the counter contract you started from in
          the <em>"Deploy a counter contract"</em> tutorial. Let's take a closer
          look at how it's structured.
        </p>
        <p>
          <strong>Imports</strong>
        </p>
        <CodeBlock
          code={`use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::sys`}
        />
        <p>
          Each <InlineCode>use</InlineCode> line imports a module of Miden's
          libraries, whose procedures the contract then calls by the module's
          last name:{" "}
          <strong>
            <InlineCode>active_account</InlineCode>
          </strong>{" "}
          reads the storage of the Account the code runs on,{" "}
          <strong>
            <InlineCode>native_account</InlineCode>
          </strong>{" "}
          writes it, and{" "}
          <strong>
            <InlineCode>sys</InlineCode>
          </strong>{" "}
          has helpers for the stack.
        </p>
        <p>
          <strong>Storage</strong>
        </p>
        <CodeBlock
          code={`const COUNT_MAP_SLOT = word("counter_account::count_map")
const COUNT_KEY = [1, 0, 0, 0]`}
        />
        <p>
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage">
            Account storage
          </ExternalLink>{" "}
          is organized into named slots, each holding either a single value or a
          key-value map. The counter is kept in a single map slot named{" "}
          <strong>
            <InlineCode>counter_account::count_map</InlineCode>
          </strong>
          , under the fixed key{" "}
          <strong>
            <InlineCode>[1, 0, 0, 0]</InlineCode>
          </strong>
          . A map's keys and values are{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#word">
            Words
          </ExternalLink>
          : a Word is made of four field elements (
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
            Felts
          </ExternalLink>
          ), and each Felt belongs to the Goldilocks prime field and is
          represented using 64 bits. The count is the first Felt of its value.
        </p>
        <p>
          The procedures don't use the slot's name but its id: the first two
          Felts of the Word the name hashes to,{" "}
          <InlineCode>COUNT_MAP_SLOT[0..2]</InlineCode>.
        </p>
        <p>
          <strong>Account Procedures</strong>
        </p>
        <CodeBlock
          code={`@account_procedure
pub proc get_count() -> felt
    push.COUNT_KEY push.COUNT_MAP_SLOT[0..2]
    exec.active_account::get_map_item
    exec.sys::truncate_stack
end`}
        />
        <p>
          This is the{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          procedure, without its comments. <InlineCode>pub</InlineCode> exports
          it from the module, and the{" "}
          <strong>
            <InlineCode>@account_procedure</InlineCode>
          </strong>{" "}
          attribute makes it part of the{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
            account component
          </ExternalLink>
          's interface: notes and transaction scripts can call it on an Account
          built with this component. <InlineCode>-{">"} felt</InlineCode>{" "}
          declares that it returns one Felt, the count.
        </p>
        <p>
          The Miden VM is a stack machine: each instruction takes its inputs
          from the top of the stack and leaves its outputs there. The procedure
          pushes the key, then the slot's id on top of it, and{" "}
          <InlineCode>active_account::get_map_item</InlineCode> replaces them
          with the Word stored under that key: the count, then three zeros.
        </p>
        <p>
          A procedure that a note calls gets the top 16 elements of the stack as
          its inputs, and must leave exactly 16 elements as its outputs. The doc
          comment above it says so,{" "}
          <InlineCode>Outputs: [count, pad(15)]</InlineCode>: the count, then 15
          padding elements. <InlineCode>sys::truncate_stack</InlineCode> drops
          what's left over below them.
        </p>
        <CodeBlock
          code={`@account_procedure
pub proc increment_count() -> felt`}
        />
        <p>
          The{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedure reads the count the same way, adds one to it with{" "}
          <InlineCode>add.1</InlineCode>, writes the new count under the same
          key with <InlineCode>native_account::set_map_item</InlineCode>, and
          returns it.
        </p>
        <p>
          Once you've read the contract code, click the <em>"Compile"</em>{" "}
          button to compile the script: the Miden assembler turns it into a{" "}
          <strong>package</strong> that holds the code of both procedures.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Compile the counter contract script."
          titleWhenCompleted="You compiled the counter contract script."
          description={
            <p>
              Once you've read the counter contract code, click the{" "}
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

export default Step2;
