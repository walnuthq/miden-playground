import { useEffect, useState } from "react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step6Content from "@/components/tutorials/tutorial12/step6.mdx";
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

const Step6: TutorialStep = {
  title: "Restore your guardian wallet.",
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
        <Step6Content account={{ name: "Guardian Wallet", address }} />
        <TutorialAlert
          completed={completed}
          title="Action required: Restore your guardian."
          titleWhenCompleted="Your guardian has been restored."
          description={
            <p>
              Click on the <em>"Create new account"</em> button on top of the
              accounts page and select the <em>"Restore guardian"</em> option to
              restore your guardian wallet backup.
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

export default Step6;
