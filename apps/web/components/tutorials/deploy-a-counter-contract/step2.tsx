import ApplyCodeButton from "@/components/tutorials/apply-code-button";
import useCounter from "@/components/tutorials/deploy-a-counter-contract/use-counter";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
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

// Line numbers refer to apps/api/templates/counter-account.rs, the source the
// script is created from.
const Step2: TutorialStep = {
  title: "Customize and compile the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    const { script } = useCounter();
    return (
      <>
        <p>
          The script you created contains the Rust source code of a counter
          contract, the same code as the contract you interacted with in the
          previous tutorial. Here's how it works.
        </p>
        <p>
          Lines <em>13-18</em> define its storage layout. The counter is kept in
          a single{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#map-slots">
            map slot
          </ExternalLink>{" "}
          named{" "}
          <strong>
            <InlineCode>count_map</InlineCode>
          </strong>
          . A map slot holds a <strong>StorageMap</strong>, a key-value store
          whose keys are{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#word">
            Words
          </ExternalLink>
          . Here, the counter is stored as a{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
            Felt
          </ExternalLink>{" "}
          (field element) under a fixed key.
        </p>
        <p>
          The{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          procedure, at lines <em>33-38</em>, builds this fixed key, the Word{" "}
          <strong>
            <InlineCode>[1, 0, 0, 0]</InlineCode>
          </strong>
          , then reads the value stored under it in the contract's{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#accountstorage">
            account storage
          </ExternalLink>{" "}
          and returns it.
        </p>
        <p>
          Finally, the{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedure, at lines <em>40-50</em>, reads the current value the same
          way, adds one to it, writes the new value back under the same key and
          returns it.
        </p>
        <p>
          To make this contract your own, change the increment value at line{" "}
          <em>46</em> from{" "}
          <strong>
            <InlineCode>felt!(1)</InlineCode>
          </strong>{" "}
          to a greater number, for example{" "}
          <strong>
            <InlineCode>felt!({INCREMENT})</InlineCode>
          </strong>
          .
        </p>
        <div className="flex justify-end">
          <ApplyCodeButton
            script={script}
            edits={increaseIncrementEdits}
            label={`Change it to felt!(${INCREMENT}) for me`}
            appliedLabel="Increment value changed"
          />
        </div>
        <p>
          Then click the <em>"Compile"</em> button above the editor. The
          Playground sends your code to the Miden compiler, which turns the Rust
          into{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#miden-assembly">
            Miden Assembly
          </ExternalLink>{" "}
          (MASM) and bundles it into a package, the form in which your contract
          is deployed. The console under the editor reports the result.
        </p>
        <p>
          If the compiler reports an error instead, the console shows it and the
          editor underlines the faulty code: click the error's location in the
          console to jump to it, fix the code and compile again.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Change the increment value and compile the script."
          titleWhenCompleted="You compiled your counter contract script."
          description={
            <p>
              Change the increment value to a number greater than{" "}
              <strong>1</strong> (or use the button above), then click the{" "}
              <em>"Compile"</em> button above the editor to compile your script.
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
