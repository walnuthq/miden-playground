import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial11/step3.mdx";
import useNotes from "@/hooks/use-notes";
import useAccounts from "@/hooks/use-accounts";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";
import {
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  MIDEN_FAUCET_ACCOUNT_ID,
  P2ID_NOTE_CODE,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ fungibleAssets, senderId, scriptRoot, inputs, state, type }) =>
      fungibleAssets.some(
        ({ faucetId, amount }) =>
          faucetId === MIDEN_FAUCET_ACCOUNT_ID &&
          amount ===
            parseAmount("100", FUNGIBLE_FAUCET_DEFAULT_DECIMALS).toString(),
      ) &&
      senderId === MIDEN_FAUCET_ACCOUNT_ID &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(inputs[1]!, inputs[0]!) ===
        connectedWallet?.id &&
      state === "committed" &&
      type === "private",
  );
  return connectedWallet?.storageMode === "private" && !!note;
};

const Step3: TutorialStep = {
  title: "Import the private note.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Import the note file."
          titleWhenCompleted="Your private note has been imported."
          description={
            <p>
              Click on the <em>"Add note"</em> button and select the{" "}
              <em>"Import note"</em> option to import the private note file you
              downloaded in the previous step.
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

export default Step3;
