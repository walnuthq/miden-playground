import { useState } from "react";
import { toast } from "sonner";
import ApplyCodeButton from "@/components/tutorials/apply-code-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { CodeBlock, InlineCode } from "@/components/tutorials/prose";
import useNoteScript from "@/components/tutorials/timelock-p2id-note/use-note-script";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTutorials from "@/hooks/use-tutorials";
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

// The lines quoted here are apps/api/templates/p2id-note.masm's, with the
// edits of lib/utils/tutorial-code.ts: after editing the template, check them.
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
          The timelock compares the note's timelock height with the
          Transaction's reference block number, which the{" "}
          <strong>
            <InlineCode>tx</InlineCode>
          </strong>{" "}
          module gives. Import it after the other{" "}
          <strong>
            <InlineCode>use</InlineCode>
          </strong>{" "}
          lines at the top of the script:
        </p>
        <CodeBlock code="use miden::protocol::tx" action={addButton(0)} />
        <p>
          The timelock height is a new parameter of the Note: a third storage
          item, after the target Account ID. A block height fits in a single
          Felt. Under the <em>NOTE STORAGE</em> comment, change{" "}
          <strong>
            <InlineCode>NUM_STORAGE_ITEMS</InlineCode>
          </strong>{" "}
          to <strong>3</strong>, and give the new item an address, the one after
          the suffix's:
        </p>
        <CodeBlock
          code={`const NUM_STORAGE_ITEMS = 3

const STORAGE_PTR = 0
const TARGET_ACCOUNT_ID_PREFIX_PTR = STORAGE_PTR
const TARGET_ACCOUNT_ID_SUFFIX_PTR = STORAGE_PTR + 1
const TIMELOCK_HEIGHT_PTR = STORAGE_PTR + 2`}
          action={addButton(2)}
        />
        <p>
          The error message under the <em>ERRORS</em> comment counts the items
          too: change its <strong>2</strong> to <strong>3</strong> while you're
          there (the button does). Then add an error for the timelock, after the
          other two:
        </p>
        <CodeBlock
          // Wrapped to fit the panel: in the script it's a single line.
          code={`const ERR_P2ID_TIMELOCKED =
    "P2ID note is timelocked until its timelock height"`}
          action={addButton(3)}
        />
        <p>
          Now for the timelock itself. In the{" "}
          <strong>
            <InlineCode>main</InlineCode>
          </strong>{" "}
          procedure, right after the check of the number of storage items and
          its <InlineCode>{"# => []"}</InlineCode> comment, add:
        </p>
        <CodeBlock
          code={`# the timelock height, then the transaction's reference block
mem_load.TIMELOCK_HEIGHT_PTR exec.tx::get_reference_block_number
# => [block_number, timelock_height]

lte assert.err=ERR_P2ID_TIMELOCKED
# => []`}
          action={addButton(5)}
        />
        <p>
          <InlineCode>mem_load.TIMELOCK_HEIGHT_PTR</InlineCode> pushes the
          timelock height from memory, and{" "}
          <InlineCode>tx::get_reference_block_number</InlineCode> pushes the
          number of the block the Transaction executes against on top of it.{" "}
          <InlineCode>lte</InlineCode> takes both and leaves 1 if the timelock
          height is lower than or equal to the block number, 0 otherwise. Until
          the network reaches the timelock height, the assertion fails, and so
          does any Transaction that tries to consume the Note.
        </p>
        <p>
          Once you've added the timelock logic, click the <em>"Compile"</em>{" "}
          button above the editor. The console under the editor reports the
          result: if the assembler finds an error, the console shows it and the
          editor underlines the faulty code, so that you can fix it and compile
          again.
        </p>
        <p>
          When you proceed to the next step, the Playground creates an Account
          named <strong>Test Wallet</strong> for you, a standard wallet built
          from the <strong>auth-no-auth</strong> and{" "}
          <strong>basic-wallet</strong> scripts: it will be the target account
          of your timelocked note.
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
          // unconsumed notes that make the client slower to sync. A standard
          // wallet: the note calls the standard `receive_asset`. Not funded:
          // the note it consumes pays for the transaction that creates it.
          if (!testWallet) {
            setCreatingWallet(true);
            try {
              await deployAccount({
                name: "Test Wallet",
                storageMode: "public",
                components: [
                  { scriptId: "auth-no-auth", storageSlots: [] },
                  { scriptId: "basic-wallet", storageSlots: [] },
                ],
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
