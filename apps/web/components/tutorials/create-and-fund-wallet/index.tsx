import { useRouter } from "next/navigation";
import { type Tutorial } from "@/lib/types";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import useNotes from "@/hooks/use-notes";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import store from "@/components/tutorials/create-and-fund-wallet/store";
import state from "@/components/tutorials/create-and-fund-wallet/state";
import Step1Content from "@/components/tutorials/create-and-fund-wallet/step1.mdx";
import Step2Content from "@/components/tutorials/create-and-fund-wallet/step2.mdx";
import Step3Content from "@/components/tutorials/create-and-fund-wallet/step3.mdx";
import Step4Content from "@/components/tutorials/create-and-fund-wallet/step4.mdx";
import Step5Content from "@/components/tutorials/create-and-fund-wallet/step5.mdx";
import Step6Content from "@/components/tutorials/create-and-fund-wallet/step6.mdx";

const Step1 = {
  title: "Create your first wallet Account.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={!!wallet}
          title="Action required: Create your first public wallet."
          titleWhenCompleted="Your first wallet is created."
          description={
            <p>
              Click on the <em>"Create new account"</em> button then select the{" "}
              <em>"Create new wallet"</em> option to generate a wallet Account.{" "}
              <strong>Make sure to create a public wallet.</strong>
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return <NextStepButton disabled={!wallet} />;
  },
};

const Step2 = {
  title: "Discover your new wallet details.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return <Step2Content wallet={wallet} />;
  },
};

const Step3 = {
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
        <Step3Content faucet={faucet} />
        <TutorialAlert
          completed={!!transaction}
          title="Action required: Submit a mint transaction."
          titleWhenCompleted="Your mint transaction is submitted."
          description="Follow the instructions above to create and submit a mint
            transaction against the faucet."
        />
      </>
    );
  },
  NextStepButton: () => {
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === faucet?.address
    );
    return <NextStepButton disabled={!transaction} />;
  },
};

const Step4 = {
  title: "Analyze the mint transaction.",
  Content: () => {
    const { faucets } = useAccounts();
    const { transactions } = useTransactions();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === faucet?.address
    );
    return <Step4Content transaction={transaction} />;
  },
};

const Step5 = {
  title: "Consume the output note.",
  Content: () => {
    const { wallets, faucets } = useAccounts();
    const { transactions } = useTransactions();
    const { inputNotes } = useNotes();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === wallet?.address
    );
    const note = inputNotes.find(
      ({ senderAddress }) => senderAddress === faucet?.address
    );
    return (
      <>
        <Step5Content note={note} />
        <TutorialAlert
          completed={!!transaction}
          title="Action required: Consume the note."
          titleWhenCompleted="The note has been consumed."
          description={
            <p>
              Click on <em>"Consume note with {wallet?.name}"</em>, preview and
              submit the resulting transaction.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { wallets } = useAccounts();
    const { transactions } = useTransactions();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === wallet?.address
    );
    return <NextStepButton disabled={!transaction} />;
  },
};

const Step6 = {
  title: "Confirm your wallet is funded.",
  Content: () => {
    return <Step6Content />;
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

const tutorial: Tutorial = {
  id: "create-and-fund-wallet",
  title: "Create and fund wallet",
  tagline: "Create a new wallet and fund it using a faucet.",
  description:
    "In this first tutorial, we'll create a new wallet and discover how to fund it by creating your first Miden transactions.",
  initialRoute: "/accounts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
