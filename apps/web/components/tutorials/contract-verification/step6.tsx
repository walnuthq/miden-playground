import { useState } from "react";
import { useInterval } from "usehooks-ts";
import Step6Content from "@/components/tutorials/contract-verification/step6.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { getVerifiedAccountComponents } from "@/lib/api";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const [completed, setCompleted] = useState(false);
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  useInterval(
    () => {
      const checkVerifiedAccountComponents = async () => {
        const { components: verifiedAccountComponents = [] } =
          await getVerifiedAccountComponents({
            networkId,
            code: counter?.code ?? "",
          });
        setCompleted(verifiedAccountComponents.length > 0);
      };
      checkVerifiedAccountComponents();
    },
    completed ? null : 5000,
  );
  return completed;
};

const Step6: TutorialStep = {
  title: "Verify the imported contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step6Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Verify the imported contract."
          titleWhenCompleted="You verified the imported contract."
          description={
            <p>
              On the imported contract's <em>"Components"</em> tab, click the{" "}
              <em>"Verify account component"</em> button and upload the folder
              you extracted from the exported script.
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

export default Step6;
