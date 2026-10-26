import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { BulletList, ExternalLink } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step6: TutorialStep = {
  title: "Review your private transfer.",
  Content: () => (
    <>
      <p>
        Congratulations! You have used one of Miden's most exciting features:
        privacy-preserving transfers.
      </p>
      <p>Here is what the outside world can see of what you did:</p>
      <BulletList>
        <li>
          <strong>Bread Wallet</strong>: as a <strong>Private</strong> account,
          only a commitment to its state is stored on-chain, so its balance and
          activity stay private to you. Only the public note sent by the USDCx
          Faucet revealed the tokens it received.
        </li>
        <li>
          <strong>The transfer</strong>: the private note sent to your Para
          Wallet only exposes its hash and metadata on-chain, while the assets
          it carries and its target account stay off-chain. When the Para Wallet
          consumed it, the note's{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#nullifier">
            nullifier
          </ExternalLink>{" "}
          marked it as spent without revealing which Note it was.
        </li>
        <li>
          <strong>Para Wallet</strong>: as a <strong>Public</strong> account,
          its state is stored on-chain, so anyone can see its balance and
          Transactions.
        </li>
      </BulletList>
      <p>
        Open the Bread Wallet browser extension, or your Para Wallet details
        page in the Playground, to review your activity and see all the
        operations you performed during this tutorial.
      </p>
    </>
  ),
  NextStepButton: NextTutorialButton,
};

export default Step6;
