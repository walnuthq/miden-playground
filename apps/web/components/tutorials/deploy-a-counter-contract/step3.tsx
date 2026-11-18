import useCounter from "@/components/tutorials/deploy-a-counter-contract/use-counter";
import {
  BulletList,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

// No action: the compile of step 2 gave the script its storage layout. Cites
// lines 13-18 of apps/api/templates/counter-account.rs (the storage struct),
// which the tutorial's edit (line 46) doesn't move. The slot name is as long
// as the user's script name and has no place to break: `wrap-anywhere` keeps
// it inside the panel.
const Step3: TutorialStep = {
  title: "Meet the contract's storage layout.",
  Content: () => {
    const { script, slotName } = useCounter();
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
          Your compiled script holds both. The compiler derives the storage
          layout from the struct marked{" "}
          <strong>
            <InlineCode>#[component_storage]</InlineCode>
          </strong>{" "}
          at lines <em>13-18</em>: its{" "}
          <strong>
            <InlineCode>count_map</InlineCode>
          </strong>{" "}
          field becomes a storage slot of type <strong>Map</strong>, where the
          contract keeps its counter under the fixed key <strong>1</strong>.
        </p>
        <p>
          Storage slots are identified by their name, which the compiler derives
          from your code in three parts, separated by{" "}
          <strong>
            <InlineCode>::</InlineCode>
          </strong>
          :
        </p>
        <BulletList>
          <li>
            the name of your script, <strong>{script?.name}</strong>, where any
            character other than a letter, a digit or an underscore becomes an
            underscore;
          </li>
          <li>
            the name of the component's trait,{" "}
            <strong>
              <InlineCode>CounterContract</InlineCode>
            </strong>
            , in snake case;
          </li>
          <li>
            the name of the field in the storage struct,{" "}
            <strong>
              <InlineCode>count_map</InlineCode>
            </strong>
            .
          </li>
        </BulletList>
        <p>
          So your counter lives in the slot{" "}
          <strong className="wrap-anywhere">
            <InlineCode>{slotName}</InlineCode>
          </strong>
          . You can see it in the <em>"Simulate"</em> tab of the console under
          the{" "}
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
