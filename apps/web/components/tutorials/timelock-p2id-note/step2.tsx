import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step2: TutorialStep = {
  title: "Understand the P2ID note script.",
  Content: () => (
    <>
      <p>
        You've already used <strong>P2ID</strong> notes in previous tutorials,
        but this may be the first time you look at how they're implemented.
      </p>
      <p>
        The script starts by reading its note storage, at lines <em>25-33</em>.
        It contains the target{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/id">
          Account ID
        </ExternalLink>
        , split into a suffix and a prefix: note storage items are{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
          Felts
        </ExternalLink>{" "}
        (field elements), and an Account ID doesn't fit in a single Felt.
      </p>
      <p>
        At lines <em>35-41</em>, the script gets the ID of the consuming account
        with{" "}
        <strong>
          <InlineCode>account.get_id()</InlineCode>
        </strong>{" "}
        and asserts that it is equal to the target Account ID, so that only the
        target account can consume the Note.
      </p>
      <p>
        Finally, at lines <em>43-46</em>, it adds the note's assets to the
        consuming account's vault with{" "}
        <strong>
          <InlineCode>receive_asset</InlineCode>
        </strong>
        .
      </p>
      <p>
        Now that you understand the P2ID implementation, let's add the timelock
        logic.
      </p>
    </>
  ),
};

export default Step2;
