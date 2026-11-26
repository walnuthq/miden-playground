import ApplyCodeButton from "@/components/tutorials/apply-code-button";
import useScriptName, {
  useRunTag,
} from "@/components/tutorials/contract-verification/use-script-name";
import NextStepButton from "@/components/tutorials/next-step-button";
import {
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";
import { scriptSource } from "@/lib/utils/script-files";
import {
  resetCountEdits,
  resetCountProcedure,
} from "@/lib/utils/tutorial-code";

const useScript = () => {
  const { scripts } = useScripts();
  const scriptName = useScriptName();
  return scripts.find(
    ({ name, type }) => name === scriptName && type === "account-component",
  );
};

// An edit after the compile turns the script back into a draft, so the
// compiled package is the one of the source checked here: a `reset_count`
// export taking and returning nothing, built from a source that pushes this
// run's number.
const useCompleted = () => {
  const script = useScript();
  const [edit] = resetCountEdits(useRunTag());
  const exported = (script?.procedureExports ?? []).some(
    ({ path, signature }) =>
      path.endsWith("::reset_count") &&
      signature.params.length === 0 &&
      signature.results.length === 0,
  );
  return (
    script?.status === "compiled" &&
    exported &&
    !!edit?.applied(scriptSource(script))
  );
};

// The lines quoted here are apps/api/templates/counter-account.masm's, the
// source the script is created from: after editing the template, check them.
// The edit adds a procedure and leaves the slot names alone, so the script
// keeps the template's storage schema and step 3's typed deploy form.
const Step2: TutorialStep = {
  title: "Add a procedure and compile the script.",
  Content: () => {
    const completed = useCompleted();
    const script = useScript();
    const tag = useRunTag();
    return (
      <>
        <p>
          Let's extend the counter contract with a new procedure that resets the
          count to zero. Add the following{" "}
          <strong>
            <InlineCode>reset_count</InlineCode>
          </strong>{" "}
          procedure at the end of your script, after the{" "}
          <strong>
            <InlineCode>end</InlineCode>
          </strong>{" "}
          of{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>
          :
        </p>
        <CodeBlock
          code={resetCountProcedure(tag).join("\n")}
          action={
            <ApplyCodeButton script={script} edits={resetCountEdits(tag)} />
          }
        />
        <p>
          Like the other two procedures, it's marked{" "}
          <InlineCode>@account_procedure</InlineCode> and{" "}
          <InlineCode>pub</InlineCode>, so the contract exports it. The
          procedure writes the counter's new value the same way{" "}
          <InlineCode>increment_count</InlineCode> does:{" "}
          <InlineCode>padw</InlineCode> pushes the new value, a Word of four
          zeros, then <InlineCode>push.COUNT_KEY</InlineCode> and{" "}
          <InlineCode>push.COUNT_MAP_SLOT[0..2]</InlineCode> push the key and
          the slot's id on top of it.{" "}
          <InlineCode>native_account::set_map_item</InlineCode> writes the value
          under the key and leaves the old one, which{" "}
          <InlineCode>dropw</InlineCode> drops. A procedure that is called from
          outside the contract must leave exactly 16 elements on the stack,
          which <InlineCode>sys::truncate_stack</InlineCode> makes sure of.
        </p>
        <p>
          Its first instruction,{" "}
          <strong>
            <InlineCode>push.{tag} drop</InlineCode>
          </strong>
          , pushes a number unique to your run of this tutorial and drops it
          right away: it doesn't change what the procedure does. You'll see
          below why it's there.
        </p>
        <p>
          Then click the <em>"Compile"</em> button above the editor. The
          Playground sends your{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#miden-assembly">
            Miden Assembly (MASM)
          </ExternalLink>{" "}
          source to the Miden assembler, which turns it into code that the{" "}
          <ExternalLink href="https://docs.miden.xyz/design/miden-vm/">
            Miden VM
          </ExternalLink>{" "}
          can execute. The result is a Miden package (a{" "}
          <strong>
            <InlineCode>.masp</InlineCode>
          </strong>{" "}
          file), which contains both the assembled code and a manifest
          describing what the package exports. If the assembler reports an error
          instead, the console under the editor shows it and the editor
          underlines the faulty code: click the error's location in the console
          to jump to it.
        </p>
        <p>
          Click the <em>"Manifest"</em> tab: under <em>"Package exports"</em>,
          you'll find the procedures exported by the package, now including{" "}
          <InlineCode>reset_count</InlineCode>, along with their signatures.
        </p>
        <p>
          Only the assembled code is stored on-chain, and each procedure is
          identified by its{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
            MAST root
          </ExternalLink>
          , a hash of its code, rather than by its name. The link with the
          original source code is lost, with the names of its procedures and
          constants, its comments, and the procedure signatures, which you need
          to call the procedures with the right arguments.
        </p>
        <p>
          Contract verification bridges this gap: it links the on-chain code
          back to its source code and package manifest, so that anyone can read
          the source code and know how to call the exported procedures.
        </p>
        <p>
          A MAST root depends only on the code: everyone who writes the same
          procedure gets the same MAST root, whatever they named their script.
          That's what <InlineCode>push.{tag} drop</InlineCode> is for: it makes
          your <InlineCode>reset_count</InlineCode>, and so your contract's
          code, different from the one of everyone else running this tutorial.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Add the reset_count procedure and compile."
          titleWhenCompleted="You compiled the script."
          description={
            <p>
              Add the <strong>reset_count</strong> procedure after{" "}
              <strong>increment_count</strong>, with its{" "}
              <strong>push.{tag} drop</strong> line (or use the button under the
              code), then click the <em>"Compile"</em> button.
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
