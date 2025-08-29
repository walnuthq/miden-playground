import { useRouter, usePathname } from "next/navigation";
import { EllipsisVertical } from "lucide-react";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { useInterval } from "usehooks-ts";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import state from "@/components/tutorials/connect-wallet-and-sign-transactions/state.json";
import storeDump from "@/components/tutorials/connect-wallet-and-sign-transactions/store.json";
import Step1Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step1.mdx";
import Step2Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step2.mdx";
import Step3Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step3.mdx";
import Step4Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step4.mdx";
import Step5Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step5.mdx";
import Step6Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step6.mdx";

const Step1 = {
  title: "Connect your wallet to testnet.",
  Content: () => {
    const pathname = usePathname();
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ address }) => address === accountId);
    return (
      <>
        <Step1Content wallet={wallet} />
        <TutorialAlert
          completed={pathname === `/accounts/${wallet?.address}`}
          title="Action required: Connect your wallet."
          titleWhenCompleted="Your wallet is connected and imported."
          description={
            <p>
              Click on the <em>"Select Wallet"</em> button in the top-right
              corner and connect your Miden Wallet to the Playground, then once
              imported, navigate to your account details page.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const pathname = usePathname();
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ address }) => address === accountId);
    return (
      <NextStepButton disabled={pathname !== `/accounts/${wallet?.address}`} />
    );
  },
};

const Step2 = {
  title: "Mint assets from the Miden Faucet.",
  Content: () => {
    // TODO check note inputs refers to connected wallet
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ address }) => address === accountId);
    const { inputNotes } = useNotes();
    const note = inputNotes.find(
      ({ fungibleAssets, senderAddress, state, type }) =>
        fungibleAssets.some(
          ({ faucetId, amount }) =>
            faucetId === "0x43999c9344b31a206a5464ece82b91" &&
            amount === "100000000",
        ) &&
        senderAddress === "mtst1qppen8yngje35gr223jwe6ptjy7gedn9" &&
        state === "Committed" &&
        type === "Public",
    );
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={!!note}
          title="Action required: Request tokens from the faucet."
          titleWhenCompleted="Your mint note is ready for consumption."
          description={
            <p>
              Click on the <em>"Mint"</em> button to automatically request 100
              tokens from the Miden Faucet. Once the note has been committed on
              the testnet, you will be able to continue the tutorial.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ address }) => address === accountId);
    const { inputNotes } = useNotes();
    const note = inputNotes.find(
      ({ fungibleAssets, senderAddress, state, type }) =>
        fungibleAssets.some(
          ({ faucetId, amount }) =>
            faucetId === "0x43999c9344b31a206a5464ece82b91" &&
            amount === "100000000",
        ) &&
        senderAddress === "mtst1qppen8yngje35gr223jwe6ptjy7gedn9" &&
        state === "Committed" &&
        type === "Public",
    );
    return <NextStepButton disabled={!note} />;
  },
};

const Step3 = {
  title: "Consume the requested tokens note.",
  Content: () => {
    const { accountId } = useWallet();
    const { syncState } = useGlobalContext();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ address }) => address === accountId);
    useInterval(
      () => {
        const waitForSyncState = async () => {
          await syncState();
        };
        waitForSyncState();
      },
      wallet && wallet.consumableNoteIds.length > 0 ? 1000 : null,
    );
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={wallet?.consumableNoteIds.length === 0}
          title="Action required: Consume the mint note."
          titleWhenCompleted="Your wallet has been funded."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the consumable note row in your
              account page details to consume the note with your wallet.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ address }) => address === accountId);
    return <NextStepButton disabled={wallet?.consumableNoteIds.length !== 0} />;
  },
};

const Step4 = {
  title: "Import another wallet in the Playground.",
  Content: () => {
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const recipient = wallets.find(({ address }) => address !== accountId);
    return (
      <>
        <Step4Content
          account={{
            name: "Test Wallet",
            address: "mtst1qz55493mfskajyqjw79gf9pwp5unv79l",
          }}
        />
        <TutorialAlert
          completed={!!recipient}
          title="Action required: Import the recipient wallet."
          titleWhenCompleted="Recipient wallet has been imported."
          description={
            <p>
              Click on the <em>"Create new account"</em> button on top of the
              accounts page and select the <em>"Import account"</em> option to
              import another wallet in the Playground.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { accountId } = useWallet();
    const { wallets } = useAccounts();
    const recipient = wallets.find(({ address }) => address !== accountId);
    return <NextStepButton disabled={!recipient} />;
  },
};

const Step5 = {
  title: "Send tokens to the recipient wallet.",
  Content: () => {
    // TODO completed
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={false}
          title="Action required: Send tokens to recipient."
          titleWhenCompleted="Output note with sent tokens created."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on your wallet row in the accounts page and select the{" "}
              <em>"New send transaction"</em> option. Configure and sign a send
              transaction to the recipient wallet to finish this tutorial.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    // TODO disabled
    return <NextStepButton disabled={false} />;
  },
};

const Step6 = {
  title: "Check your wallet activity.",
  Content: () => <Step6Content />,
  NextStepButton: () => {
    const { resetState } = useGlobalContext();
    const router = useRouter();
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
  id: "connect-wallet-and-sign-transactions",
  title: "Connect wallet and sign transactions",
  tagline: "Connect your Miden Wallet and sign transactions on testnet.",
  description:
    "This tutorial will walk you through connecting your Miden Wallet to the Miden Playground and confirming transactions on Miden testnet.",
  initialRoute: "/accounts",
  storeDump: JSON.stringify(storeDump),
  state: JSON.stringify(state),
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};
