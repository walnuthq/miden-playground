import ApplyCodeButton from "@/components/tutorials/apply-code-button";
import useCounter from "@/components/tutorials/deploy-a-counter-contract/use-counter";
import NextStepButton from "@/components/tutorials/next-step-button";
import {
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";
import { scriptSource } from "@/lib/utils/script-files";
import {
  INCREMENT,
  increaseIncrementEdits,
  incrementValue,
} from "@/lib/utils/tutorial-code";

// An edit after the compile turns the script back into a draft, so the
// compiled package is the one of the source checked here.
const useCompleted = () => {
  const { script } = useCounter();
  return (
    script?.status === "compiled" && incrementValue(scriptSource(script)) > 1
  );
};

// The lines quoted here are apps/api/templates/counter-account.masm's, the
// source the script is created from: after editing the template, check them.
// The edit changes a constant, not a slot name, so the script keeps the
// template's storage schema and step 4's typed deploy form.
const Step2: TutorialStep = {
  title: "Customize and compile the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    const { script } = useCounter();
    return (
      <>
        <p>
          The script you created holds the{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#miden-assembly">
            Miden Assembly
          </ExternalLink>{" "}
          (MASM) source of a counter contract, the same code as the contract you
          interacted with in the previous tutorial. Here's how it works.
        </p>
        <p>
          Its storage is declared under the <em>STORAGE</em> comment:
        </p>
        <CodeBlock
          code={`const COUNT_MAP_SLOT = word("counter_account::count_map")
const COUNT_KEY = [1, 0, 0, 0]`}
        />
        <p>
          The counter is kept in a single{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#map-slots">
            map slot
          </ExternalLink>{" "}
          named{" "}
          <strong>
            <InlineCode>counter_account::count_map</InlineCode>
          </strong>
          . A map slot holds a <strong>StorageMap</strong>, a key-value store
          whose keys are{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#word">
            Words
          </ExternalLink>
          , four field elements. The count is a single{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
            Felt
          </ExternalLink>{" "}
          (field element) stored under the fixed key{" "}
          <strong>
            <InlineCode>COUNT_KEY</InlineCode>
          </strong>
          .
        </p>
        <p>
          The Miden VM is a stack machine: each instruction takes its inputs
          from the top of the stack and leaves its outputs there. The{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          procedure pushes the key, then the slot's id on top of it: the
          procedures don't use the slot's name but its id, the first two felts
          of the Word the name hashes to,{" "}
          <InlineCode>COUNT_MAP_SLOT[0..2]</InlineCode>. Then{" "}
          <InlineCode>active_account::get_map_item</InlineCode> replaces them
          with the Word stored under that key in the contract's{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#accountstorage">
            account storage
          </ExternalLink>
          : the count, then three zeros.
        </p>
        <p>
          The{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedure reads the count the same way, then:
        </p>
        <CodeBlock
          code={`add.1
dupw
push.COUNT_KEY push.COUNT_MAP_SLOT[0..2]
exec.native_account::set_map_item
dropw`}
        />
        <p>
          <InlineCode>add.1</InlineCode> adds one to the count on top of the
          stack, and <InlineCode>dupw</InlineCode> copies the Word it sits in,
          to return the new count at the end.{" "}
          <InlineCode>native_account::set_map_item</InlineCode> writes the new
          value under the key and leaves the old one, which{" "}
          <InlineCode>dropw</InlineCode> drops.
        </p>
        <p>
          To make this contract your own, change the increment in{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          from{" "}
          <strong>
            <InlineCode>add.1</InlineCode>
          </strong>{" "}
          to a greater number, for example{" "}
          <strong>
            <InlineCode>add.{INCREMENT}</InlineCode>
          </strong>
          . Leave the slot's name as it is: the next steps rely on it.
        </p>
        <div className="flex justify-end">
          <ApplyCodeButton
            script={script}
            edits={increaseIncrementEdits}
            label={`Change it to add.${INCREMENT} for me`}
            appliedLabel="Increment value changed"
          />
        </div>
        <p>
          Then click the <em>"Compile"</em> button above the editor. The
          Playground sends your source to the Miden assembler, which assembles
          it into a <strong>package</strong>, the form in which your contract is
          deployed. The console under the editor reports the result.
        </p>
        <p>
          If the assembler reports an error instead, the console shows it and
          the editor underlines the faulty code: click the error's location in
          the console to jump to it, fix the code and compile again.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Change the increment value and compile the script."
          titleWhenCompleted="You compiled your counter contract script."
          description={
            <p>
              In <strong>increment_count</strong>, change <strong>add.1</strong>{" "}
              to add a number greater than <strong>1</strong> (or use the button
              above), then click the <em>"Compile"</em> button above the editor
              to compile your script.
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
