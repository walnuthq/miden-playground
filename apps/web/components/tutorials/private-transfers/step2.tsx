import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/private-transfers/step2.mdx";
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

const Step2: TutorialStep = {
  title: "Mint assets privately from the Miden Faucet.",
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
