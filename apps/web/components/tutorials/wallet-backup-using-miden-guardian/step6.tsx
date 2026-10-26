import { normalizeAccountId, useMiden } from "@miden-sdk/react/lazy";
import { useEffect, useState } from "react";
import AccountAddress from "@/components/lib/account-address";
import CopyButton from "@/components/lib/copy-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { GUARDIAN_WALLET_CODE } from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const nonce = multisig?.nonce ?? 0;
  return nonce > 0;
};

const Step6Content = ({
  account,
}: {
  account: { name: string; address: string };
}) => (
  <>
    <p>
      Oh no! You lost your phone and your guardian wallet's state is gone
      forever… or is it?
    </p>
    <p>
      Luckily, Miden Guardian holds a backup of its latest state: all you need
      is access to the <strong>Signer</strong>, your Bread Wallet. In real life,
      this means keeping your Bread Wallet's recovery phrase safe so you can
      restore it on a new device.
    </p>
    <p>
      Click the <em>"Select Wallet"</em> button, select <em>"Bread Wallet"</em>{" "}
      and accept the connection request to reconnect it.
    </p>
    <p>
      Then, on the <TutorialLink href="/accounts">accounts page</TutorialLink>,
      click the <em>"Create new account"</em> button and select the{" "}
      <em>"Restore guardian wallet"</em> option.
    </p>
    <p>
      A dialog asks for a name and the address of the guardian wallet to
      restore. If you didn't save your guardian wallet's address, here it is:
    </p>
    <BulletList>
      <li>
        <p>
          <strong>Name</strong>: Guardian Wallet{" "}
          <CopyButton content="Copy Account Name" copy="Guardian Wallet" />
        </p>
      </li>
      <li>
        <p>
          <strong>Address</strong>:
        </p>
      </li>
    </BulletList>
    <AccountAddress account={account} withLink={false} />
    <p>
      Click <em>"Restore"</em>: the Playground fetches the latest state of your
      guardian wallet from Miden Guardian, including the tokens you received in
      the previous steps.
    </p>
  </>
);

const Step6: TutorialStep = {
  title: "Restore your guardian wallet.",
  Content: () => {
    const completed = useCompleted();
    const { client } = useMiden();
    const { networkId } = useNetwork();
    const [address, setAddress] = useState("");
    // biome-ignore lint/correctness/useExhaustiveDependencies: refetch the address when the network changes.
    useEffect(() => {
      if (!client) {
        return;
      }
      const getMultisigWalletAddress = async () => {
        const accounts = await client.getAccounts();
        const multisig = accounts.find(
          (account) =>
            account.codeCommitment().toHex() === GUARDIAN_WALLET_CODE,
        );
        setAddress(normalizeAccountId(multisig?.id().toString() ?? ""));
      };
      getMultisigWalletAddress();
    }, [client, networkId]);
    return (
      <>
        <Step6Content account={{ name: "Guardian Wallet", address }} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Restore your guardian wallet."
          titleWhenCompleted="Your guardian wallet has been restored."
          description={
            <p>
              Reconnect Bread Wallet, click the <em>"Create new account"</em>{" "}
              button on the accounts page and select the{" "}
              <em>"Restore guardian wallet"</em> option to restore your guardian
              wallet.
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
