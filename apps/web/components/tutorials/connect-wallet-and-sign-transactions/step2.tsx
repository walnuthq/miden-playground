import { EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import MintButton from "@/components/tutorials/connect-wallet-and-sign-transactions/mint-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import useTutorials from "@/hooks/use-tutorials";
import {
  midenFaucetAccountId,
  midenFaucetFunderAccountId,
  P2ID_NOTE_CODE,
} from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const { connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const note = inputNotes.find(
    ({ fungibleAssets, senderId, scriptRoot, storage, state, type }) =>
      fungibleAssets.some(
        ({ faucetId }) => faucetId === midenFaucetAccountId(networkId),
      ) &&
      senderId === midenFaucetFunderAccountId(networkId) &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1] ?? "", storage[0] ?? "") ===
        connectedWallet?.id &&
      state === "consumed-external" &&
      type === "public",
  );
  return !!note;
};

const Step2: TutorialStep = {
  title: "Request tokens from the USDCx Faucet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Now that your wallet is connected, let's fund it by requesting tokens
          from the public{" "}
          <ExternalLink href="https://faucet.testnet.miden.io/">
            USDCx Faucet
          </ExternalLink>
          .
        </p>
        <p>
          Click the <em>"Mint"</em> button to request <strong>10 USDCx</strong>{" "}
          from the faucet. They are sent to your wallet in a public note.
        </p>
        <MintButton />
        <p>
          Once the request completes, wait a few more seconds for the Note sent
          by the USDCx Faucet to be committed on testnet.
        </p>
        <p>
          The Note containing your tokens then automatically appears in the{" "}
          <em>"Consumable Notes"</em> section of your wallet.
        </p>
        <p>
          By default, Bread Wallet automatically consumes the Notes it receives,
          so unless you disabled this option, the Note should disappear a few
          seconds later, once it has been consumed.
        </p>
        <p>
          If you disabled auto-consume, click the{" "}
          <EllipsisVertical className="size-4 inline" /> icon button in the{" "}
          <em>"Consumable Notes"</em> table and select{" "}
          <em>"Consume note with …"</em> to consume the Note with your wallet. A{" "}
          <em>"Confirm Transaction"</em> modal from Bread Wallet will ask you to
          sign the consume transaction, which moves the tokens into your
          wallet's vault.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Request tokens from the faucet."
          titleWhenCompleted="Your wallet has been funded."
          description={
            <p>
              Click the <em>"Mint"</em> button to request tokens from the USDCx
              Faucet. Once the Note has been committed on testnet and consumed
              by your wallet, you can proceed to the next step.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    const { wallets, connectedWallet, newWallet } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    const [creatingWallet, setCreatingWallet] = useState(false);
    const recipient = wallets.find(
      ({ address }) => connectedWallet && address !== connectedWallet.address,
    );
    return (
      <NextStepButton
        text={creatingWallet ? "Creating wallet…" : undefined}
        disabled={!completed || creatingWallet}
        onClick={async () => {
          // Every user gets their own recipient wallet: a shared one piles up
          // unconsumed notes that make the client slower to sync.
          if (!recipient) {
            setCreatingWallet(true);
            try {
              await newWallet({
                name: "Test Wallet",
                storageMode: "public",
                fund: false,
              });
            } catch (error) {
              console.error(error);
              toast.error("Failed to create the recipient wallet.", {
                description:
                  error instanceof Error ? error.message : String(error),
              });
              return;
            } finally {
              setCreatingWallet(false);
            }
          }
          nextTutorialStep();
        }}
      />
    );
  },
};

export default Step2;
