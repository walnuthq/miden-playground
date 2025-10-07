import { EllipsisVertical } from "lucide-react";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { useInterval } from "usehooks-ts";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial3/step3.mdx";

const useCompleted = () => {
  const { accountId } = useWallet();
  const { wallets } = useAccounts();
  const wallet = wallets.find(({ address }) => address === accountId);
  return wallet?.consumableNoteIds.length === 0;
};

const Step3: TutorialStep = {
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
      wallet && wallet.consumableNoteIds.length > 0 ? 1000 : null
    );
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={completed}
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
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step3;
