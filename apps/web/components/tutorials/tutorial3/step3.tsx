import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial3/step3.mdx";
import {
  MIDEN_FAUCET_ACCOUNT_ID,
  P2ID_NOTE_CODE,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
} from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";
import { parseAmount } from "@/lib/utils";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const [note] = inputNotes
    .filter(
      ({ fungibleAssets, senderId, scriptRoot, inputs, type }) =>
        fungibleAssets.some(
          ({ faucetId, amount }) =>
            faucetId === MIDEN_FAUCET_ACCOUNT_ID &&
            amount ===
              parseAmount("100", FUNGIBLE_FAUCET_DEFAULT_DECIMALS).toString(),
        ) &&
        senderId === MIDEN_FAUCET_ACCOUNT_ID &&
        scriptRoot === P2ID_NOTE_CODE &&
        accountIdFromPrefixSuffix(inputs[1]!, inputs[0]!) ===
          connectedWallet?.id &&
        type === "public",
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return note?.state === "consumed-external";
};

const Step3: TutorialStep = {
  title: "Consume the requested tokens note.",
  Content: () => {
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
