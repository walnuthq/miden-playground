import { useRouter, usePathname } from "next/navigation";
import { type Tutorial } from "@/lib/types";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import store from "@/components/tutorials/interact-with-the-counter-contract/store";
import state from "@/components/tutorials/interact-with-the-counter-contract/state";
import Step1Content from "@/components/tutorials/interact-with-the-counter-contract/step1.mdx";
import Step2Content from "@/components/tutorials/interact-with-the-counter-contract/step2.mdx";
import Step3Content from "@/components/tutorials/interact-with-the-counter-contract/step3.mdx";
import Step4Content from "@/components/tutorials/interact-with-the-counter-contract/step4.mdx";
import Step5Content from "@/components/tutorials/interact-with-the-counter-contract/step5.mdx";

const Step1 = {
  title: "Learn about Smart Contract scripts.",
  Content: () => {
    const pathname = usePathname();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={pathname === "/scripts/counter-contract"}
          title="Action required: Click on the script."
          titleWhenCompleted="You navigated to the Counter Contract script."
          description={
            <p>
              Click on the <em>"Counter Contract"</em> row in the scripts table
              to start reading the script.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const pathname = usePathname();
    return (
      <NextStepButton disabled={pathname !== "/scripts/counter-contract"} />
    );
  },
};

const Step2 = {
  title: "Understand the Counter Contract script.",
  Content: Step2Content,
};

const COUNTER_CONTRACT_ADDRESS = "mtst1qz43ftxkrzcjsqz3hpw332qwny2ggsp0";

const Step3 = {
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
          completed={pathname === `/accounts/${COUNTER_CONTRACT_ADDRESS}`}
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
        disabled={pathname !== `/accounts/${COUNTER_CONTRACT_ADDRESS}`}
      />
    );
  },
};

const Step4 = {
  title: "Invoke the Counter Contract procedures.",
  Content: () => {
    // TODO completed
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={false}
          title="Action required: Invoke the procedure."
          titleWhenCompleted="You have invoked the Counter Contract procedures."
          description={
            <p>
              Click on the <em>"Invoke"</em> button in the <em>"Components"</em>{" "}
              section of the account details page to invoke the{" "}
              <strong>increment_count</strong> procedure.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    // TODO disabled
    return <NextStepButton disabled={true} />;
  },
};

const Step5 = {
  title: "Refresh the Counter value.",
  Content: Step5Content,
  NextStepButton: () => {
    const { resetState } = useGlobalContext();
    const router = useRouter();
    return (
      <NextStepButton
        text="Back to tutorials list"
        onClick={() => {
          resetState();
          router.push("/");
        }}
      />
    );
  },
};

const tutorial: Tutorial = {
  id: "interact-with-the-counter-contract",
  title: "Interact with the Counter Contract",
  tagline: "Increment the count of a Counter Contract on testnet.",
  description:
    "This tutorial will guide you through interacting with a Counter Contract by incrementing its counter on testnet.",
  initialRoute: "/scripts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
