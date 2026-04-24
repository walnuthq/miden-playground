import { EllipsisVertical } from "lucide-react";
import type { TutorialStep } from "@/lib/types/tutorial";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/tutorial3/step3.mdx";
import {
  P2ID_NOTE_CODE,
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  midenFaucetAccountId,
} from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";
import { parseAmount } from "@/lib/utils/asset";

const useCompleted = () => {
  const { networkId } = useNetwork();
  const { connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const [note] = inputNotes
    .filter(
      ({ fungibleAssets, senderId, scriptRoot, storage, type }) =>
        fungibleAssets.some(
          ({ faucetId, amount }) =>
            faucetId === midenFaucetAccountId(networkId) &&
            amount ===
              parseAmount("100", FUNGIBLE_FAUCET_DEFAULT_DECIMALS).toString(),
        ) &&
        senderId === midenFaucetAccountId(networkId) &&
        scriptRoot === P2ID_NOTE_CODE &&
        accountIdFromPrefixSuffix(storage[1]!, storage[0]!) ===
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
