import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

// Line numbers refer to apps/api/templates/counter-account.rs, which the
// embedded script's source reproduces verbatim (lib/tutorials/counter-account.ts).
const Step2: TutorialStep = {
  title: "Understand the counter contract Rust code.",
  Content: () => (
    <>
      <p>
        Let's focus on lines <em>13-18</em> of the counter contract's Rust
        source code, where its storage layout is defined. The counter is kept in
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
        Both procedures are marked{" "}
        <strong>
          <InlineCode>#[account_procedure]</InlineCode>
        </strong>
        : they are exported by the compiled package, so transaction scripts and
        Notes can call them on the deployed contract. The next step looks at
        that package. To follow along, click the <em>"Manifest"</em> tab above
        the editor.
      </p>
    </>
  ),
};

export default Step2;
