import { type TutorialStep } from "@/lib/types/tutorial";
import useNotes from "@/hooks/use-notes";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/tutorial3/step2.mdx";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import useAccounts from "@/hooks/use-accounts";
import { MIDEN_FAUCET_ACCOUNT_ID, P2ID_NOTE_CODE } from "@/lib/constants";
import { noteInputsToAccountId } from "@/lib/types/note";

const useCompleted = () => {
  const { accountId } = useWallet();
  const { wallets } = useAccounts();
  const wallet = wallets.find(({ address }) => address === accountId);
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ fungibleAssets, senderId, scriptRoot, inputs, state, type }) =>
      fungibleAssets.some(
        ({ faucetId, amount }) =>
          faucetId === MIDEN_FAUCET_ACCOUNT_ID && amount === "100000000"
      ) &&
      senderId === MIDEN_FAUCET_ACCOUNT_ID &&
      scriptRoot === P2ID_NOTE_CODE &&
      noteInputsToAccountId(inputs) === wallet?.id &&
      state === "committed" &&
      type === "public"
  );
  return !!note;
};

const Step2: TutorialStep = {
  title: "Mint assets from the Miden Faucet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Request tokens from the faucet."
          titleWhenCompleted="Your mint note is ready for consumption."
          description={
            <p>
              Click on the <em>"Mint"</em> button to automatically request 100
              tokens from the Miden Faucet. Once the note has been committed on
              testnet, you will be able to continue the tutorial.
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
