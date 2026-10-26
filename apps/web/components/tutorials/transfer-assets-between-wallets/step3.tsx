import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import useWalletB from "@/components/tutorials/transfer-assets-between-wallets/use-wallet-b";
import WalletBAlert from "@/components/tutorials/transfer-assets-between-wallets/wallet-b-alert";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { Transaction, TransactionNote } from "@/lib/types/transaction";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step3Content = ({
  note,
  transaction,
  walletB,
}: {
  note?: TransactionNote;
  transaction?: Transaction;
  walletB?: Account;
}) => (
  <>
    <p>
      Your send transaction has been submitted. You can inspect it by{" "}
      <TutorialLink href={`/transactions/${transaction?.id}`}>
        opening the first item
      </TutorialLink>{" "}
      under the <em>"Transactions"</em> menu in the sidebar.
    </p>
    <p>
      Notice how your MDN tokens have been placed in an output note created by
      the Transaction. The other output note is a TX_FEE note, which pays the
      transaction fee. Click the{" "}
      <TutorialLink href={`/notes/${note?.id}`}>note ID</TutorialLink> to
      inspect the Note holding your tokens.
    </p>
    <p>
      This output note is a <strong>P2ID (Pay-to-ID)</strong> note, meaning it
      can only be consumed by the Account whose ID was written into its{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/note#storage">
        note storage
      </ExternalLink>{" "}
      when the send transaction was created. Feel free to read the{" "}
      <strong>Rust source code</strong> of this verified note script, as well as
      its compiled <strong>MASM (Miden Assembly)</strong>, by clicking the{" "}
      <TutorialLink href="/scripts/p2id">script shortcut</TutorialLink>. The
      script is heavily commented and provides insights into the underlying
      Miden architecture.
    </p>
    <p>
      When you're done, click the target account ID in the{" "}
      <em>"Decoded Note Storage"</em> section to navigate to{" "}
      <TutorialLink href={`/accounts/${walletB?.identifier}`}>
        Wallet B
      </TutorialLink>
      .
    </p>
  </>
);

const Step3: TutorialStep = {
  title: "Inspect the transaction and its output note.",
  Content: () => {
    const { walletA, walletB } = useWalletB();
    const { transactions } = useTransactions();
    const transaction = transactions.find(
      ({ accountId, outputNotes }) =>
        accountId === walletA?.id && outputNotes.length === 2,
    );
    const note = transaction?.outputNotes[0];
    return (
      <>
        <Step3Content transaction={transaction} note={note} walletB={walletB} />
        <WalletBAlert />
      </>
    );
  },
  // Step 4 has Wallet B pay its fee out of the fee note: wait for it.
  NextStepButton: () => {
    const { funded } = useWalletB();
    return (
      <NextStepButton
        text={funded ? undefined : "Funding Wallet B…"}
        disabled={!funded}
      />
    );
  },
};

export default Step3;
