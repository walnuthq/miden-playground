import type { TutorialStep } from "@/lib/types/tutorial";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/wallet-backup-using-miden-guardian/step3.mdx";
import useAccounts from "@/hooks/use-accounts";
import {
  P2ID_NOTE_CODE,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  midenFaucetAccountId,
} from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";
import { parseAmount } from "@/lib/utils/asset";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
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
      accountIdFromPrefixSuffix(storage[1]!, storage[0]!) === multisig?.id &&
      state === "committed" &&
      type === "public",
  );
  return !!note;
};

const Step3: TutorialStep = {
  title: "Mint assets from the Miden Faucet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Request tokens from the faucet."
          titleWhenCompleted="Your mint note is ready for consumption."
          description={
            <p>
              Click on the <em>"Mint"</em> button to automatically request 100
              tokens from the Miden Faucet. Once the note has been committed on
              testnet, you will be able to continue.
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
