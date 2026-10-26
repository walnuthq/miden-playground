import AccountAddress from "@/components/lib/account-address";
import { BulletList, ExternalLink } from "@/components/tutorials/prose";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step2Content = ({ wallet }: { wallet?: Account }) => (
  <>
    <p>
      Your newly created Account was assigned an{" "}
      <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/id">
        Account ID
      </ExternalLink>
      , a unique and immutable identifier. Click the link below to open your
      wallet:
    </p>
    <AccountAddress account={wallet} />
    <p>
      The ID also encodes some of the Account's metadata: its storage mode
      (public or private) and its version. This means the metadata can be read
      from the ID alone, without needing the full Account state.
    </p>
    <p>
      Accounts can play different roles depending on the code they run. The two
      you'll use in this tutorial are <strong>wallets</strong> and{" "}
      <strong>faucets</strong>.
    </p>
    <BulletList>
      <li>
        <strong>Wallets</strong>: wallets hold assets in their vault and can
        send and receive them using Notes.
      </li>
      <li>
        <strong>Faucets</strong>: faucets issue (mint) new{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/asset">
          assets
        </ExternalLink>
        , which can be either fungible or non-fungible.
      </li>
    </BulletList>
    <p>
      Let's fund your wallet with MDN tokens minted by the MDN Faucet, an
      existing fungible faucet.
    </p>
  </>
);

const Step2: TutorialStep = {
  title: "Explore your new wallet's details.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return <Step2Content wallet={wallet} />;
  },
};

export default Step2;
