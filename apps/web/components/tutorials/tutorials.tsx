import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import { type Tutorial } from "@/lib/types";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import useTutorials from "@/hooks/use-tutorials";
import useTransactions from "@/hooks/use-transactions";
import tutorial1StoreDump from "@/components/tutorials/tutorial1-store.json";
import tutorial1State from "@/components/tutorials/tutorial1-state.json";
import tutorial2StoreDump from "@/components/tutorials/tutorial2-store.json";
import tutorial2State from "@/components/tutorials/tutorial2-state.json";
// import tutorial3StoreDump from "@/components/tutorials/tutorial3-store.json";
// import tutorial3State from "@/components/tutorials/tutorial3-state.json";
import AccountAddress from "@/components/lib/account-address";
import useGlobalContext from "../global-context/hook";

const NextStepButton = ({
  text = "Next step",
  disabled = false,
  onClick,
}: {
  text?: string;
  disabled?: boolean;
  onClick: () => void;
}) => {
  const { nextTutorialStepDisabled, setNextTutorialStepDisabled } =
    useTutorials();
  useEffect(() => {
    if (nextTutorialStepDisabled !== disabled) {
      setNextTutorialStepDisabled(disabled);
    }
  }, [disabled, nextTutorialStepDisabled, setNextTutorialStepDisabled]);
  return (
    <Button className="grow-2" disabled={disabled} onClick={onClick}>
      {text}
    </Button>
  );
};

const CreateAndFundWalletStep1 = {
  title: "Create your first wallet Account.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return (
      <>
        <p>
          An{" "}
          <a
            href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/account.html"
            className="text-primary font-medium underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Account
          </a>{" "}
          represents the primary entity of the protocol. Capable of holding
          assets, storing data, and executing custom code. Each Account is a
          specialized smart contract providing a programmable interface for
          interacting with its state and assets.
        </p>
        <p>
          Users can choose whether their Accounts are stored{" "}
          <span className="font-bold">publicly</span> or{" "}
          <span className="font-bold">privately</span>. The{" "}
          <a
            href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/account.html#account-storage-mode"
            className="text-primary font-medium underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            storage mode
          </a>{" "}
          is chosen during Account creation, it cannot be changed later.
        </p>
        <ul className="ml-6 list-disc [&>li]:mt-2">
          <li>
            <span className="font-bold">Public Accounts</span>: The account's
            state is stored on-chain, similar to how accounts are stored in
            public blockchains like Ethereum.
          </li>
          <li>
            <span className="font-bold">Private Accounts</span>: Only a
            commitment (hash) to the account's state is stored on-chain. This
            mode is suitable for users who prioritize privacy or plan to store a
            large amount of data in their Account.
          </li>
        </ul>
        <p>
          For the purpose of this tutorial, let's create a{" "}
          <span className="font-bold">public</span> wallet Account and fund it
          using a faucet.
        </p>
        <Alert>
          {wallet ? (
            <CircleCheckBig color="var(--color-green-500)" />
          ) : (
            <CircleAlert />
          )}
          <AlertTitle>
            {wallet
              ? "Your first wallet is created."
              : "Action required: Create your first wallet."}
          </AlertTitle>
          {!wallet && (
            <AlertDescription>
              Click on the "Create new account" button then select the "Create
              new wallet" option to generate a wallet Account.
            </AlertDescription>
          )}
        </Alert>
      </>
    );
  },
  NextStepButton: () => {
    const { nextTutorialStep } = useTutorials();
    const router = useRouter();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return (
      <NextStepButton
        disabled={!wallet}
        onClick={() => {
          nextTutorialStep();
          router.push(`/accounts/${wallet?.address}`);
        }}
      />
    );
  },
};

