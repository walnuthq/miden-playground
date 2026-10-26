import { usePathname } from "next/navigation";
import AccountAddress from "@/components/lib/account-address";
import CopyButton from "@/components/lib/copy-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { counterContractAddress } from "@/lib/constants";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";
import { getIdentifierPart } from "@/lib/utils/account";

const useCompleted = () => {
  const pathname = usePathname();
  const { networkId } = useNetwork();
  return (
    pathname ===
    `/accounts/${getIdentifierPart(counterContractAddress(networkId))}`
  );
};

const Step4Content = ({
  counter,
  withLink,
}: {
  counter: Pick<Account, "name" | "address" | "identifier">;
  withLink: boolean;
}) => (
  <>
    <p>
      Now that you understand how the counter contract's procedures are
      implemented, let's import the contract into the Playground to interact
      with it.
    </p>
    <p>
      Head to the <TutorialLink href="/accounts">accounts page</TutorialLink>,
      click the <em>"Create new account"</em> button at the top of the page and
      select the <em>"Import account"</em> option.
    </p>
    <p>
      A dialog asks you for the name and address of the Account to import. Enter
      the counter contract details below:
    </p>
    <BulletList>
      <li>
        <p>
          <strong>Name</strong>: Counter Contract{" "}
          <CopyButton content="Copy Account Name" copy="Counter Contract" />
        </p>
      </li>
      <li>
        <p>
          <strong>Address</strong>:
        </p>
      </li>
    </BulletList>
    <AccountAddress account={counter} withLink={withLink} />
    <p>
      Once the contract is imported,{" "}
      {withLink ? (
        <TutorialLink href={`/accounts/${counter?.identifier}`}>
          click its name
        </TutorialLink>
      ) : (
        "click its name"
      )}{" "}
      on the accounts page to open its details page.
    </p>
  </>
);

const Step4: TutorialStep = {
  title: "Import the counter contract.",
  Content: () => {
    const { networkId } = useNetwork();
    const { accounts } = useAccounts();
    const counter = accounts.find(
      ({ address }) => address === counterContractAddress(networkId),
    );
    const completed = useCompleted();
    return (
      <>
        <Step4Content
          counter={{
            name: "Counter Contract",
            address: counterContractAddress(networkId),
            identifier: getIdentifierPart(counterContractAddress(networkId)),
          }}
          withLink={!!counter}
        />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Import the counter contract."
          titleWhenCompleted="You imported the counter contract."
          description={
            <p>
              Click the <em>"Create new account"</em> button at the top of the
              accounts page and select the <em>"Import account"</em> option to
              import the counter contract into the Playground, then open its
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

export default Step4;
