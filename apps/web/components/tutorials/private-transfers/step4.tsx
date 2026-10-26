import { EllipsisVertical } from "lucide-react";
import NextStepButton from "@/components/tutorials/next-step-button";
import useTransferNote from "@/components/tutorials/private-transfers/use-transfer-note";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const note = useTransferNote();
  return note?.state === "committed" || !!note?.state.startsWith("consumed-");
};

const Step4: TutorialStep = {
  title: "Send tokens privately to your Para Wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Now let's send some tokens from your Bread Wallet to your Para Wallet.
          The send transaction must be signed by the sender, so you first need
          to switch back to Bread Wallet.
        </p>
        <p>
          To disconnect Para Wallet, click the Para button showing your wallet
          address (<em>"0x…"</em>) in the top-right corner to open the Para
          modal. Click the profile icon button, the last of the four buttons
          below your balance, then click <em>"Disconnect"</em> at the bottom of
          the <em>"Profile"</em> view. Your Para Wallet stays listed on the
          accounts page.
        </p>
        <p>
          Then click the <em>"Select Wallet"</em> button, select{" "}
          <em>"Bread Wallet"</em> and accept the connection request to reconnect
          it.
        </p>
        <p>
          On the <TutorialLink href="/accounts">accounts page</TutorialLink>,
          click the <EllipsisVertical className="size-4 inline" /> icon button
          in your Bread Wallet's row and select the{" "}
          <em>"New send transaction"</em> option to open the configuration
          dialog.
        </p>
        <p>
          Select <strong>Para Wallet</strong> as the target account and{" "}
          <strong>USDCX</strong> as the asset, then enter an amount of{" "}
          <strong>at least 1</strong>. USDCx is also the asset used to pay
          transaction fees on testnet: your Para Wallet starts empty, so it pays
          the fee of the consume transaction in the next step with the tokens
          you send it. Don't send much more than that either, as your Bread
          Wallet needs to keep enough USDCx to cover its own fees. Leave the
          note type set to <strong>Private</strong>.
        </p>
        <p>
          Click the <em>"Preview"</em> button: Bread Wallet will ask you to
          confirm the send transaction, which creates a private P2ID output note
          carrying your tokens that only the Para Wallet can consume.
        </p>
        <p>
          For a private note, only its hash and its metadata, such as its
          sender, are stored on-chain: the note details, including the assets it
          carries and its target account, stay off-chain. To let the Para Wallet
          discover and consume it, the encrypted note details are sent through
          the{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/address#communicating-channel-information">
            Note Transport Layer
          </ExternalLink>
          , where the recipient can fetch them.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Send tokens to your Para Wallet."
          titleWhenCompleted="The private note carrying your tokens has been created."
          description={
            <p>
              Disconnect Para Wallet and reconnect Bread Wallet. Then click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button in your
              Bread Wallet's row on the accounts page and select the{" "}
              <em>"New send transaction"</em> option. Send at least 1 USDCx to
              the Para Wallet in a private note, then confirm the Transaction in
              Bread Wallet.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step4;
