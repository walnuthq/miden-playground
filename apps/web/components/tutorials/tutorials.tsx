import { useRouter } from "next/navigation";
import Image from "next/image";
import { type Tutorial, type TutorialStep } from "@/lib/types";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import useTutorials from "@/hooks/use-tutorials";
import useTransactions from "@/hooks/use-transactions";
import tutorial1StoreDump from "@/components/tutorials/tutorial1-store.json";
import tutorial1State from "@/components/tutorials/tutorial1-state.json";
import tutorial2StoreDump from "@/components/tutorials/tutorial2-store.json";
import tutorial2State from "@/components/tutorials/tutorial2-state.json";
import tutorial3StoreDump from "@/components/tutorials/tutorial3-store.json";
import tutorial3State from "@/components/tutorials/tutorial3-state.json";

const CreateAndFundWalletStep1: TutorialStep = {
  content: (
    <div className="flex flex-col gap-4">
      <p>
        An Account represents the primary entity of the protocol. Capable of
        holding assets, storing data, and executing custom code. Each Account is
        a specialized smart contract providing a programmable interface for
        interacting with its state and assets.
      </p>
      <p>
        Users can choose whether their Accounts are stored publicly or
        privately. The storage mode is chosen during Account creation, it cannot
        be changed later.
      </p>
      <p>
        For the purpose of this tutorial, let's create a public wallet Account
        and fund it using a Fungible faucet. Click on the "Create new account"
        button to generate a wallet Account.
      </p>
    </div>
  ),
  NextStepButton: () => {
    const router = useRouter();
    const { wallets } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    const wallet = wallets.find(() => true);
    return (
      <Button
        disabled={!wallet}
        onClick={() => {
          nextTutorialStep();
          router.push(`/accounts/${wallet?.address}`);
        }}
      >
        Next step
      </Button>
    );
  },
};

const CreateAndFundWalletStep2 = {
  content: (
    <div className="flex flex-col gap-4">
      <p>
        Our newly created Account generated its own unique Account ID, an
        immutable and unique identifier for the Account. Account type, storage
        mode, and version are included in the ID, to ensure these properties can
        be determined without additional computation. Anyone can immediately
        tell those properties by just looking at the ID in bit representation.
      </p>
      <p>
        Let's fund our Account by requesting test tokens from a pre-existing
        fungible faucet.
      </p>
    </div>
  ),
  NextStepButton: () => {
    const router = useRouter();
    const { faucets } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    return (
      <Button
        onClick={() => {
          nextTutorialStep();
          const faucet = faucets.find(({ name }) => name === "MID Faucet");
          router.push(`/accounts/${faucet?.address}`);
        }}
      >
        Next step
      </Button>
    );
  },
};

const CreateAndFundWalletStep3 = {
  content: (
    <div className="flex flex-col gap-4">
      <p>
        Click on the "Create new transaction" button then select "New mint
        transaction" to initiate your mint request.
      </p>
      <p>
        A "Configure mint transaction" dialog will show up where you can select
        the target account (our newly created wallet) and an arbitrary amount
        eg. 1000 tokens.
      </p>
      <p>
        Note type refers to the privacy mode of the transaction you're about to
        create, it can be either private (known only to you) or publicly
        available on-chain. Leave it as it is and proceed with the preview of
        the mint transaction.
      </p>
      <p>
        The preview step shows a quick summary of the changes about to be
        performed on the executing Account (in this case the MID Faucet). When
        you're ready to execute the transaction click on "Submit".
      </p>
    </div>
  ),
  NextStepButton: () => {
    const router = useRouter();
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const { nextTutorialStep } = useTutorials();
    const faucet = faucets.find(({ name }) => name === "MID Faucet");
    const transaction = transactions.find(
      ({ record }) => record.accountId().toString() === faucet?.id
    );
    return (
      <Button
        disabled={!transaction}
        onClick={() => {
          nextTutorialStep();
          router.push(`/transactions/${transaction?.record.id().toHex()}`);
        }}
      >
        Next step
      </Button>
    );
  },
};

