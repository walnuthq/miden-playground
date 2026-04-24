import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/tutorial7/step4.mdx";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import {
  P2IDE_NOTE_CODE,
  testWalletAccountId,
  testWalletAddress,
  testWalletAccountIdPrefix,
  testWalletAccountIdSuffix,
} from "@/lib/constants";
import {
  accountIdFromPrefixSuffix,
  getIdentifierPart,
} from "@/lib/utils/account";
import { useSyncState } from "@miden-sdk/react";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const { connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ senderId, scriptRoot, storage, state, type }) =>
      senderId === connectedWallet?.id &&
      scriptRoot === P2IDE_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1]!, storage[0]!) ===
        testWalletAccountId(networkId) &&
      state === "committed" &&
      type === "public",
  );
  return !!note;
};

const Step4: TutorialStep = {
  title: "Create a note by executing a transaction.",
  Content: () => {
    const { networkId } = useNetwork();
    const { syncHeight } = useSyncState();
    const completed = useCompleted();
    return (
      <>
        <Step4Content
          address={getIdentifierPart(testWalletAddress(networkId))}
          accountIdPrefix={testWalletAccountIdPrefix(networkId)}
          accountIdSuffix={testWalletAccountIdSuffix(networkId)}
          syncHeight={syncHeight + 100}
        />
        <TutorialAlert
          completed={completed}
          title="Action required: Create the note."
          titleWhenCompleted="You created the timelock P2ID note."
          description={
            <p>
              Follow the instructions to create your custom timelock P2ID note.
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
