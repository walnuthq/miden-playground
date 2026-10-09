import type { TutorialStep } from "@/lib/types/tutorial";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/wallet-backup-using-miden-guardian/step3.mdx";
import useAccounts from "@/hooks/use-accounts";
import {
  P2ID_NOTE_CODE,
  midenFaucetAccountId,
  midenFaucetFunderAccountId,
} from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ fungibleAssets, senderId, scriptRoot, storage, state, type }) =>
      fungibleAssets.some(
        ({ faucetId }) => faucetId === midenFaucetAccountId(networkId),
      ) &&
      senderId === midenFaucetFunderAccountId(networkId) &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1] ?? "", storage[0] ?? "") ===
        multisig?.id &&
      state === "committed" &&
      type === "public",
  );
  return !!note;
};

const Step3: TutorialStep = {
  title: "Request tokens from the USDCx Faucet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Request tokens from the faucet."
          titleWhenCompleted="Your guardian wallet received a note from the faucet."
          description={
            <p>
              Click the <em>"Mint"</em> button to request tokens from the USDCx
              Faucet. Once the note has been committed on testnet, you can
              proceed to the next step.
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
