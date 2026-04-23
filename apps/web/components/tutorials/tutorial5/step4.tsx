import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/tutorial5/step4.mdx";
import { counterContractAddress } from "@/lib/constants";
import { getIdentifierPart } from "@/lib/utils/account";
import useNetwork from "@/hooks/use-network";

const useCompleted = () => {
  const pathname = usePathname();
  const { networkId } = useNetwork();
  return (
    pathname ===
    `/accounts/${getIdentifierPart(counterContractAddress(networkId))}`
  );
};

const Step4: TutorialStep = {
  title: "Import the Counter Contract.",
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
        <TutorialAlert
          completed={completed}
          title="Action required: Import the Counter Contract."
          titleWhenCompleted="You have imported the Counter Contract."
          description={
            <p>
              Click on the <em>"Create new account"</em> button on top of the
              accounts page and select the <em>"Import account"</em> option to
              import the Counter Contract in the Playground, then navigate to
              the account details page.
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
