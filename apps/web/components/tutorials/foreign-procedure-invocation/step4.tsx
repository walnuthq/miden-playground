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
  title: "Deploy your Count Reader contract.",
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
          title="Action required: Deploy your Count Reader contract."
          titleWhenCompleted="You deployed your Count Reader contract."
          description={
            <p>
              Click the <em>"Create new account"</em> button at the top of the
              accounts page, select the <em>"Deploy account"</em> option and
              deploy an Account using the <strong>No Auth</strong>{" "}
              authentication component and the <strong>Count Reader</strong>{" "}
              account component, then click its name.
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
