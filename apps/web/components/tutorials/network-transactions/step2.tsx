import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/network-transactions/step2.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import {
  COUNTER_NOTE_RUN_PROC_HASH,
  COUNTER_SCRIPT_RUN_PROC_HASH,
} from "@/lib/constants";

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
  const allowedTxScripts = counter?.storage.find(
    ({ name }) =>
      name === "miden::standards::auth::network_account::allowed_tx_scripts",
  );
  return (
    allowedNoteScripts?.mapEntries[0]?.key === COUNTER_NOTE_RUN_PROC_HASH &&
    allowedNoteScripts?.mapEntries[0]?.value ===
      "0x0100000000000000000000000000000000000000000000000000000000000000" &&
    allowedTxScripts?.mapEntries[0]?.key === COUNTER_SCRIPT_RUN_PROC_HASH &&
    allowedTxScripts?.mapEntries[0]?.value ===
      "0x0100000000000000000000000000000000000000000000000000000000000000"
  );
};

const Step2: TutorialStep = {
  title: "Deploy a network Counter smart contract.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Deploy a network Counter."
          titleWhenCompleted="You deployed a network Counter."
          description={
            <p>
              Click on the <em>"Create new account"</em> button and deploy a
              network account by selecting the <strong>Network</strong> storage
              mode. Use the <strong>NoAuth</strong> authentication scheme and
              the <strong>Counter Contract</strong> component.
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
