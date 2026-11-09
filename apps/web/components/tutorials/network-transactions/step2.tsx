import { Plus } from "lucide-react";
import MissingScriptsAlert from "@/components/tutorials/network-transactions/missing-scripts-alert";
import useNetworkCounter, {
  COUNTER_SLOT_NAME,
} from "@/components/tutorials/network-transactions/use-network-counter";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ButtonName, InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";
import { entryPointExport } from "@/lib/utils/script";

// The network counter's allowlist records the increment-note script by its
// root, the digest of the script's entry point.
const useCompleted = () => {
  const { noteScript, counter } = useNetworkCounter();
  const noteScriptRoot = noteScript
    ? entryPointExport(noteScript)?.digest
    : undefined;
  const allowedNoteScripts = counter?.storage.find(
    ({ name }) =>
      name === "miden::standards::auth::network_account::allowed_note_scripts",
  );
  const allowedNoteScript = noteScriptRoot
    ? allowedNoteScripts?.mapEntries.find(({ key }) => key === noteScriptRoot)
    : undefined;
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
        <MissingScriptsAlert />
        <p>
          Let's start by deploying the network counter. Head to the{" "}
          <TutorialLink href="/accounts">accounts page</TutorialLink>, click the{" "}
          <ButtonName icon={Plus}>Create new account</ButtonName> button at the
          top of the page and select the <em>"Deploy account"</em> option.
        </p>
        <p>
          Enter a name for your contract and leave the storage mode set to{" "}
          <strong>Public</strong>. Select <strong>Network Account</strong> as
          the authentication component and the <strong>Counter Contract</strong>{" "}
          account component.
        </p>
        <p>
          An Account is a network account, one that the network transaction
          builder executes Transactions against, if and only if it is{" "}
          <strong>Public</strong> and uses the <strong>Network Account</strong>{" "}
          authentication component. This component holds an allowlist of the
          note scripts the network transaction builder may execute against the
          Account.
        </p>
        <p>
          Select <strong>increment-note</strong> as the allowed note script and
          leave the allowed transaction scripts empty. The Playground also
          allows the <strong>P2ID</strong> note script, so that the Account can
          be funded.
        </p>
        <p>
          Once the account component is selected, its{" "}
          <strong className="wrap-anywhere">
            <InlineCode>{COUNTER_SLOT_NAME}</InlineCode>
          </strong>{" "}
          storage slot is listed with its default value, <strong>1:0</strong>:
          the count, <strong>0</strong>, under key <strong>1</strong>. Keep it,
          so that the counter starts at <strong>0</strong>.
        </p>
        <p>
          Finally, click the <em>"Deploy"</em> button. This takes a few moments:
          the Playground creates the Account, then funds it so that it can pay
          transaction fees. Funding the Account is its first Transaction, which
          also registers it on testnet.
        </p>
        <p>
          Once a network account is registered, the network rejects Transactions
          submitted by users that directly update it: unlike the counter
          contract from the previous tutorials, which used the{" "}
          <strong>No Auth</strong> authentication component, you can't increment
          the network counter by invoking its procedures. Instead, users
          interact with it through network notes.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Deploy your network counter."
          titleWhenCompleted="You deployed your network counter."
          description={
            <p>
              Click the <ButtonName icon={Plus}>Create new account</ButtonName>{" "}
              button at the top of the accounts page, select the{" "}
              <em>"Deploy account"</em> option and deploy a{" "}
              <strong>Public</strong> account using the{" "}
              <strong>Network Account</strong> authentication component, the{" "}
              <strong>Counter Contract</strong> account component and the{" "}
              <strong>increment-note</strong> allowed note script.
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
