import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/tutorial12/step2.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  return pathname === `/accounts/${multisig?.identifier}`;
};

const Step2: TutorialStep = {
  title: "Deploy a new guardian.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Deploy a guardian"
          titleWhenCompleted="Your guardian has been deployed."
          description={
            <p>
              Click on the <em>"Create new account"</em> button and deploy a new
              Miden Guardian secured wallet then navigate to your account
              details page.
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

export default Step2;
