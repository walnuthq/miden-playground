import { useEffect, useState } from "react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step6Content from "@/components/tutorials/tutorial12/step6.mdx";
import { normalizeAccountId, useMiden } from "@miden-sdk/react";
import useNetwork from "@/hooks/use-network";
import { GUARDIAN_WALLET_CODE } from "@/lib/constants";

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
    const { client } = useMiden();
    const { networkId } = useNetwork();
    const [address, setAddress] = useState("");
    useEffect(() => {
      if (!client) {
        return;
      }
      const getMultisigWalletAddress = async () => {
        const accounts = await client.getAccounts();
        for (const account of accounts) {
          console.log(
            account.id().toString(),
            account.codeCommitment().toHex(),
          );
        }
        const multisig = accounts.find(
          (account) =>
            account.codeCommitment().toHex() === GUARDIAN_WALLET_CODE,
        );
        console.log(multisig?.id().toString());
        setAddress(normalizeAccountId(multisig?.id().toString() ?? ""));
      };
      getMultisigWalletAddress();
    }, [client, networkId]);
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
