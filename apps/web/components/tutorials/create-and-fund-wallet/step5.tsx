import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import useTransactions from "@/hooks/use-transactions";
import type { InputNote } from "@/lib/types/note";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { wallets } = useAccounts();
  const { transactions } = useTransactions();
  const wallet = wallets.find(({ isPublic }) => isPublic);
  const transaction = transactions.find(
    ({ accountId }) => accountId === wallet?.id,
  );
  return !!transaction;
};

const Step5Content = ({ note }: { note?: InputNote }) => (
  <>
    <p>
      <TutorialLink href={`/notes/${note?.id}`}>Click here</TutorialLink> to
      view the output note created by the mint transaction.
    </p>
    <p>
      Each Note has a script that defines the conditions under which it can be
      consumed. Consumption of a Note can be restricted to certain Accounts or
      entities. For example, the <strong>P2ID (Pay-to-ID)</strong> note script
      locks a Note to a specific Account ID, so that only that Account can
      consume it.
    </p>
    <p>
      The faucet created a P2ID note and wrote your wallet's Account ID into its{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/note#storage">
        note storage
      </ExternalLink>
      . When the Note is consumed, its script checks that the consuming
      account's ID matches this one, so only your wallet can consume the Note
      and receive its assets.
    </p>
    <p>
      Note storage is encoded as an array of{" "}
      <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
        Felts
      </ExternalLink>{" "}
      (field elements). The decoded note storage section shows your wallet's
      Account ID, which is split into two Felts (prefix and suffix) because it
      doesn't fit in a single one.
    </p>
    <p>
      Consumption happens as part of a Transaction. When a Note is consumed, its{" "}
      <ExternalLink href="https://docs.miden.xyz/builder/glossary/#nullifier">
        nullifier
      </ExternalLink>{" "}
      is recorded on-chain, which marks the Note as spent and prevents
      double-spending.
    </p>
  </>
);

const Step5: TutorialStep = {
  title: "Consume the output note.",
  Content: () => {
    const { wallets, faucets } = useAccounts();
    const { inputNotes } = useNotes();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const note = inputNotes.find(({ senderId }) => senderId === faucet?.id);
    const completed = useCompleted();
    return (
      <>
        <Step5Content note={note} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Consume the Note."
          titleWhenCompleted="The Note has been consumed."
          description={
            <p>
              Click <em>"Consume note with {wallet?.name}"</em>, then preview
              and submit the resulting Transaction.
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

export default Step5;