const CreateAndFundWalletStep4 = {
  content: (
    <div className="flex flex-col gap-4">
      <p>
        A Transaction in Miden is the state transition of a single account. A
        Transaction takes as input a single account and zero or more notes, and
        outputs the same account with an updated state, together with zero or
        more notes.
      </p>
      <Image
        src="/img/transaction-diagram.png"
        alt="Transaction diagram"
        width={842}
        height={600}
      />
      <p>
        Our mint transaction just created an output note that contains our test
        tokens. To actually fund our account we'll need to consume this note to
        transfer these tokens in our wallet.
      </p>
    </div>
  ),
  NextStepButton: () => {
    const router = useRouter();
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const { nextTutorialStep } = useTutorials();
    const faucet = faucets.find(({ name }) => name === "MID Faucet");
    const transaction = transactions.find(
      ({ record }) => record.accountId().toString() === faucet?.id
    );
    const noteId = transaction?.record.outputNotes().getNote(0).id().toString();
    return (
      <Button
        onClick={() => {
          nextTutorialStep();
          router.push(`/notes/${noteId}`);
        }}
      >
        Next step
      </Button>
    );
  },
};

const CreateAndFundWalletStep5 = {
  content: (
    <div className="flex flex-col gap-4">
      <p>
        Our mint transaction has created an output note and we can access the
        note information, in particular we can confirm it holds our requested
        test tokens.
      </p>
      <p>
        Each Note has a script that defines the conditions under which it can be
        consumed. Consumption of a Note can be restricted to certain accounts or
        entities. For instance, the P2ID Note scripts target a specific account
        ID.
      </p>
      <p>
        Our note inputs specify that only our own wallet Account ID can consume
        the note and receive the embedded assets, which has been enforced during
        the note creation process by the faucet.
      </p>
      <p>
        Now it's time to make our wallet Account consume this note, click on
        "Consume note" and submit the resulting transaction. After the
        transaction is submitted, you'll see the note status going from
        "Committed" to "Consumed". A consumed note can no longer be spent to
        avoid double-spending.
      </p>
    </div>
  ),
  NextStepButton: () => {
    const router = useRouter();
    const { wallets } = useAccounts();
    const { transactions } = useTransactions();
    const { nextTutorialStep } = useTutorials();
    const wallet = wallets.find(() => true);
    const transaction = transactions.find(
      ({ record }) => record.accountId().toString() === wallet?.id
    );
    return (
      <Button
        disabled={!transaction}
        onClick={() => {
          nextTutorialStep();
          router.push(`/accounts/${wallet?.address}`);
        }}
      >
        Next step
      </Button>
    );
  },
};

const CreateAndFundWalletStep6 = {
  content: (
    <div className="flex flex-col gap-4">
      <p>
        You should now see your accounts vault containing the funds sent by the
        faucet.
      </p>
      <p>
        Congratulations! You have successfully used the Miden Playground to
        interact with a Miden rollup and faucet.
      </p>
      <p>
        You have performed basic Miden rollup operations like submitting proofs
        of transactions, generating and consuming notes.
      </p>
    </div>
  ),
  NextStepButton: () => {
    const { startTutorial } = useTutorials();
    return (
      <Button onClick={() => startTutorial("transfer-assets-between-wallets")}>
        Next tutorial
      </Button>
    );
  },
};

const TransferAssetsBetweenWalletsStep1 = {
  content: (
    <div className="flex flex-col gap-4">
      <p>TODO</p>
    </div>
  ),
  NextStepButton: () => {
    return <Button disabled>Next step</Button>;
  },
};

const SwapAssetsStep1 = {
  content: (
    <div className="flex flex-col gap-4">
      <p>TODO</p>
    </div>
  ),
  NextStepButton: () => {
    return <Button disabled>Next step</Button>;
  },
};

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
    steps: [TransferAssetsBetweenWalletsStep1],
  },
  {
    id: "swap-assets",
    title: "Swap assets",
    tagline: "Swap an asset for another.",
    description: "Learn how to perform a simple swap on Miden.",
    initialRoute: "/accounts",
    storeDump: JSON.stringify(tutorial3StoreDump),
    state: JSON.stringify(tutorial3State),
    steps: [SwapAssetsStep1],
  },
];

export default tutorials;
