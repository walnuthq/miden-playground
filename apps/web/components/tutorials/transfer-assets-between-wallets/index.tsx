import { useRouter } from "next/navigation";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import state from "@/components/tutorials/transfer-assets-between-wallets/state.json";
import storeDump from "@/components/tutorials/transfer-assets-between-wallets/store.json";
import Step1Content from "@/components/tutorials/transfer-assets-between-wallets/step1.mdx";
import Step2Content from "@/components/tutorials/transfer-assets-between-wallets/step2.mdx";
import Step3Content from "@/components/tutorials/transfer-assets-between-wallets/step3.mdx";
import Step4Content from "@/components/tutorials/transfer-assets-between-wallets/step4.mdx";
import Step5Content from "@/components/tutorials/transfer-assets-between-wallets/step5.mdx";

const Step1 = {
  title: "Exploring the accounts.",
  Content: () => {
    const { accounts } = useAccounts();
    const walletA = accounts.find(({ name }) => name === "Wallet A");
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const faucet = accounts.find(({ name }) => name === "MDN Faucet");
    return (
      <>
        <Step1Content walletA={walletA} walletB={walletB} faucet={faucet} />
        <TutorialAlert
          title="Explore the accounts"
          description="Click on each account to explore its current state. Confirm that
            Wallet A holds 1000 MDN tokens and Wallet B has no assets."
        />
      </>
    );
  },
};

const Step2 = {
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
        <Step2Content walletA={walletA} walletB={walletB} />
        <TutorialAlert
          completed={!!transaction}
          title="Action required: Submit a send transaction."
          titleWhenCompleted="Your send transaction is submitted."
          description="Follow the instructions above to create and submit a send
            transaction against Wallet A."
        />
      </>
    );
  },
  NextStepButton: () => {
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletA = accounts.find(({ name }) => name === "Wallet A");
    const transaction = transactions.find(
      ({ accountAddress, outputNotes }) =>
        accountAddress === walletA?.address && outputNotes.length === 1
    );
    return <NextStepButton disabled={!transaction} />;
  },
};

const Step3 = {
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
      <Step3Content transaction={transaction} note={note} walletB={walletB} />
    );
  },
};

const Step4 = {
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
        <Step4Content walletB={walletB} />
        <TutorialAlert
          completed={!!transaction}
          title="Action required: Consume the note."
          titleWhenCompleted="The note has been consumed."
          description={
            <p>
              Click on <em>"Consume all notes"</em>, preview and submit the
              resulting transaction.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { accounts } = useAccounts();
    const { transactions } = useTransactions();
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    const transaction = transactions.find(
      ({ accountAddress }) => accountAddress === walletB?.address
    );
    return <NextStepButton disabled={!transaction} />;
  },
};

const Step5 = {
  title: "Confirm assets have been transferred.",
  Content: () => {
    const { accounts } = useAccounts();
    const walletB = accounts.find(({ name }) => name === "Wallet B");
    return <Step5Content walletB={walletB} />;
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

export default {
  id: "transfer-assets-between-wallets",
  title: "Transfer assets between wallets",
  tagline: "Transfer tokens between 2 different wallets.",
  description:
    "This tutorial focuses on learning how to transfer assets between 2 wallets.",
  initialRoute: "/accounts",
  storeDump: JSON.stringify(storeDump),
  state: JSON.stringify(state),
  steps: [Step1, Step2, Step3, Step4, Step5],
};