const CreateAndFundWalletStep2 = {
  title: "Discover your new wallet details.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return (
      <>
        <p>
          Our newly created Account generated its own unique{" "}
          <a
            href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/account.html#id"
            className="text-primary font-medium underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Account ID
          </a>
          , an immutable and unique identifier for the Account:{" "}
        </p>
        <AccountAddress address={wallet?.address} />
        <p>
          This identifier is designed to contain the metadata of an Account. The
          metadata includes the account type, account storage mode and the
          version of the Account. This metadata is included in the ID to ensure
          it can be determined without needing the full account state.
        </p>
        <p>
          There are two main categories of accounts in Miden:{" "}
          <span className="font-bold">basic accounts</span> and{" "}
          <span className="font-bold">faucets</span>.
        </p>
        <ul className="ml-6 list-disc [&>li]:mt-2">
          <li>
            <span className="font-bold">Basic Accounts</span>: Basic Accounts
            may be either mutable (code can be changed after deployment) or
            immutable (code cannot be changed once deployed).
          </li>
          <li>
            <span className="font-bold">Faucets</span>: Faucets are always
            immutable and can be specialized by the type of{" "}
            <a
              href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/asset.html"
              className="text-primary font-medium underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Assets
            </a>{" "}
            they issue: either fungible or non-fungible.
          </li>
        </ul>
        <p>
          Let's fund our wallet by requesting MDN assets (tokens) from a
          pre-existing fungible MDN faucet.
        </p>
      </>
    );
  },
  NextStepButton: () => {
    const router = useRouter();
    const { faucets } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    return (
      <NextStepButton
        onClick={() => {
          nextTutorialStep();
          const faucet = faucets.find(({ name }) => name === "MDN Faucet");
          router.push(`/accounts/${faucet?.address}`);
        }}
      />
    );
  },
};

const CreateAndFundWalletStep3 = {
  title: "Submit a mint transaction on the faucet.",
  Content: () => {
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === faucet?.address
    );
    return (
      <>
        <p>
          In order to begin the process of funding our wallet, we first need to
          perform a mint transaction. The role of this transaction is to
          initiate an asset transfer between the faucet and our wallet.
        </p>
        <p>
          Click on the "Create new transaction" button then select "New mint
          transaction" to craft your mint request. A "Configure mint
          transaction" dialog will show up where you can select the target
          account (our newly created wallet) and an arbitrary amount eg. 1000
          tokens.
        </p>
        <p>
          Note type refers to the privacy mode of the transaction you're about
          to create, it can be either <span className="font-bold">private</span>{" "}
          (known only to you) or <span className="font-bold">publicly</span>{" "}
          available on-chain. Leave it as it is and proceed with the preview of
          the mint transaction.
        </p>
        <p>
          The preview step shows a quick summary of the changes about to be
          performed on the executing Account (in this case the MDN Faucet). When
          you're ready to execute the transaction click on "Submit", it will
          take some time as its execution results in the generation of a
          zero-knowledge proof.
        </p>
        <Alert>
          {transaction ? (
            <CircleCheckBig color="var(--color-green-500)" />
          ) : (
            <CircleAlert />
          )}
          <AlertTitle>
            {transaction
              ? "Your mint transaction is submitted."
              : "Action required: Submit a mint transaction."}
          </AlertTitle>
          {!transaction && (
            <AlertDescription>
              Follow the instructions above to create and submit a mint
              transaction against the faucet.
            </AlertDescription>
          )}
        </Alert>
      </>
    );
  },
  NextStepButton: () => {
    const router = useRouter();
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const { nextTutorialStep } = useTutorials();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === faucet?.address
    );
    return (
      <NextStepButton
        disabled={!transaction}
        onClick={() => {
          nextTutorialStep();
          router.push(`/transactions/${transaction?.id}`);
        }}
      />
    );
  },
};

