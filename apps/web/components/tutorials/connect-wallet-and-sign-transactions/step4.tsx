import { EllipsisVertical } from "lucide-react";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { P2ID_NOTE_CODE } from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

const useCompleted = () => {
  const { tutorialStartBlockNum } = useGlobalContext();
  const { wallets, connectedWallet } = useAccounts();
  const senderAccount = wallets.find(
    ({ address }) => address === connectedWallet?.address,
  );
  const recipientAccount = wallets.find(
    ({ address }) => address !== connectedWallet?.address,
  );
  const { inputNotes } = useNotes();
  // Starting the tutorial resets the client store, which can fetch notes sent
  // in a previous run again: only count notes included since then.
  const note = inputNotes.find(
    ({ senderId, scriptRoot, storage, state, type, blockNum }) =>
      senderId === senderAccount?.id &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1] ?? "", storage[0] ?? "") ===
        recipientAccount?.id &&
      state === "committed" &&
      type === "private" &&
      blockNum > tutorialStartBlockNum,
  );
  return !!note;
};

const Step4: TutorialStep = {
  title: "Send tokens to the Test Wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>Let's send some tokens from your Bread Wallet to the Test Wallet.</p>
        <p>
          On the accounts page, click the{" "}
          <EllipsisVertical className="size-4 inline" /> icon button in your
          wallet's row to open the transaction menu.
        </p>
        <p>
          Select the <em>"New send transaction"</em> option to open the
          configuration dialog, then select the <strong>Test Wallet</strong> as
          the target account and <strong>USDCX</strong> as the asset.
        </p>
        <p>
          Enter an amount of <strong>1 at most</strong>: USDCx is also the asset
          used to pay transaction fees on testnet, so you need to keep enough of
          it in your wallet to cover them. Leave the note type set to{" "}
          <strong>Private</strong>.
        </p>
        <p>
          Click the <em>"Preview"</em> button: Bread Wallet will ask you to
          confirm the send transaction, which creates a private P2ID output note
          carrying your tokens that only the recipient account can consume.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Send tokens to the Test Wallet."
          titleWhenCompleted="The output note carrying your tokens has been created."
          description={
            <p>
              Click the <EllipsisVertical className="size-4 inline" /> icon
              button in your wallet's row on the accounts page and select the{" "}
              <em>"New send transaction"</em> option. Send at most 1 USDCx to
              the Test Wallet in a private note, then confirm the Transaction in
              Bread Wallet.
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

export default Step4;
