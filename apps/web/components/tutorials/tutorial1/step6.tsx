import { useRouter } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step6Content from "@/components/tutorials/tutorial1/step6.mdx";
import useGlobalContext from "@/components/global-context/hook";

const Step6: TutorialStep = {
  title: "Confirm your wallet is funded.",
  Content: Step6Content,
  NextStepButton: () => {
    //const { startTutorial } = useTutorials();
    const { networkId, resetState } = useGlobalContext();
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
          resetState(networkId);
          router.push("/");
        }}
      />
    );
  },
};

export default Step6;
