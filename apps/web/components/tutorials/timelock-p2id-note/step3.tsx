import { useState } from "react";
import { toast } from "sonner";
import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/timelock-p2id-note/step3.mdx";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import useAccounts from "@/hooks/use-accounts";
import useTutorials from "@/hooks/use-tutorials";

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
        <Step3Content />
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
