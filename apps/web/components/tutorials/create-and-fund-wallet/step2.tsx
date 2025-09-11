import { type TutorialStep } from "@/lib/types";
import Step2Content from "@/components/tutorials/create-and-fund-wallet/step2.mdx";
import useAccounts from "@/hooks/use-accounts";

const Step2: TutorialStep = {
  title: "Discover your new wallet details.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return <Step2Content wallet={wallet} />;
  },
};

export default Step2;
