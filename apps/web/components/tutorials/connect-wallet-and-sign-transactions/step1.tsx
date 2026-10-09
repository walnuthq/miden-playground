import { usePathname } from "next/navigation";
import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step1Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step1.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  const { connectedWallet } = useAccounts();
  return (
    connectedWallet?.isPrivate &&
    pathname === `/accounts/${connectedWallet?.identifier}`
  );
};

const Step1: TutorialStep = {
  title: "Connect your wallet to the Playground.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step1Content wallet={connectedWallet} />
        <TutorialAlert
          completed={completed}
          title="Action required: Connect your wallet."
          titleWhenCompleted="Your wallet is connected and imported."
          description={
            <p>
              Click the <em>"Select Wallet"</em> button in the top-right corner
              and select <em>"Bread Wallet"</em> to connect it to the
              Playground. Once your wallet is imported, open its account details
              page.
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

export default Step1;
