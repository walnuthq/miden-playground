import NextStepButton from "@/components/tutorials/next-step-button";
import {
  BulletList,
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";
import { storageSlotName } from "@/lib/utils/component";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  return script?.status === "compiled";
};

const Step2: TutorialStep = {
  title: "Understand and compile the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          The script you created contains the Rust source code of the counter
          contract, the same one you deployed in the{" "}
          <em>"Deploy a counter contract"</em> tutorial. Let's take a closer
          look at how it's structured.
        </p>
        <p>
          <strong>No-std Environment</strong>
        </p>
        <CodeBlock code={`#![no_std]`} />
        <p>
          Miden contracts run in a{" "}
          <strong>
            <InlineCode>no_std</InlineCode>
          </strong>{" "}
          environment, meaning they don't link against Rust's standard library.
          This is essential for blockchain execution, where contracts need to be
          deterministic and lightweight.
        </p>
        <p>
          <strong>Miden Library Imports</strong>
        </p>
        <CodeBlock
          code={`use miden::{component, component_storage, felt, Felt, StorageMap, Word};`}
        />
        <p>These imports provide:</p>
        <BulletList>
          <li>
            <strong>
              <InlineCode>component</InlineCode>
            </strong>
            : macro for defining contract components
          </li>
          <li>
            <strong>
              <InlineCode>component_storage</InlineCode>
            </strong>
            : macro for defining a component's storage struct
          </li>
          <li>
            <strong>
              <InlineCode>felt</InlineCode>
            </strong>
            : macro for creating{" "}
            <strong>
              <InlineCode>Felt</InlineCode>
            </strong>{" "}
            literals (e.g.,{" "}
            <strong>
              <InlineCode>felt!(1)</InlineCode>
            </strong>
            )
          </li>
          <li>
            <strong>
              <InlineCode>Felt</InlineCode>
            </strong>
            /
            <strong>
              <InlineCode>Word</InlineCode>
            </strong>
            : Miden's native field element and word types
          </li>
          <li>
            <strong>
              <InlineCode>StorageMap</InlineCode>
            </strong>
            : key-value storage within an account storage slot
          </li>
        </BulletList>
        <p>
          <strong>Contract Structure Definition</strong>
        </p>
        <CodeBlock
          code={`#[component_storage]
struct CounterContractStorage {
    /// Storage map holding the counter value.
    #[storage(description = "counter contract storage map")]
    count_map: StorageMap<Word, Felt>,
}

#[component]
trait CounterContract {
    #[account_procedure]
    fn get_count(&self) -> Felt;
    #[account_procedure]
    fn increment_count(&mut self) -> Felt;
}`}
        />
        <p>
          The{" "}
          <strong>
            <InlineCode>#[component_storage]</InlineCode>
          </strong>{" "}
          attribute marks the storage struct of this{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
            account component
          </ExternalLink>
          , while the{" "}
          <strong>
            <InlineCode>#[component]</InlineCode>
          </strong>{" "}
          trait defines the component's interface. Every procedure that other
          contracts and notes can call must be marked with{" "}
          <strong>
            <InlineCode>#[account_procedure]</InlineCode>
          </strong>
          : an unmarked method isn't exported.
        </p>
        <p>
          The{" "}
          <strong>
            <InlineCode>count_map</InlineCode>
          </strong>{" "}
          field is a{" "}
          <strong>
            <InlineCode>StorageMap</InlineCode>
          </strong>{" "}
          stored in a named slot of the account storage. Storage slots are
          identified by name rather than by index: the slot name is derived from
          the script name, the trait name and the field name, here{" "}
          <strong>
            <InlineCode>
              counter_account::counter_contract::count_map
            </InlineCode>
          </strong>
          . That's why your script must be named{" "}
          <strong>counter-account</strong>.
        </p>
        <p>
          <strong>Important</strong>:{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage">
            account storage
          </ExternalLink>{" "}
          is organized into named slots, each holding either a single value or a
          key-value map. Here,{" "}
          <strong>
            <InlineCode>
              StorageMap{"<"}Word, Felt{">"}
            </InlineCode>
          </strong>{" "}
          provides typed access to a map slot, converting its keys and values to
          and from{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#word">
            Words
          </ExternalLink>
          . A Word is made of four field elements (
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
            Felts
          </ExternalLink>
          ), and each Felt belongs to the Goldilocks prime field and is
          represented using 64 bits.
        </p>
        <p>
          <strong>Contract Implementation</strong>
        </p>
        <CodeBlock
          code={`impl CounterContract for CounterContractStorage {
    // Function implementations...
}`}
        />
        <p>
          The{" "}
          <strong>
            <InlineCode>CounterContract</InlineCode>
          </strong>{" "}
          trait defines the external interface that other contracts and notes
          can call. The{" "}
          <strong>
            <InlineCode>
              impl CounterContract for CounterContractStorage
            </InlineCode>
          </strong>{" "}
          block provides the behavior over the component's storage.
        </p>
        <p>
          <strong>Storage Key Strategy</strong>
        </p>
        <CodeBlock
          code={`let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);`}
        />
        <p>
          Both procedures of the counter contract use the same fixed key,{" "}
          <strong>
            <InlineCode>[1, 0, 0, 0]</InlineCode>
          </strong>
          , to store and retrieve the counter value within the storage map. This
          demonstrates a simple but effective storage pattern.
        </p>
        <p>
          Once you've read the contract code, click the <em>"Compile"</em>{" "}
          button to compile the script.
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
    const { scripts } = useScripts();
    const { components, newComponent } = useComponents();
    const { nextTutorialStep } = useTutorials();
    const script = scripts.find(
      ({ id, type }) =>
        !defaultScriptIds.includes(id) && type === "account-component",
    );
    const component = components.find(
      ({ scriptId }) => scriptId === script?.id,
    );
    return (
      <NextStepButton
        disabled={!completed}
        onClick={() => {
          if (!component) {
            newComponent({
              name: "Counter Contract",
              type: "account-component",
              scriptId: script?.id ?? "",
              storageSlots: [
                {
                  name: storageSlotName({
                    packageName: script?.name ?? "",
                    traitName: "CounterContract",
                    fieldName: "count_map",
                  }),
                  type: "map",
                  value: "1:0",
                },
              ],
            });
          }
          nextTutorialStep();
        }}
      />
    );
  },
};

export default Step2;
