import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import MintButton from "@/components/tutorials/wallet-backup-using-miden-guardian/mint-button";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import {
  midenFaucetAccountId,
  midenFaucetFunderAccountId,
  P2ID_NOTE_CODE,
} from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";
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
        <p>
          Now that your guardian wallet is deployed, let's fund it by requesting
          tokens from the public{" "}
          <ExternalLink href="https://faucet.testnet.miden.io/">
            USDCx Faucet
          </ExternalLink>
          .
        </p>
        <p>
          Click the <em>"Mint"</em> button to request <strong>10 USDCx</strong>{" "}
          from the faucet. They are sent directly to your guardian wallet in a
          public note.
        </p>
        <MintButton />
        <p>
          Once the request completes, wait a few more seconds for the Note sent
          by the USDCx Faucet to be committed on testnet.
        </p>
        <p>
          The Note containing your tokens then automatically appears in the{" "}
          <em>"Consumable Notes"</em> section of your guardian wallet.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Request tokens from the faucet."
          titleWhenCompleted="Your guardian wallet received a Note from the faucet."
          description={
            <p>
              Click the <em>"Mint"</em> button to request tokens from the USDCx
              Faucet. Once the Note has been committed on testnet, you can
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
