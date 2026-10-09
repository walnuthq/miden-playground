import { useRouter } from "next/navigation";
import { EllipsisVertical } from "lucide-react";
import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step5Content from "@/components/tutorials/wallet-backup-using-miden-guardian/step5.mdx";
import useTutorials from "@/hooks/use-tutorials";

const useCompleted = () => {
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const nonce = multisig?.nonce ?? 0;
  return nonce > 0;
};

const Step5: TutorialStep = {
  title: "Sign and execute the proposal.",
  Content: () => {
    const completed = useCompleted();
    const { multisigs } = useAccounts();
    const [multisig] = multisigs;
    return (
      <>
        <Step5Content account={multisig} />
        <TutorialAlert
          completed={completed}
          title="Action required: Sign and execute the proposal."
          titleWhenCompleted="Your proposal has been executed."
          description={
            <p>
              In the <em>"Guardian"</em> tab of your guardian wallet, click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button in the
              proposal row and select <em>"Sign proposal"</em>, then{" "}
              <em>"Execute proposal"</em>.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const router = useRouter();
    const { disconnect } = useWallet();
    const { multisigs, deleteAccount } = useAccounts();
    const { nextTutorialStep } = useTutorials();
    const completed = useCompleted();
    return (
      <NextStepButton
        disabled={!completed}
        onClick={() => {
          nextTutorialStep();
          const [multisig] = multisigs;
          if (multisig) {
            disconnect();
            deleteAccount(multisig.id);
            router.push("/accounts");
          }
        }}
      />
    );
  },
};

export default Step5;
