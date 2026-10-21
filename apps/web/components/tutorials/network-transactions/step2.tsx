import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/network-transactions/step2.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import { COUNTER_NOTE_RUN_PROC_HASH } from "@/lib/constants";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) =>
      !defaultComponentIds.includes(id) && type === "account-component",
  );
  const counter = accounts.find(
    ({ components, isPublic }) =>
      components.includes(component?.id ?? "") &&
      isPublic &&
      components.includes("auth-network-account"),
  );
  const allowedNoteScripts = counter?.storage.find(
    ({ name }) =>
      name === "miden::standards::auth::network_account::allowed_note_scripts",
  );
  const allowedNoteScript = allowedNoteScripts?.mapEntries.find(
    ({ key }) => key === COUNTER_NOTE_RUN_PROC_HASH,
  );
  return (
    allowedNoteScript?.value ===
    "0x0100000000000000000000000000000000000000000000000000000000000000"
  );
};

const Step2: TutorialStep = {
  title: "Deploy your network counter.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Deploy your network counter."
          titleWhenCompleted="You deployed your network counter."
          description={
            <p>
              Click the <em>"Create new account"</em> button at the top of the
              accounts page, select the <em>"Deploy account"</em> option and
              deploy a <strong>Public</strong> account using the{" "}
              <strong>Network Account</strong> authentication component, the{" "}
              <strong>Counter Contract</strong> account component and the{" "}
              <strong>counter-note</strong> allowed note script.
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
