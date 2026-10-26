import useScriptName from "@/components/tutorials/contract-verification/use-script-name";
import NextStepButton from "@/components/tutorials/next-step-button";
import {
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";
import type { TutorialStep } from "@/lib/types/tutorial";
import { storageSlotName } from "@/lib/utils/component";

const useScript = () => {
  const { scripts } = useScripts();
  const scriptName = useScriptName();
  return scripts.find(
    ({ name, type }) => name === scriptName && type === "account-component",
  );
};

const useCompleted = () => {
  const script = useScript();
  const procedureExports = script?.procedureExports ?? [];
  // The procedure digests depend on the script name, which is unique to each
  // run, so look for a `reset_count` export taking and returning nothing.
  const resetCountProcedure = procedureExports.find(
    ({ path, signature }) =>
      path.endsWith('::"reset-count"') &&
      signature.params.length === 0 &&
      signature.results.length === 0,
  );
  return script?.status === "compiled" && !!resetCountProcedure;
};

const Step2: TutorialStep = {
  title: "Add a procedure and compile the script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Let's extend the counter contract with a new procedure that resets the
          counter value to zero. Add the following{" "}
          <strong>
            <InlineCode>reset_count</InlineCode>
          </strong>{" "}
          method inside the{" "}
          <strong>
            <InlineCode>
              impl CounterContract for CounterContractStorage
            </InlineCode>
          </strong>{" "}
          block, after{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>
          :
        </p>
        <CodeBlock
          code={`/// Resets the counter value to zero
fn reset_count(&mut self) {
    let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);
    self.count_map.set(key, felt!(0));
}`}
        />
        <p>
          Then declare its signature in the{" "}
          <strong>
            <InlineCode>CounterContract</InlineCode>
          </strong>{" "}
          trait, marked with{" "}
          <strong>
            <InlineCode>#[account_procedure]</InlineCode>
          </strong>{" "}
          so that it's exported:
        </p>
        <CodeBlock
          code={`#[component]
trait CounterContract {
    // ...
    #[account_procedure]
    fn reset_count(&mut self);
}`}
        />
        <p>
          When you develop a smart contract, you write human-readable Rust code,
          and a compiler turns it into{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#miden-assembly">
            Miden Assembly (MASM)
          </ExternalLink>{" "}
          code that the{" "}
          <ExternalLink href="https://docs.miden.xyz/design/miden-vm/">
            Miden VM
          </ExternalLink>{" "}
          can execute.
        </p>
        <p>
          Click the <em>"Compile"</em> button to see this process in action. The
          result of the compilation is a Miden package (a{" "}
          <strong>
            <InlineCode>.masp</InlineCode>
          </strong>{" "}
          file), which contains both the compiled code and a manifest describing
          what the package exports.
        </p>
        <p>
          Click the <em>"Metadata"</em> tab: under <em>"Package exports"</em>,
          you'll find the procedures exported by the package, along with their
          signatures.
        </p>
        <p>
          Only the compiled code is stored on-chain, and each procedure is
          identified by its{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
            MAST root
          </ExternalLink>
          , a hash of its code, rather than by its name. The link with the
          original Rust source code is lost, and so are the procedure
          signatures, which you need to call the procedures with the right
          arguments.
        </p>
        <p>
          Contract verification bridges this gap: it links the on-chain code
          back to its Rust source code and package manifest, so that anyone can
          read the source code and know how to call the exported procedures.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Add the reset_count procedure and compile."
          titleWhenCompleted="You compiled the script."
          description={
            <p>
              Add the <strong>reset_count</strong> procedure to the{" "}
              <strong>CounterContract</strong> trait and its implementation,
              then click the <em>"Compile"</em> button.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    const script = useScript();
    const { components, newComponent } = useComponents();
    const { nextTutorialStep } = useTutorials();
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
