import { useRouter } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step6Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step6.mdx";

const Step6: TutorialStep = {
  title: "Check your wallet activity.",
  Content: () => <Step6Content />,
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

export default Step6;
