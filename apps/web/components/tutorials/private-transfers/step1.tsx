import { usePathname } from "next/navigation";
import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step1Content from "@/components/tutorials/private-transfers/step1.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  const { connectedWallet } = useAccounts();
  return (
    connectedWallet?.name === "Bread Wallet" &&
    connectedWallet.isPrivate &&
    pathname === `/accounts/${connectedWallet.identifier}`
  );
};

const Step1: TutorialStep = {
  title: "Connect your private Bread Wallet to the Playground.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step1Content
          wallet={
            connectedWallet?.name === "Bread Wallet"
              ? connectedWallet
              : undefined
          }
        />
        <TutorialAlert
          completed={completed}
          title="Action required: Connect your private Bread Wallet."
          titleWhenCompleted="Your Bread Wallet is connected and imported."
          description={
            <p>
              Click the <em>"Select Wallet"</em> button in the top-right corner
              and select <em>"Bread Wallet"</em> to connect a{" "}
              <strong>Private</strong> Bread Wallet account to the Playground.
              Once your wallet is imported, open its account details page.
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
