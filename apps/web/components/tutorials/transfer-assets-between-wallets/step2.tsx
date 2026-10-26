import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList, ExternalLink } from "@/components/tutorials/prose";
import useWalletB from "@/components/tutorials/transfer-assets-between-wallets/use-wallet-b";
import WalletBAlert from "@/components/tutorials/transfer-assets-between-wallets/wallet-b-alert";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

const useCompleted = () => {
  const { walletA, walletB } = useWalletB();
  const { transactions } = useTransactions();
  const transaction = transactions.find(({ accountId, outputNotes }) => {
    const [outputNote] = outputNotes;
    const [suffix = "", prefix = ""] = outputNote?.storage ?? [];
    const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
    return accountId === walletA?.id && targetAccountId === walletB?.id;
  });
  return !!transaction;
};

const Step2Content = ({
  walletA,
  walletB,
}: {
  walletA?: Account;
  walletB?: Account;
}) => (
  <>
    <p>
      Navigate to{" "}
      <TutorialLink href={`/accounts/${walletA?.identifier}`}>
        Wallet A
      </TutorialLink>{" "}
      and take a look at the <em>"Assets"</em> table: these are the MDN tokens
      you'll transfer to{" "}
      <TutorialLink href={`/accounts/${walletB?.identifier}`}>
        Wallet B
      </TutorialLink>
      .
    </p>
    <p>
      To start the transfer, you first need to create a send transaction from{" "}
      <strong>Wallet A</strong> to <strong>Wallet B</strong>. From{" "}
      <strong>Wallet A</strong>'s page, click the{" "}
      <em>"Create new transaction"</em> button, then select{" "}
      <em>"New send transaction"</em>.
    </p>
    <p>
      A <em>"Configure send transaction"</em> dialog will open, where you can
      select the target account (<strong>Wallet B</strong>), the asset you want
      to send (<strong>MDN</strong>) and the amount, e.g. <strong>100</strong>{" "}
      tokens.
    </p>
    <p>
      The <em>"Note type"</em> field sets how the Note created by this
      Transaction is stored. As with{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/id#account-type">
        Accounts
      </ExternalLink>
      , Notes can be stored either publicly or privately:
    </p>
    <BulletList>
      <li>
        <strong>Public notes</strong>: the Note's data is stored in the{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/state#note-database">
          note database
        </ExternalLink>
        , making it fully visible on-chain.
      </li>
      <li>
        <strong>Private notes</strong>: only a commitment (hash) of the Note is
        stored on-chain. The Note's details stay off-chain and are shared
        directly with the recipient, enhancing privacy.
      </li>
    </BulletList>
    <p>
      Leave it as it is and click <em>"Preview"</em>. The preview step
      summarizes the changes the Transaction will make to{" "}
      <strong>Wallet A</strong>. When you're ready, click <em>"Submit"</em> to
      execute the Transaction. This can take a few moments, because a
      zero-knowledge proof of the Transaction has to be generated, which is
      computationally intensive.
    </p>
  </>
);

const Step2: TutorialStep = {
  title: "Submit a send transaction.",
  Content: () => {
    const { walletA, walletB } = useWalletB();
    const completed = useCompleted();
    return (
      <>
        <Step2Content walletA={walletA} walletB={walletB} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Submit a send transaction."
          titleWhenCompleted="Your send transaction has been submitted."
          description="Follow the instructions above to create and submit a send
            transaction from Wallet A."
        />
        <WalletBAlert />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step2;
