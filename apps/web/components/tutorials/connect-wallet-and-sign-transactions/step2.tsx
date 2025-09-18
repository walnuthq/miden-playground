import { type TutorialStep } from "@/lib/types/tutorial";
import useNotes from "@/hooks/use-notes";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step2.mdx";
import { MIDEN_FAUCET_ACCOUNT_ID } from "@/lib/constants";

const Step2: TutorialStep = {
  title: "Mint assets from the Miden Faucet.",
  Content: () => {
    // TODO check note inputs refers to connected wallet
    // const { accountId } = useWallet();
    // const { wallets } = useAccounts();
    // const wallet = wallets.find(({ address }) => address === accountId);
    const { inputNotes } = useNotes();
    const note = inputNotes.find(
      ({ fungibleAssets, senderId, state, type }) =>
        fungibleAssets.some(
          ({ faucetId, amount }) =>
            faucetId === MIDEN_FAUCET_ACCOUNT_ID && amount === "100000000"
        ) &&
        senderId === MIDEN_FAUCET_ACCOUNT_ID &&
        state === "committed" &&
        type === "public"
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
    // const { accountId } = useWallet();
    // const { wallets } = useAccounts();
    // const wallet = wallets.find(({ address }) => address === accountId);
    const { inputNotes } = useNotes();
    const note = inputNotes.find(
      ({ fungibleAssets, senderId, state, type }) =>
        fungibleAssets.some(
          ({ faucetId, amount }) =>
            faucetId === MIDEN_FAUCET_ACCOUNT_ID && amount === "100000000"
        ) &&
        senderId === MIDEN_FAUCET_ACCOUNT_ID &&
        state === "committed" &&
        type === "public"
    );
    return <NextStepButton disabled={!note} />;
  },
};

export default Step2;