const CreateAndFundWalletStep4 = {
  title: "Analyze the mint transaction.",
  Content: () => {
    return (
      <>
        <p>
          A{" "}
          <a
            href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/transaction.html"
            className="text-primary font-medium underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Transaction
          </a>{" "}
          in Miden is the state transition of a single account. A Transaction
          takes as input a single account and zero or more notes, and outputs
          the same account with an updated state, together with zero or more
          notes.
        </p>
        <Image
          className="max-h-64 object-contain"
          src="/img/transaction-diagram.png"
          alt="Transaction diagram"
          width={842}
          height={600}
        />
        <p>
          Compared to most blockchains, where a Transaction typically involves
          more than one account (e.g., sender and receiver), a Transaction in
          Miden involves a single account. In Miden, minting 1000 MDN tokens
          from a fungible faucet to a wallet takes two transactions, one in
          which the faucet creates a note containing 1000 MDN and one in which
          the wallet consumes that note and receives the 1000 MDN.
        </p>
        <p>
          Our mint transaction executed in the previous step created an output
          note that contains our MDN assets. To actually fund our account we'll
          need to consume this note to transfer these assets in our wallet.
        </p>
      </>
    );
  },
  NextStepButton: () => {
    const router = useRouter();
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const { nextTutorialStep } = useTutorials();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === faucet?.address
    );
    return (
      <NextStepButton
        onClick={() => {
          nextTutorialStep();
          router.push(`/notes/${transaction?.outputNotes[0]?.id}`);
        }}
      />
    );
  },
};

const CreateAndFundWalletStep5 = {
  title: "Consume the output note.",
  Content: () => {
    const { wallets } = useAccounts();
    const { transactions } = useTransactions();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === wallet?.address
    );
    return (
      <>
        <p>
          Our mint transaction has created an output note and we can access the
          note information, in particular we can confirm it holds our requested
          MDN assets.
        </p>
        <p>
          A{" "}
          <a
            href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/note.html"
            className="text-primary font-medium underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Note
          </a>{" "}
          is the medium through which Accounts communicate. A Note holds assets
          and defines how they can be consumed.
        </p>
        <p>
          Each Note has a script that defines the conditions under which it can
          be consumed. Consumption of a Note can be restricted to certain
          accounts or entities. For instance, the{" "}
          <span className="font-bold">P2ID (pay-to-ID)</span> note script
          targets a specific Account ID.
        </p>
        <p>
          Our note inputs constraint specifies that only our own wallet Account
          ID can consume the note and receive the embedded assets, which has
          been enforced during the note creation process by the faucet.
        </p>
        <p>
          Consumption occurs as part of a transaction. Upon successful
          consumption a <span className="font-bold">nullifier</span> is
          generated for the consumed notes to ensure they can no longer be spent
          and avoid double-spending.
        </p>
        <Alert>
          {transaction ? (
            <CircleCheckBig color="var(--color-green-500)" />
          ) : (
            <CircleAlert />
          )}
          <AlertTitle>
            {transaction
              ? "The note has been consumed."
              : "Action required: Consume the note."}
          </AlertTitle>
          {!transaction && (
            <AlertDescription>
              Click on "Consume note", preview and submit the resulting
              transaction.
            </AlertDescription>
          )}
        </Alert>
      </>
    );
  },
  NextStepButton: () => {
    const router = useRouter();
    const { wallets } = useAccounts();
    const { transactions } = useTransactions();
    const { nextTutorialStep } = useTutorials();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === wallet?.address
    );
    return (
      <NextStepButton
        disabled={!transaction}
        onClick={() => {
          nextTutorialStep();
          router.push(`/accounts/${wallet?.address}`);
        }}
      />
    );
  },
};

const CreateAndFundWalletStep6 = {
  title: "Confirm your wallet is funded.",
  Content: () => {
    return (
      <>
        <p>
          You should now see your wallet Assets vault containing the funds sent
          by the faucet.
        </p>
        <p>
          Congratulations! You have successfully used the Miden Playground to
          interact with a Miden rollup and faucet.
        </p>
        <p>
          You have performed basic Miden rollup operations like submitting
          proofs of transactions, generating and consuming notes.
        </p>
      </>
    );
  },
  NextStepButton: () => {
    //const { startTutorial } = useTutorials();
    const { resetState } = useGlobalContext();
    const router = useRouter();
    /* return (
      <NextStepButton
        text="Next tutorial"
        onClick={() => startTutorial("transfer-assets-between-wallets")}
      />
    ); */
    return (
      <NextStepButton
        text="Back to tutorials list"
        onClick={() => {
          resetState();
          router.push("/");
        }}
      />
    );
  },
};

