import { usePathname } from "next/navigation";
import type { TutorialStep } from "@/lib/types/tutorial";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step4Content from "@/components/tutorials/foreign-procedure-invocation/step4.mdx";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const pathname = usePathname();
  const { accounts } = useAccounts();
  const countReader = accounts.find(({ components }) =>
    components.includes("count-reader"),
  );
  return pathname === `/accounts/${countReader?.identifier}`;
};

const Step4: TutorialStep = {
  title: "Deploy the Count Reader contract.",
  Content: () => {
    const { accounts } = useAccounts();
    const countReader = accounts.find(({ components }) =>
      components.includes("count-reader"),
    );
    const completed = useCompleted();
    return (
      <>
        <Step4Content countReader={countReader} />
        <TutorialAlert
          completed={completed}
          title="Action required: Deploy a Count Reader contract."
          titleWhenCompleted="You deployed a Count Reader contract."
          description={
            <p>
              Click on the <em>"Create new account"</em> button and deploy an{" "}
              account using the <strong>Count Reader</strong> component, then
              click on its account ID.
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

export default Step4;
