import { usePathname } from "next/navigation";
import NextStepButton from "@/components/tutorials/next-step-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { accounts } = useAccounts();
  const countReader = accounts.find(({ components }) =>
    components.includes("count-reader"),
  );
  return pathname === `/accounts/${countReader?.identifier}`;
};

const Step4Content = ({ countReader }: { countReader?: Account }) => (
  <>
    <p>
      Now that you understand how the <strong>Count Reader</strong> contract
      works, let's deploy it on testnet.
    </p>
    <p>
      Head to the <TutorialLink href="/accounts">accounts page</TutorialLink>,
      click the <em>"Create new account"</em> button at the top of the page and
      select the <em>"Deploy account"</em> option.
    </p>
    <p>
      Enter a name for your contract and leave the storage mode set to{" "}
      <strong>Public</strong>. Keep <strong>No Auth</strong> as the
      authentication component: it doesn't require any signature, so you can
      invoke the contract's procedures without a wallet. Then select the{" "}
      <strong>Count Reader</strong> account component.
    </p>
    <p>
      Once the component is selected, its{" "}
      <strong>
        <InlineCode>count_reader::count_reader::count</InlineCode>
      </strong>{" "}
      storage slot is listed with its default value: keep the initial count set
      to <strong>0</strong>.
    </p>
    <p>
      Finally, click the <em>"Deploy"</em> button. This takes a few moments: the
      Playground creates the Account, then funds it so that it can pay
      transaction fees. Funding the Account is its first Transaction, which also
      registers it on testnet.
    </p>
    <p>
      Once your <strong>Count Reader</strong> is deployed,{" "}
      {countReader ? (
        <TutorialLink href={`/accounts/${countReader?.identifier}`}>
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
        <TutorialStepAlert
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