const TransferAssetsBetweenWalletsStep1 = {
  title: "Exploring the accounts.",
  Content: () => {
    const { accounts } = useAccounts();
    const walletA = accounts.find(({ name }) => name === "Wallet A");
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const faucet = accounts.find(({ name }) => name === "MDN Faucet");
    return (
      <>
        <p>
          In this tutorial, we'll learn how to transfer assets between two
          wallets. We've already created the wallets as well as a fungible
          faucet.
        </p>
        <ul className="ml-6 list-disc [&>li]:mt-2">
          <li>
            <Link
              href={`/accounts/${walletA?.address}`}
              className="text-primary font-medium underline underline-offset-4"
            >
              Wallet A
            </Link>
            : This is the source wallet, it has been funded with 1000 MDN tokens
            and we'll transfer them out to the destination wallet.
          </li>
          <li>
            <Link
              href={`/accounts/${walletB?.address}`}
              className="text-primary font-medium underline underline-offset-4"
            >
              Wallet B
            </Link>
            : This is the destination wallet, it will receive MDN tokens from
            the source account.
          </li>
          <li>
            <Link
              href={`/accounts/${faucet?.address}`}
              className="text-primary font-medium underline underline-offset-4"
            >
              MDN Faucet
            </Link>
            : This is the fungible faucet where our MDN tokens originate from.
          </li>
        </ul>
        <Alert>
          <CircleCheckBig color="var(--color-green-500)" />
          <AlertTitle>Explore the accounts.</AlertTitle>
          <AlertDescription>
            Click on each account to explore its current state. Confirm that
            Wallet A holds 1000 MDN tokens and Wallet B has no assets.
          </AlertDescription>
        </Alert>
      </>
    );
  },
  NextStepButton: () => {
    const { nextTutorialStep } = useTutorials();
    return <NextStepButton onClick={nextTutorialStep} />;
  },
};

const TransferAssetsBetweenWalletsStep2 = {
  title: "Submit a send transaction.",
  Content: () => {
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletA = accounts.find(({ name }) => name === "Wallet A");
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountAddress, outputNotes }) =>
        accountAddress === walletA?.address && outputNotes.length === 1
    );
    return (
      <>
        <p>
          Navigate to{" "}
          <Link
            href={`/accounts/${walletA?.address}`}
            className="text-primary font-medium underline underline-offset-4"
          >
            Wallet A
          </Link>{" "}
          account and take a look under the assets table: here are the 1000 MDN
          tokens we'd like to transfer to{" "}
          <Link
            href={`/accounts/${walletB?.address}`}
            className="text-primary font-medium underline underline-offset-4"
          >
            Wallet B
          </Link>{" "}
          which has no assets at the moment.
        </p>
        <p>
          To initiate a transfer, we first need to create a send transaction
          from <span className="font-bold">Wallet A</span> targeting{" "}
          <span className="font-bold">Wallet B</span>. From{" "}
          <span className="font-bold">Wallet A</span> page, click on the{" "}
          <span className="italic">"Create new transaction"</span> then{" "}
          <span className="italic">"New send transaction"</span>.
        </p>
        <p>
          A <span className="italic">"Configure send transaction"</span> dialog
          will show up where you can select the target account (
          <span className="font-bold">Wallet B</span>), the asset you want to
          transfer out (<span className="font-bold">MDN tokens</span>) and the
          amount to send eg. 1000 tokens.
        </p>
        <p>
          The preview step shows a quick summary of the changes about to be
          performed on <span className="font-bold">Wallet B</span>. When you're
          ready to execute the transaction click on{" "}
          <span className="italic">"Submit"</span>.
        </p>
        <Alert>
          {transaction ? (
            <CircleCheckBig color="var(--color-green-500)" />
          ) : (
            <CircleAlert />
          )}
          <AlertTitle>
            {transaction
              ? "Your send transaction is submitted."
              : "Action required: Submit a send transaction."}
          </AlertTitle>
          {!transaction && (
            <AlertDescription>
              Follow the instructions above to create and submit a send
              transaction against Wallet A.
            </AlertDescription>
          )}
        </Alert>
      </>
    );
  },
  NextStepButton: () => {
    const { nextTutorialStep } = useTutorials();
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletA = accounts.find(({ name }) => name === "Wallet A");
    const transaction = transactions.find(
      ({ accountAddress, outputNotes }) =>
        accountAddress === walletA?.address && outputNotes.length === 1
    );
    return (
      <NextStepButton disabled={!transaction} onClick={nextTutorialStep} />
    );
  },
};

