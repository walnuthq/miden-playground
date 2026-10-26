import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { BulletList, ExternalLink } from "@/components/tutorials/prose";
import GuardianInfo from "@/components/tutorials/wallet-backup-using-miden-guardian/guardian-info";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step7: TutorialStep = {
  title: "Review your wallet backup.",
  Content: () => (
    <>
      <p>
        Congratulations! You've deployed a guardian wallet, funded it through a
        proposal co-signed by Miden Guardian, and restored it after losing its
        state.
      </p>
      <p>Here is what you did:</p>
      <BulletList>
        <li>
          <strong>Backup</strong>: every state change of your guardian wallet
          went through Miden Guardian, which always holds its latest state.
        </li>
        <li>
          <strong>Control</strong>: Miden Guardian can't move your funds on its
          own, as every Transaction also requires your signature.
        </li>
        <li>
          <strong>Recovery</strong>: as long as you control your{" "}
          <strong>Signer</strong>, you can restore your guardian wallet on any
          device.
        </li>
      </BulletList>
      <p>
        The guardian wallet you deployed in this tutorial was built step by step
        for educational purposes, so you could see how Miden Guardian works
        under the hood. In practice, you don't need to do any of this yourself:
        wallets like Bread Wallet can back up your private accounts with Miden
        Guardian for you, handling proposals, signatures and syncing in the
        background. Check your wallet's settings to confirm that your private
        accounts are backed up.
      </p>
      <GuardianInfo />
      <p>
        Miden Guardian stores the state it backs up and must be online to
        co-sign your Transactions, so you rely on its operator for availability
        and, unless the state is encrypted, for confidentiality. Read the{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/miden-guardian/">
          Miden Guardian documentation
        </ExternalLink>{" "}
        to learn more about its trust model, and{" "}
        <ExternalLink href="https://www.miden.xyz/blog/miden-guardian-solves-the-privacy-paradox">
          how Miden Guardian solves the privacy paradox
        </ExternalLink>{" "}
        for shared accounts.
      </p>
    </>
  ),
  NextStepButton: NextTutorialButton,
};

export default Step7;
