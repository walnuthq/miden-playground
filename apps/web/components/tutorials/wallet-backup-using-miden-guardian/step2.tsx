import { usePathname } from "next/navigation";
import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/wallet-backup-using-miden-guardian/step2.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  return pathname === `/accounts/${multisig?.identifier}`;
};

const Step2: TutorialStep = {
  title: "Deploy a guardian wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Deploy a guardian wallet."
          titleWhenCompleted="Your guardian wallet has been deployed."
          description={
            <p>
              Click the <em>"Create new account"</em> button, select{" "}
              <em>"Deploy guardian wallet"</em>, then open its details page.
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
