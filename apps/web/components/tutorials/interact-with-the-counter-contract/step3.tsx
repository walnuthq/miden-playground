import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/interact-with-the-counter-contract/step3.mdx";
import { COUNTER_CONTRACT_ADDRESS } from "@/lib/constants";

const Step3: TutorialStep = {
  title: "Import the Counter Contract.",
  Content: () => {
    const pathname = usePathname();
    const { accounts } = useAccounts();
    const counter = accounts.find(
      ({ address }) => address === COUNTER_CONTRACT_ADDRESS
    );
    return (
      <>
        <Step3Content
          counter={{
            name: "Counter Contract",
            address: COUNTER_CONTRACT_ADDRESS,
          }}
          withLink={!!counter}
        />
        <TutorialAlert
          //completed={pathname === `/accounts/${COUNTER_CONTRACT_ADDRESS}`}
          // TODO
          completed={
            pathname === "/accounts/mtst1qrhk9zc2au2vxqzaynaz5ddhs4cqzmj67pf"
          }
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
    const pathname = usePathname();
    return (
      <NextStepButton
        // disabled={pathname !== `/accounts/${COUNTER_CONTRACT_ADDRESS}`}
        // TODO
        disabled={
          pathname !== "/accounts/mtst1qrhk9zc2au2vxqzaynaz5ddhs4cqzmj67pf"
        }
      />
    );
  },
};

export default Step3;
