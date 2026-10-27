import { AccountId as WasmAccountId } from "@miden-sdk/miden-sdk";
import { useSyncState } from "@miden-sdk/react";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
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

const Step4Content = ({
  accountIdPrefix,
  accountIdSuffix,
  address,
  syncHeight,
}: {
  accountIdPrefix: string;
  accountIdSuffix: string;
  address: string;
  syncHeight: number;
}) => (
  <>
    <p>
      Now that your note script is compiled, let's create the Note by executing
      a Transaction. Your wallet signs this Transaction, so make sure it's
      connected to the Playground before continuing.
    </p>
    <p>
      From the <TutorialLink href="/notes">notes page</TutorialLink>, click the{" "}
      <em>"Add note"</em> button and select the <em>"Create note"</em> option.
    </p>
    <p>
      A <em>"Create Note"</em> dialog shows up to help you configure the note
      creation transaction. Set the recipient account to the{" "}
      <strong>Test Wallet</strong> that was created for you, select your script
      and leave the note type set to <strong>Public</strong>.
    </p>
    <p>
      The Note is created by your wallet, so it must carry some of your assets:
      click the <em>"Add note assets"</em> button, select <strong>USDCX</strong>{" "}
      as the asset and enter an amount of <strong>1 at most</strong>. USDCx is
      also the asset used to pay transaction fees on testnet, so you need to
      keep enough of it in your wallet to cover them.
    </p>
    <p>
      The final step is to fill in the note storage of your custom note. Click
      the <em>"Add note storage"</em> button three times to add three storage
      items.
    </p>
    <p>
      The first two storage items are the target Account ID suffix and prefix:
      use the{" "}
      <TutorialLink href={`/accounts/${address}`}>Test Wallet</TutorialLink>'s
      Account ID suffix <strong>{accountIdSuffix}</strong> and prefix{" "}
      <strong>{accountIdPrefix}</strong>.
    </p>
    <p>
      The third storage item is the timelock block height: you can set it to any
      future block height, for example <strong>{syncHeight}</strong>.
    </p>
    <p>
      Once you're done, click the <em>"Create"</em> button and confirm the
      Transaction in your wallet.
    </p>
  </>
);

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
