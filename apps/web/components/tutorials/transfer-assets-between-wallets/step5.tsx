import { useRouter } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step5Content from "@/components/tutorials/transfer-assets-between-wallets/step5.mdx";

const Step5: TutorialStep = {
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

export default Step5;
