import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { faucets } = useAccounts();
  const { transactions } = useTransactions();
  const faucet = faucets.find(({ name }) => name === "MDN Faucet");
  const transaction = transactions.find(
    ({ accountId }) => accountId === faucet?.id,
  );
  return !!transaction;
};

const Step3Content = ({ faucet }: { faucet?: Account }) => (
  <>
    <p>
      To fund your wallet, you first need to execute a mint transaction on the
      faucet account. This Transaction creates new MDN tokens and sends them to
      your wallet.
    </p>
    <p>
      A{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/note">
        Note
      </ExternalLink>{" "}
      is the medium through which Accounts communicate. Notes hold assets and
      define how they can be consumed. For instance, your mint transaction will
      create a Note that holds your test tokens and can only be consumed by your
      wallet.
    </p>
    <p>
      From the{" "}
      <TutorialLink href={`/accounts/${faucet?.identifier}`}>
        faucet page
      </TutorialLink>
      , click the <em>"Create new transaction"</em> button, then select{" "}
      <em>"New mint transaction"</em>. A <em>"Configure mint transaction"</em>{" "}
      dialog will open, where you can select the target account (your newly
      created wallet) and enter an amount, e.g. <strong>100</strong> tokens.
    </p>
    <p>
      The{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/note#note-type">
        note type
      </ExternalLink>{" "}
      sets the privacy of the Note you're about to create. A{" "}
      <strong>public</strong> note is stored on-chain in full, while only a
      commitment (hash) of a <strong>private</strong> note is stored on-chain
      and its details are shared directly with the recipient. Leave it as it is
      and click <em>"Preview"</em>.
    </p>
    <p>
      The preview step summarizes the changes the Transaction will make to the
      executing account (in this case, the MDN Faucet). A fungible faucet keeps
      track of the total supply it has minted so far in its token config{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage">
        storage slot
      </ExternalLink>
      .
    </p>
    <p>
      When you're ready, click <em>"Submit"</em> to execute the Transaction.
      This can take a few moments, because a zero-knowledge proof of the
      Transaction has to be generated, which is computationally intensive.
    </p>
  </>
);

const Step3: TutorialStep = {
  title: "Submit a mint transaction on the faucet.",
  Content: () => {
    const { faucets } = useAccounts();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const completed = useCompleted();
    return (
      <>
        <Step3Content faucet={faucet} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Submit a mint transaction."
          titleWhenCompleted="Your mint transaction has been submitted."
          description="Follow the instructions above to create and submit a mint
            transaction on the faucet."
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