const TransferAssetsBetweenWalletsStep3 = {
  title: "Inspect transaction and output note.",
  Content: () => {
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletA = accounts.find(({ name }) => name === "Wallet A");
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountAddress, outputNotes }) =>
        accountAddress === walletA?.address && outputNotes.length === 1
    );
    const note = transaction?.outputNotes[0];
    return (
      <>
        <p>
          Your send transaction has been submitted and you can inspect it by{" "}
          <Link
            href={`/transactions/${transaction?.id}`}
            className="text-primary font-medium underline underline-offset-4"
          >
            navigating to the first item
          </Link>{" "}
          that shows up under the <span className="italic">"Transactions"</span>{" "}
          sub-menu in the sidebar.
        </p>
        <p>
          See how our MDN tokens have been embedded in the resulting output note
          generated by the transaction. Click on the{" "}
          <Link
            href={`/notes/${note?.id}`}
            className="text-primary font-medium underline underline-offset-4"
          >
            note ID
          </Link>{" "}
          to inspect it further.
        </p>
        <p>
          This output note is a{" "}
          <span className="font-bold">P2ID (Pay-to-ID)</span> note meaning it
          can be only consumed by the account specified as note inputs when
          creating the send transaction. Feel free to read this verified note
          code under the <span className="italic">"Code"</span> tab as it's
          heavily commented and provides insights on the underlying Miden
          architecture.
        </p>
        <p>
          When you're done, click on the decoded note inputs target account ID
          shortcut to navigate to{" "}
          <Link
            href={`/accounts/${walletB?.address}`}
            className="text-primary font-medium underline underline-offset-4"
          >
            Wallet B
          </Link>
          .
        </p>
      </>
    );
  },
  NextStepButton: () => {
    const { nextTutorialStep } = useTutorials();
    return <NextStepButton onClick={nextTutorialStep} />;
  },
};

const TransferAssetsBetweenWalletsStep4 = {
  title: "Consume the output note.",
  Content: () => {
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === walletB?.address
    );
    return (
      <>
        <p>
          The next step to finish our transfer is to consume the output note
          with the intended target account.
        </p>
        <p>
          From{" "}
          <Link
            href={`/accounts/${walletB?.address}`}
            className="text-primary font-medium underline underline-offset-4"
          >
            Wallet B
          </Link>{" "}
          page, take a look at the{" "}
          <span className="italic">"Consumable Notes"</span> section and see how
          we automatically detected the <span className="font-bold">P2ID</span>{" "}
          output note as consumable by its recipient.
        </p>
        <p>
          Click on the <span className="italic">"Consume all notes"</span>{" "}
          button to trigger a consume note transaction. In this scenario we have
          only one consumable note, but we could consume an arbitrary number of
          notes in a single transaction.
        </p>
        <p>
          The preview dialog will let you validate the assets changes about to
          occur, then click <span className="italic">"Submit"</span> to finalize
          the transfer.
        </p>
        <Alert>
          {transaction ? (
            <CircleCheckBig color="var(--color-green-500)" />
          ) : (
            <CircleAlert />
          )}
          <AlertTitle>
            {transaction
              ? "The note has been consumed."
              : "Action required: Consume the note."}
          </AlertTitle>
          {!transaction && (
            <AlertDescription>
              Click on "Consume all notes", preview and submit the resulting
              transaction.
            </AlertDescription>
          )}
        </Alert>
      </>
    );
  },
  NextStepButton: () => {
    const { nextTutorialStep } = useTutorials();
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === walletB?.address
    );
    return (
      <NextStepButton disabled={!transaction} onClick={nextTutorialStep} />
    );
  },
};

