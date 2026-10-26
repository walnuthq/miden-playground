import AccountAddress from "@/components/lib/account-address";
import CopyButton from "@/components/lib/copy-button";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { BulletList, InlineCode } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { EMPTY_WORD } from "@/lib/constants";
import type { Account } from "@/lib/types/account";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";
import { getMapItem } from "@/lib/utils/account";
import { storageSlotName } from "@/lib/utils/component";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  if (!counter) {
    return false;
  }
  const count = getMapItem(
    counter.storage.find(
      ({ name }) =>
        name ===
        storageSlotName({
          packageName: script?.name ?? "",
          traitName: "CounterContract",
          fieldName: "count_map",
        }),
    ),
    "0x0100000000000000000000000000000000000000000000000000000000000000",
  );
  return counter.nonce >= 2 && count === EMPTY_WORD;
};

const Step7Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>
      Now that the contract is verified, its interface is available to everyone,
      and you can call its procedures by name.
    </p>
    <p>
      On the imported contract's <em>"Components"</em> tab, click the{" "}
      <em>"Invoke"</em> button next to the{" "}
      <strong>
        <InlineCode>increment_count</InlineCode>
      </strong>{" "}
      procedure. Once the Transaction is submitted, click the <em>"Invoke"</em>{" "}
      button next to the{" "}
      <strong>
        <InlineCode>reset_count</InlineCode>
      </strong>{" "}
      procedure to set the counter back to zero. You can click the{" "}
      <em>"Invoke"</em> button next to the{" "}
      <strong>
        <InlineCode>get_count</InlineCode>
      </strong>{" "}
      procedure at any time to read the current value of the counter.
    </p>
    <p>
      This verification isn't stored in your browser: the verification service
      keeps it, so anyone can now read the source code of this contract and
      interact with it.
    </p>
    <p>
      To see it for yourself after finishing this tutorial, create a new testnet
      sandbox environment. On the accounts page, click the{" "}
      <em>"Create new account"</em> button, select the <em>"Import account"</em>{" "}
      option and import the contract with the following details:
    </p>
    <BulletList>
      <li>
        <p>
          <strong>Name</strong>: Verified Contract{" "}
          <CopyButton content="Copy Account Name" copy="Verified Contract" />
        </p>
      </li>
      <li>
        <p>
          <strong>Address</strong>:
        </p>
      </li>
    </BulletList>
    <AccountAddress account={counter} withLink={false} />
    <p>
      Congratulations! You discovered what contract verification is all about
      and verified your first contract on the Miden Playground.
    </p>
  </>
);

const Step7: TutorialStep = {
  title: "Interact with the verified contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step7Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Interact with the verified contract."
          titleWhenCompleted="You interacted with the verified contract."
          description={
            <p>
              Click the <em>"Invoke"</em> button next to the{" "}
              <strong>increment_count</strong> procedure, then next to the{" "}
              <strong>reset_count</strong> procedure to set the counter back to
              zero.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextTutorialButton disabled={!completed} />;
  },
};

export default Step7;
