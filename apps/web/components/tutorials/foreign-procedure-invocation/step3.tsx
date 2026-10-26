import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step3: TutorialStep = {
  title: "Understand the Count Reader Rust code.",
  Content: () => (
    <>
      <p>
        The <strong>count-reader</strong> script contains the Rust source code
        of the <strong>Count Reader</strong> contract. Like the counter
        contracts from the previous tutorials, it's an{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
          account component
        </ExternalLink>{" "}
        with its own storage layout and procedures.
      </p>
      <p>
        Let's focus on lines <em>15-19</em>, where its storage layout is
        defined. The copied count is kept in a single{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#value-slots">
          value slot
        </ExternalLink>{" "}
        named{" "}
        <strong>
          <InlineCode>count</InlineCode>
        </strong>
        , which holds it as a{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
          Felt
        </ExternalLink>{" "}
        (field element).
      </p>
      <p>
        At lines <em>12-13</em>,{" "}
        <strong>
          <InlineCode>CounterAccount</InlineCode>
        </strong>{" "}
        is declared as an Account that implements the{" "}
        <strong>
          <InlineCode>CounterContract</InlineCode>
        </strong>{" "}
        interface of the{" "}
        <TutorialLink href="/scripts/counter-account">
          counter-account script
        </TutorialLink>
        . This script contains the code of the counter contract you'll copy the
        count from, which keeps its count in a map slot, like the one you
        deployed in the <em>"Deploy a counter contract"</em> tutorial. This
        declaration lets the <strong>Count Reader</strong> call the counter
        contract's procedures.
      </p>
      <p>
        Finally, the{" "}
        <strong>
          <InlineCode>copy_count</InlineCode>
        </strong>{" "}
        procedure, at lines <em>29-32</em>, takes a single argument: the ID of
        the counter contract to copy the count from. It calls the{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        procedure of this Account through FPI, then writes the returned value to
        its{" "}
        <strong>
          <InlineCode>count</InlineCode>
        </strong>{" "}
        slot in{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#accountstorage">
          account storage
        </ExternalLink>
        .
      </p>
      <p>
        The counter contract is a public account, so the Playground can fetch
        its state from the network and provide it to the Transaction executing{" "}
        <strong>
          <InlineCode>copy_count</InlineCode>
        </strong>
        , which runs{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        against it. To learn more, read the{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/transaction#foreign-procedure-invocation-fpi-and-expiration">
          foreign procedure invocation
        </ExternalLink>{" "}
        section of the Miden docs.
      </p>
    </>
  ),
};

export default Step3;
