import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList, ExternalLink } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { wallets } = useAccounts();
  const wallet = wallets.find(({ isPublic }) => isPublic);
  return !!wallet;
};

const Step1: TutorialStep = {
  title: "Create your first wallet account.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          An{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/">
            Account
          </ExternalLink>{" "}
          is the primary entity in the Miden protocol. It can hold assets, store
          data, and execute custom code. An Account is very similar to an
          Ethereum smart contract. When it is used to manage funds, it acts as a
          wallet with a programmable interface.
        </p>
        <p>
          Users can choose whether their Accounts are stored{" "}
          <strong>publicly</strong> or <strong>privately</strong>. The{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/id#account-type">
            storage mode
          </ExternalLink>{" "}
          is chosen when the Account is created and cannot be changed later.
        </p>
        <BulletList>
          <li>
            <strong>Public Accounts</strong>: the Account's state is stored
            on-chain, similar to how accounts are stored in public blockchains
            like Ethereum.
          </li>
          <li>
            <strong>Private Accounts</strong>: only a commitment (hash) to the
            Account's state is stored on-chain. This mode is suitable for users
            who prioritize privacy or plan to store a large amount of data in
            their Account.
          </li>
        </BulletList>
        <p>
          For this tutorial, let's create a <strong>public</strong> wallet
          account and fund it using a faucet.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create your first public wallet."
          titleWhenCompleted="Your first wallet has been created."
          description={
            <p>
              Click the <em>"Create new account"</em> button, then select the{" "}
              <em>"Create new wallet"</em> option to generate a wallet account.{" "}
              <strong>Make sure to create a public wallet.</strong>
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
