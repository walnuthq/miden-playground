import { useEffect, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step7Content from "@/components/tutorials/tutorial12/step7.mdx";
import useWebClient from "@/hooks/use-web-client";
import { accountIdToAddress } from "@/lib/web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useGlobalContext from "@/components/global-context/hook";

const useCompleted = () => {
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const nonce = multisig?.nonce ?? 0;
  return nonce > 0;
};

const Step7: TutorialStep = {
  title: "Import your multisig account back.",
  Content: () => {
    const completed = useCompleted();
    const { midenSdk } = useMidenSdk();
    const { client } = useWebClient();
    const { networkId } = useGlobalContext();
    const [address, setAddress] = useState("");
    useEffect(() => {
      if (!client) {
        return;
      }
      const getMultisigWalletAddress = async () => {
        const accounts = await client.getAccounts();
        const multisig = accounts.find(
          (account) =>
            account.codeCommitment().toHex() ===
            "0x2860c3c59588e2c3d73ffdb90dc142131515c08a29fb2d2325d271ca24f902f2",
        );
        setAddress(
          accountIdToAddress({
            accountId: multisig?.id().toString() ?? "",
            networkId,
            midenSdk,
          }),
        );
      };
      getMultisigWalletAddress();
    }, [midenSdk, client, networkId]);
    return (
      <>
        <Step7Content account={{ name: "Multisig Wallet", address }} />
        <TutorialAlert
          completed={completed}
          title="Action required: Import the multisig."
          titleWhenCompleted="Your multisig has been imported."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the multisig account row in the
              accounts page to delete your multisig wallet.
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
