import useCounter from "@/components/tutorials/deploy-a-counter-contract/use-counter";
import {
  BulletList,
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

// No action: the compile of step 2 kept the template's storage schema. Quotes
// the slot constant of apps/api/templates/counter-account.masm, which the
// tutorial's edit (`add.1`) leaves alone.
const Step3: TutorialStep = {
  title: "Meet the contract's storage layout.",
  Content: () => {
    const { script } = useCounter();
    return (
      <>
        <p>
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
            Account components
          </ExternalLink>{" "}
          are reusable building blocks that define part of an Account's{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
            code
          </ExternalLink>{" "}
          and{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage">
            storage
          </ExternalLink>
          . Several account components are combined to build an Account. For
          example, a wallet account is built from a{" "}
          <strong>Basic Wallet</strong> component, whose code moves assets in
          and out of the account vault, and a <strong>Single Sig</strong>{" "}
          authentication component, which stores the user's public key and
          verifies signatures against it. Your counter contract will be built
          from the script you just compiled and an authentication component.
        </p>
        <p>An account component is made of two parts:</p>
        <BulletList>
          <li>
            Its <strong>code</strong>: a library of procedures that can read and
            write the component's storage.
          </li>
          <li>
            Its <strong>storage layout</strong>: the list of storage slots the
            component uses, each with a type and an optional default value.
          </li>
        </BulletList>
        <p>
          The package you compiled holds the code: its two procedures. It
          doesn't describe the storage they use, so the Playground keeps that
          description for scripts created from the{" "}
          <strong>Counter Contract</strong> example: one slot of type{" "}
          <strong>Map</strong>, whose keys are Words and whose values are Felts,
          where the contract keeps its counter under the key{" "}
          <strong>
            <InlineCode>[1, 0, 0, 0]</InlineCode>
          </strong>
          .
        </p>
        <p>
          A storage slot is identified by its name, the string your source
          declares it with:
        </p>
        <CodeBlock
          code={`const COUNT_MAP_SLOT = word("counter_account::count_map")`}
        />
        <p>
          By convention, a slot's name has two parts separated by{" "}
          <strong>
            <InlineCode>::</InlineCode>
          </strong>
          : a namespace, here{" "}
          <strong>
            <InlineCode>counter_account</InlineCode>
          </strong>
          , and the slot's own name,{" "}
          <strong>
            <InlineCode>count_map</InlineCode>
          </strong>
          . An Account can't hold two slots of the same name, so the namespace
          keeps the slots of its components apart. The name is written in the
          source: it doesn't change with your script's name.
        </p>
        <p>
          The Playground keeps its description of the storage as long as your
          source declares the same slot names. If you rename a slot, it can no
          longer tell what the slot holds, and the deploy form has you add the
          slots yourself, by name, with their values.
        </p>
        <p>
          You can see the slot in the <em>"Simulate"</em> tab of the console
          under the{" "}
          {script ? (
            <TutorialLink href={`/scripts/${script.id}`}>
              script's code
            </TutorialLink>
          ) : (
            "script's code"
          )}
          , which lists the storage slots of the compiled script and lets you
          try its procedures locally before deploying anything.
        </p>
      </>
    );
  },
};

export default Step3;
