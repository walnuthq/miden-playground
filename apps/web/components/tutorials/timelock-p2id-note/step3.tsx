import { useState } from "react";
import { toast } from "sonner";
import NextStepButton from "@/components/tutorials/next-step-button";
import { CodeBlock, InlineCode } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  const firstMatches = script?.rust.match(
    /assert_eq\(storage\.len\(\)\.into\(\),\s*felt!\(3\)\);/,
  );
  const secondMatches = script?.rust.match(
    /let\s+timelock_height\s*=\s*storage\[2\];/,
  );
  const thirdMatches = script?.rust.match(
    /let\s+block_number\s*=\s*tx::get_block_number\(\);/,
  );
  const fourthMatches = script?.rust.match(
    /assert!\s*\(\s*block_number\s*>=\s*timelock_height\s*\);/,
  );
  return (
    script?.masm !== "" &&
    !!firstMatches &&
    !!secondMatches &&
    !!thirdMatches &&
    !!fourthMatches
  );
};

const Step3: TutorialStep = {
  title: "Add the timelock logic to the P2ID note script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          The timelock block height will be the third item of the note storage,
          so the script must now expect three storage items. At line <em>28</em>
          , change the expected storage length from{" "}
          <strong>
            <InlineCode>2</InlineCode>
          </strong>{" "}
          to{" "}
          <strong>
            <InlineCode>3</InlineCode>
          </strong>
          :
        </p>
        <CodeBlock
          code={`// make sure the storage length is 3
assert_eq(storage.len().into(), felt!(3));`}
        />
        <p>
          Then, after line <em>33</em>, read the third storage item into a
          variable:
        </p>
        <CodeBlock code={`let timelock_height = storage[2];`} />
        <p>
          To get the current block height, use the transaction kernel's{" "}
          <strong>
            <InlineCode>get_block_number</InlineCode>
          </strong>{" "}
          call, which returns the Transaction's reference block number:
        </p>
        <CodeBlock code={`let block_number = tx::get_block_number();`} />
        <p>
          Finally, check that{" "}
          <strong>
            <InlineCode>block_number</InlineCode>
          </strong>{" "}
          ≥{" "}
          <strong>
            <InlineCode>timelock_height</InlineCode>
          </strong>
          :
        </p>
        <CodeBlock code={`assert!(block_number >= timelock_height);`} />
        <p>
          Once you've added the timelock logic, compile your script and proceed
          to the next step.
        </p>
        <p>
          When you do, the Playground creates a new public wallet named{" "}
          <strong>Test Wallet</strong> for you: it will be the target account of
          your timelocked note.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Compile the script."
          titleWhenCompleted="You compiled the timelock P2ID script."
          description={
            <p>
              Follow the instructions to add the timelock logic to your P2ID
              script, then click the <em>"Compile"</em> button in the editor
              console to compile it.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    const { wallets, newWallet } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    const [creatingWallet, setCreatingWallet] = useState(false);
    const testWallet = wallets.find(({ name }) => name === "Test Wallet");
    return (
      <NextStepButton
        text={creatingWallet ? "Creating wallet…" : undefined}
        disabled={!completed || creatingWallet}
        onClick={async () => {
          // Every user gets their own recipient wallet: a shared one piles up
          // unconsumed notes that make the client slower to sync.
          if (!testWallet) {
            setCreatingWallet(true);
            try {
              await newWallet({
                name: "Test Wallet",
                storageMode: "public",
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
