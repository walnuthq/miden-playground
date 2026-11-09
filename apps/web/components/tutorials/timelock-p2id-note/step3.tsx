import { useState } from "react";
import { toast } from "sonner";
import ApplyCodeButton from "@/components/tutorials/apply-code-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { CodeBlock, InlineCode } from "@/components/tutorials/prose";
import useNoteScript from "@/components/tutorials/timelock-p2id-note/use-note-script";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTutorials from "@/hooks/use-tutorials";
import { basicWalletComponent } from "@/lib/tutorials/basic-wallet";
import noAuth from "@/lib/types/default-components/auth-no-auth";
import type { TutorialStep } from "@/lib/types/tutorial";
import { scriptSource } from "@/lib/utils/script-files";
import { timelockEdits } from "@/lib/utils/tutorial-code";

// An edit after the compile turns the script back into a draft, so the
// compiled package is the one of the source checked here.
const useCompleted = () => {
  const script = useNoteScript();
  return (
    script?.status === "compiled" &&
    timelockEdits.every((edit) => edit.applied(scriptSource(script)))
  );
};

// Line numbers refer to apps/api/templates/p2id-note.rs, the source the script
// is created from, and only where the earlier snippets don't move them.
const Step3: TutorialStep = {
  title: "Add the timelock logic to the P2ID note script.",
  Content: () => {
    const completed = useCompleted();
    const script = useNoteScript();
    // The buttons add each snippet, and the earlier edits it builds on (their
    // order is in lib/utils/tutorial-code.ts).
    const addButton = (upTo: number) => (
      <ApplyCodeButton script={script} edits={timelockEdits} upTo={upTo} />
    );
    return (
      <>
        <p>
          The timelock block height is a new parameter of the Note, so it needs
          a new field in the{" "}
          <strong>
            <InlineCode>P2idNote</InlineCode>
          </strong>{" "}
          struct. Add it after{" "}
          <strong>
            <InlineCode>target_account_id</InlineCode>
          </strong>
          , at line <em>14</em>: the storage items follow the order of the
          fields.
        </p>
        <CodeBlock
          code={`#[note]
struct P2idNote {
    target_account_id: AccountId,
    timelock_height: Felt,
}`}
          // Also imports `Felt` (the next snippet): the field needs it to
          // compile.
          action={addButton(1)}
        />
        <p>
          A block height fits in a single Felt. The script doesn't import the{" "}
          <strong>
            <InlineCode>Felt</InlineCode>
          </strong>{" "}
          type yet, nor the{" "}
          <strong>
            <InlineCode>tx</InlineCode>
          </strong>{" "}
          module that gives the block number: add both to the{" "}
          <strong>
            <InlineCode>use</InlineCode>
          </strong>{" "}
          statement at line <em>5</em>.
        </p>
        <CodeBlock
          // Wrapped to fit the panel: in the script it's a single line.
          code={`use miden::{
    account, felt_repr::ToFeltRepr, note, tx,
    AccountId, Felt, Recipient, Word,
};`}
          action={addButton(0)}
        />
        <p>
          The{" "}
          <strong>
            <InlineCode>build_recipient</InlineCode>
          </strong>{" "}
          constructor fills the struct in, so it has to set the new field too:
          give it a{" "}
          <strong>
            <InlineCode>timelock_height</InlineCode>
          </strong>{" "}
          parameter and pass it on to the struct.
        </p>
        <CodeBlock
          code={`pub fn build_recipient(
    target: AccountId,
    serial_num: Word,
    timelock_height: Felt,
) -> Recipient {
    let inputs = P2idNote {
        target_account_id: target,
        timelock_height,
    };
    // ...
}`}
          action={addButton(3)}
        />
        <p>
          Now for the timelock itself. At the beginning of the{" "}
          <strong>
            <InlineCode>script</InlineCode>
          </strong>{" "}
          method, get the Transaction's reference block number with{" "}
          <strong>
            <InlineCode>tx::get_reference_block_number()</InlineCode>
          </strong>{" "}
          and assert that it has reached the timelock block height. Before that
          block, the assertion fails, and so does any Transaction that tries to
          consume the Note.
        </p>
        <CodeBlock
          code={`let block_number = tx::get_reference_block_number();
assert!(block_number.as_felt() >= self.timelock_height);`}
          action={addButton(5)}
        />
        <p>
          Once you've added the timelock logic, click the <em>"Compile"</em>{" "}
          button above the editor. The console under the editor reports the
          result: if the compiler finds an error, the console shows it and the
          editor underlines the faulty code, so that you can fix it and compile
          again.
        </p>
        <p>
          When you proceed to the next step, the Playground creates an account
          named <strong>Test Wallet</strong> for you, with the{" "}
          <strong>
            <InlineCode>basic-wallet</InlineCode>
          </strong>{" "}
          component your script relies on: it will be the target account of your
          timelocked note.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Compile the script."
          titleWhenCompleted="You compiled the timelock P2ID script."
          description={
            <p>
              Follow the instructions to add the timelock logic to your P2ID
              script (or use the buttons under the code), then click the{" "}
              <em>"Compile"</em> button above the editor to compile it.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    const { wallets, deployAccount } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    const [creatingWallet, setCreatingWallet] = useState(false);
    const testWallet = wallets.find(({ name }) => name === "Test Wallet");
    return (
      <NextStepButton
        text={creatingWallet ? "Creating wallet…" : undefined}
        disabled={!completed || creatingWallet}
        onClick={async () => {
          // Every user gets their own recipient wallet: a shared one piles up
          // unconsumed notes that make the client slower to sync. It carries
          // the Rust basic wallet the script is compiled against, whose
          // `receive_asset` a standard wallet doesn't have. Not funded: the
          // note it consumes pays for the transaction that creates it.
          if (!testWallet) {
            setCreatingWallet(true);
            try {
              await deployAccount({
                name: "Test Wallet",
                storageMode: "public",
                components: [noAuth, basicWalletComponent],
                fund: false,
              });
            } catch (error) {
              console.error(error);
              toast.error("Failed to create the recipient wallet.", {
                description:
                  error instanceof Error ? error.message : String(error),
              });
              return;
            } finally {
              setCreatingWallet(false);
            }
          }
          nextTutorialStep();
        }}
      />
    );
  },
};

export default Step3;
