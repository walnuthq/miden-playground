import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import type { Transaction } from "@/lib/types/transaction";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step4Content = ({ transaction }: { transaction?: Transaction }) => (
  <>
    <p>
      A{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/transaction">
        Transaction
      </ExternalLink>{" "}
      in Miden is the state transition of a single Account. A Transaction takes
      a single Account and zero or more Notes as input, and outputs the same
      Account with an updated state, together with zero or more Notes.
    </p>
    <img
      className="max-h-64 object-contain"
      src="/img/transaction-diagram.png"
      alt="Transaction diagram"
      width={842}
      height={600}
      loading="lazy"
    />
    <p>
      In most blockchains, a transaction typically involves more than one
      account (e.g., a sender and a receiver). In Miden, a Transaction involves
      a single Account.
    </p>
    <p>
      This means that minting 100 MDN tokens from a fungible faucet to a wallet
      takes two Transactions: one in which the faucet creates a Note containing
      100 MDN, and one in which the wallet consumes that Note and receives the
      100 MDN.
    </p>
    <p>
      <TutorialLink href={`/transactions/${transaction?.id}`}>
        Click here
      </TutorialLink>{" "}
      to view the mint transaction executed in the previous step, and notice how
      it created an output note that contains your MDN tokens. To actually fund
      your wallet, you need to consume this Note, which moves these assets into
      your wallet's vault.
    </p>
  </>
);

const Step4: TutorialStep = {
  title: "Analyze the mint transaction.",
  Content: () => {
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountId }) => accountId === faucet?.id,
    );
    return <Step4Content transaction={transaction} />;
  },
};

export default Step4;
