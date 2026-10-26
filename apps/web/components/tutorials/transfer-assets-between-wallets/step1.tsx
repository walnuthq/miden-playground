import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList } from "@/components/tutorials/prose";
import useWalletB from "@/components/tutorials/transfer-assets-between-wallets/use-wallet-b";
import WalletBAlert from "@/components/tutorials/transfer-assets-between-wallets/wallet-b-alert";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step1Content = ({
  faucet,
  walletA,
  walletB,
}: {
  faucet?: Account;
  walletA?: Account;
  walletB?: Account;
}) => (
  <>
    <p>
      In this tutorial, you'll learn how to transfer assets between two wallets.
      The Playground has set up both wallets, as well as a fungible faucet.
    </p>
    <BulletList>
      <li>
        <TutorialLink href={`/accounts/${walletA?.identifier}`}>
          Wallet A
        </TutorialLink>
        : the source wallet. It has been funded with MDN tokens, and you'll
        transfer some of them to the destination wallet.
      </li>
      <li>
        <TutorialLink href={`/accounts/${walletB?.identifier}`}>
          Wallet B
        </TutorialLink>
        : the destination wallet, created just for you. It will receive MDN
        tokens from the source wallet. It's brand new: its nonce is 0 and its
        vault is empty.
      </li>
      <li>
        <TutorialLink href={`/accounts/${faucet?.identifier}`}>
          MDN Faucet
        </TutorialLink>
        : the fungible faucet that issued the MDN tokens.
      </li>
    </BulletList>
  </>
);

const Step1: TutorialStep = {
  title: "Explore the accounts.",
  Content: () => {
    const { faucets } = useAccounts();
    const { walletA, walletB } = useWalletB();
    const faucet = faucets.find(({ name }) => name === "MDN Faucet");
    return (
      <>
        <Step1Content walletA={walletA} walletB={walletB} faucet={faucet} />
        <TutorialStepAlert
          title="Explore the accounts."
          description="Click each account to explore its current state, and confirm
            that Wallet A holds MDN tokens."
        />
        <WalletBAlert />
      </>
    );
  },
  NextStepButton: () => {
    const { walletB } = useWalletB();
    return (
      <NextStepButton
        text={walletB ? undefined : "Creating Wallet B…"}
        disabled={!walletB}
      />
    );
  },
};

export default Step1;
