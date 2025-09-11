import { useRouter } from "next/navigation";
import { type TutorialStep } from "@/lib/types";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step5Content from "@/components/tutorials/interact-with-the-counter-contract/step5.mdx";

const Step5: TutorialStep = {
  title: "Refresh the Counter value.",
  Content: Step5Content,
  NextStepButton: () => {
    const { resetState } = useGlobalContext();
    const router = useRouter();
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
