import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/tutorial4/step3.mdx";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import useAccounts from "@/hooks/use-accounts";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";
import {
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  P2ID_NOTE_CODE,
  midenFaucetAccountId,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils/asset";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const { connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ fungibleAssets, senderId, scriptRoot, storage, state, type }) =>
      fungibleAssets.some(
        ({ faucetId, amount }) =>
          faucetId === midenFaucetAccountId(networkId) &&
          amount ===
            parseAmount("100", FUNGIBLE_FAUCET_DEFAULT_DECIMALS).toString(),
      ) &&
      senderId === midenFaucetAccountId(networkId) &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1]!, storage[0]!) ===
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
