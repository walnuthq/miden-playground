import { AccountId as WasmAccountId } from "@miden-sdk/miden-sdk/lazy";
import { useSyncState } from "@miden-sdk/react/lazy";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step4Content from "@/components/tutorials/timelock-p2id-note/step4.mdx";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { P2IDE_NOTE_CODE } from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";
import {
  accountIdFromPrefixSuffix,
  getIdentifierPart,
} from "@/lib/utils/account";

const useCompleted = () => {
  const { connectedWallet, wallets } = useAccounts();
  const { inputNotes } = useNotes();
  const testWallet = wallets.find(({ name }) => name === "Test Wallet");
  const note = inputNotes.find(
    ({ senderId, scriptRoot, storage, state, type }) =>
      senderId === connectedWallet?.id &&
      scriptRoot === P2IDE_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[3] ?? "", storage[2] ?? "") ===
        testWallet?.id &&
      state === "committed" &&
      type === "public",
  );
  return !!note;
};

const Step4: TutorialStep = {
  title: "Create the timelocked note.",
  Content: () => {
    const { wallets } = useAccounts();
    const { syncHeight } = useSyncState();
    const completed = useCompleted();
    const testWallet = wallets.find(({ name }) => name === "Test Wallet");
    const accountId = testWallet
      ? WasmAccountId.fromHex(testWallet.id)
      : undefined;
    return (
      <>
        <Step4Content
          address={getIdentifierPart(testWallet?.address ?? "")}
          accountIdPrefix={accountId?.prefix().toString() ?? ""}
          accountIdSuffix={accountId?.suffix().toString() ?? ""}
          syncHeight={syncHeight + 43200}
        />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the Note."
          titleWhenCompleted="You created the timelocked P2ID note."
          description={
            <p>
              Create a Note from your script with the <em>"Create Note"</em>{" "}
              dialog, then confirm the Transaction in your wallet.
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
