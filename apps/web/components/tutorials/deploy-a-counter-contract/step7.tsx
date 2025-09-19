import { useRouter } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step7Content from "@/components/tutorials/deploy-a-counter-contract/step7.mdx";

const Step7: TutorialStep = {
  title: "Refresh the counter value.",
  Content: Step7Content,
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

export default Step7;
