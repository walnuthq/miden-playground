import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step2: TutorialStep = {
  title: "Understand the counter contract Rust code.",
  Content: () => (
    <>
      <p>
        Let's focus on lines <em>13-18</em> of the counter contract's Rust
        source code, where its storage layout is defined. The counter is kept in
        a single{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#value-slots">
          value slot
        </ExternalLink>{" "}
        named{" "}
        <strong>
          <InlineCode>count</InlineCode>
        </strong>
        . A value slot stores a single{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#word">
          Word
        </ExternalLink>{" "}
        of data, and here it holds the counter as a{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
          Felt
        </ExternalLink>{" "}
        (field element).
      </p>
      <p>
        The{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        procedure, at lines <em>33-36</em>, reads the value of the{" "}
        <strong>
          <InlineCode>count</InlineCode>
        </strong>{" "}
        slot from the contract's{" "}
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
        procedure, at lines <em>39-47</em>, reads the current value the same
        way, adds one to it, writes the new value back to the{" "}
        <strong>
          <InlineCode>count</InlineCode>
        </strong>{" "}
        slot and returns it.
      </p>
      <p>
        The next step walks through the same procedures written in{" "}
        <strong>MASM</strong>, the assembly language of the Miden VM. To follow
        along, click the <em>"MASM"</em> tab. If you're not interested in these
        low-level details, feel free to skip it.
      </p>
    </>
  ),
};

export default Step2;
