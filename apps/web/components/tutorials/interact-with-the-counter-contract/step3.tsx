import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step3: TutorialStep = {
  title: "Explore the compiled package.",
  Content: () => (
    <>
      <p>
        In the previous step, you read the <strong>Rust</strong> source code of
        the counter contract. The <em>"Manifest"</em> tab describes what it
        compiles to: a <strong>package</strong>, the unit of code that gets
        deployed on-chain as an{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
          account component
        </ExternalLink>
        .
      </p>
      <p>
        Under <em>"Package metadata"</em>, the <strong>Commitment</strong> is a
        hash of the whole package, which identifies this exact build of the
        code.
      </p>
      <p>
        Under <em>"Package exports"</em>, each{" "}
        <strong>
          <InlineCode>#[account_procedure]</InlineCode>
        </strong>{" "}
        of the Rust code appears with its signature:{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        and{" "}
        <strong>
          <InlineCode>increment_count</InlineCode>
        </strong>{" "}
        both take no argument and return a <strong>Felt</strong>. The copy
        button next to a name copies the procedure's <strong>digest</strong>,
        the hash of its{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#miden-assembly">
          Miden Assembly
        </ExternalLink>{" "}
        (MASM) code. An Account's code is a set of such procedures, called by
        their digests: when you import the counter contract in the next step,
        the Playground finds these two digests in its code and recognizes the
        component.
      </p>
      <p>
        The compiler also analyzes what each procedure does to the account:{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        is marked <em>"Read-only"</em> because it only reads storage, while{" "}
        <strong>
          <InlineCode>increment_count</InlineCode>
        </strong>{" "}
        writes to it. You'll see the difference when you invoke them: the
        Playground runs a read-only procedure locally, and submits a Transaction
        for the others.
      </p>
      <p>
        The Playground ships this package already compiled, so its{" "}
        <em>"MASM"</em> tab is disabled: for the scripts you compile yourself in
        the next tutorials, it shows the compiler's MASM output.
      </p>
    </>
  ),
};

export default Step3;
