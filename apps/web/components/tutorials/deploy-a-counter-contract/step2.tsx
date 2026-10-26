import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      id.startsWith("counter-account_") && type === "account-component",
  );
  const matches = script?.rust.matchAll(/felt!\((\d*)\)/g);
  const lastMatch = Array.from(matches ?? []).at(-1);
  const incrementValue = Number(lastMatch?.at(1));
  return script?.masm !== "" && incrementValue > 1;
};

const Step2: TutorialStep = {
  title: "Customize and compile the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          The script you created contains the Rust source code of a counter
          contract. Unlike the contract from the previous tutorial, which kept
          its counter in a value slot, this one stores it in a{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#map-slots">
            map slot
          </ExternalLink>
          .
        </p>
        <p>
          Let's focus on lines <em>13-18</em>, where its storage layout is
          defined. The counter is kept in a single map slot named{" "}
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
          procedure, at lines <em>33-36</em>, builds this fixed key, a Word
          whose first element is{" "}
          <strong>
            <InlineCode>1</InlineCode>
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
          procedure, at lines <em>38-44</em>, reads the current value the same
          way, adds one to it, writes the new value back under the same key and
          returns it.
        </p>
        <p>
          To make this contract your own, change the increment value at line{" "}
          <em>41</em> from{" "}
          <strong>
            <InlineCode>1</InlineCode>
          </strong>{" "}
          to a greater number, for example{" "}
          <strong>
            <InlineCode>felt!(5)</InlineCode>
          </strong>
          . Then compile the script to{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#miden-assembly">
            Miden Assembly
          </ExternalLink>{" "}
          (MASM): once it's compiled, the <em>"MASM"</em> tab shows your new
          increment value in the{" "}
          <strong>
            <InlineCode>add</InlineCode>
          </strong>{" "}
          instruction of{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>
          .
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Change the increment value and compile the script."
          titleWhenCompleted="You compiled your counter contract script."
          description={
            <p>
              Change the increment value to a number greater than{" "}
              <strong>1</strong>, then click the <em>"Compile"</em> button in
              the editor console to compile your script.
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
