import { useRouter } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step5Content from "@/components/tutorials/tutorial4/step5.mdx";

const Step5: TutorialStep = {
  title: "Refresh the counter value.",
  Content: Step5Content,
  NextStepButton: () => {
    const { networkId, resetState } = useGlobalContext();
    const router = useRouter();
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

export default Step5;