const TransferAssetsBetweenWalletsStep5 = {
  title: "Confirm assets have been transferred.",
  Content: () => {
    const { accounts } = useAccounts();
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    return (
      <>
        <p>
          You should now see{" "}
          <Link
            href={`/accounts/${walletB?.address}`}
            className="text-primary font-medium underline underline-offset-4"
          >
            Wallet B
          </Link>{" "}
          having the transferred amount of MDN tokens under its Assets table.
        </p>
        <p>
          Congratulations! You have successfully used the Miden Playground to
          transfer assets between two wallets.
        </p>
        <p>
          You have performed basic Miden rollup operations like submitting
          proofs of transactions, generating and consuming notes.
        </p>
      </>
    );
  },
  NextStepButton: () => {
    //const { startTutorial } = useTutorials();
    const { resetState } = useGlobalContext();
    const router = useRouter();
    /* return (
      <NextStepButton
        text="Next tutorial"
        onClick={() => startTutorial("transfer-assets-between-wallets")}
      />
    ); */
    return (
      <NextStepButton
        text="Back to tutorials list"
        onClick={() => {
          resetState();
          router.push("/");
        }}
      />
    );
  },
};

/* const SwapAssetsStep1 = {
  title: "",
  Content: () => {
    return (
      <>
        <p>TODO</p>
      </>
    );
  },
  NextStepButton: () => {
    return <NextStepButton disabled onClick={() => {}} />;
  },
}; */

const tutorials: Tutorial[] = [
  {
    id: "create-and-fund-wallet",
    title: "Create and fund wallet",
    tagline: "Create a new wallet and fund it using a faucet.",
    description:
      "In this first tutorial, we'll create a new wallet and discover how to fund it by creating your first Miden transactions.",
    initialRoute: "/accounts",
    storeDump: JSON.stringify(tutorial1StoreDump),
    state: JSON.stringify(tutorial1State),
    steps: [
      CreateAndFundWalletStep1,
      CreateAndFundWalletStep2,
      CreateAndFundWalletStep3,
      CreateAndFundWalletStep4,
      CreateAndFundWalletStep5,
      CreateAndFundWalletStep6,
    ],
  },
  {
    id: "transfer-assets-between-wallets",
    title: "Transfer assets between wallets",
    tagline: "Transfer tokens between 2 different wallets.",
    description:
      "This tutorial focuses on learning how to transfer assets between 2 wallets.",
    initialRoute: "/accounts",
    storeDump: JSON.stringify(tutorial2StoreDump),
    state: JSON.stringify(tutorial2State),
    steps: [
      TransferAssetsBetweenWalletsStep1,
      TransferAssetsBetweenWalletsStep2,
      TransferAssetsBetweenWalletsStep3,
      TransferAssetsBetweenWalletsStep4,
      TransferAssetsBetweenWalletsStep5,
    ],
  },
  /* {
    id: "swap-assets",
    title: "Swap assets",
    tagline: "Swap an asset for another.",
    description: "Learn how to perform a simple swap on Miden.",
    initialRoute: "/accounts",
    storeDump: JSON.stringify(tutorial3StoreDump),
    state: JSON.stringify(tutorial3State),
    steps: [SwapAssetsStep1],
  }, */
];

export default tutorials;
