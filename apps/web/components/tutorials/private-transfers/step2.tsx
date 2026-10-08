import type { TutorialStep } from "@/lib/types/tutorial";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/private-transfers/step2.mdx";
import {
  P2ID_NOTE_CODE,
  midenFaucetAccountId,
  midenFaucetFunderAccountId,
} from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const { wallets } = useAccounts();
  const { inputNotes } = useNotes();
  const breadWallet = wallets.find(({ name }) => name === "Bread Wallet");
  const note = inputNotes.find(
    ({ fungibleAssets, senderId, scriptRoot, storage, state, type }) =>
      fungibleAssets.some(
        ({ faucetId }) => faucetId === midenFaucetAccountId(networkId),
      ) &&
      senderId === midenFaucetFunderAccountId(networkId) &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1] ?? "", storage[0] ?? "") ===
        breadWallet?.id &&
      state === "consumed-external" &&
      type === "public",
  );
  return !!note;
};

const Step2: TutorialStep = {
  title: "Request tokens from the USDCx Faucet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Request tokens from the faucet."
          titleWhenCompleted="Your Bread Wallet has been funded."
          description={
            <p>
              Click the <em>"Mint"</em> button to request tokens from the USDCx
              Faucet. Once the note has been committed on testnet and consumed
              by your Bread Wallet, you will be able to continue the tutorial.
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
