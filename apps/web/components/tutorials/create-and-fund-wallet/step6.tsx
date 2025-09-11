import { useRouter } from "next/navigation";
import { type TutorialStep } from "@/lib/types";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step6Content from "@/components/tutorials/create-and-fund-wallet/step6.mdx";
import useGlobalContext from "@/components/global-context/hook";

const Step6: TutorialStep = {
  title: "Confirm your wallet is funded.",
  Content: () => {
    return <Step6Content />;
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

export default Step6;
