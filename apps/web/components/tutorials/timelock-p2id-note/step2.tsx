import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import { basicWalletScript } from "@/lib/tutorials/basic-wallet";
import type { TutorialStep } from "@/lib/types/tutorial";

// Line numbers refer to apps/api/templates/p2id-note.rs, the source the script
// is created from.
const Step2: TutorialStep = {
  title: "Understand the P2ID note script.",
  Content: () => (
    <>
      <p>
        You've already used <strong>P2ID</strong> notes in previous tutorials,
        but this may be the first time you look at how they're implemented.
      </p>
      <p>
        The{" "}
        <strong>
          <InlineCode>P2idNote</InlineCode>
        </strong>{" "}
        struct, at lines <em>12-15</em>, declares the note storage. Its only
        field is the target{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/id">
          Account ID
        </ExternalLink>
        , which takes two storage items, a prefix and a suffix: storage items
        are{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
          Felts
        </ExternalLink>{" "}
        (field elements), and an Account ID doesn't fit in a single Felt.
      </p>
      <p>
        The{" "}
        <strong>
          <InlineCode>script</InlineCode>
        </strong>{" "}
        method, at lines <em>38-47</em>, is the note script itself: marked{" "}
        <strong>
          <InlineCode>#[note_script]</InlineCode>
        </strong>
        , it runs when an account consumes the Note. It gets the ID of the
        consuming account with{" "}
        <strong>
          <InlineCode>account.get_id()</InlineCode>
        </strong>{" "}
        and asserts that it is equal to the target Account ID, so that only the
        target account can consume the Note. It then adds the note's assets to
        the consuming account's vault with{" "}
        <strong>
          <InlineCode>receive_asset</InlineCode>
        </strong>
        .
      </p>
      <p>
        That procedure isn't part of the script: it belongs to the consuming
        account. Lines <em>7-10</em> name where it comes from, the{" "}
        <TutorialLink href={`/scripts/${basicWalletScript.id}`}>
          basic-wallet
        </TutorialLink>{" "}
        script that comes with this tutorial, a basic wallet component written
        in Rust. The note script calls it by its{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
          MAST root
        </ExternalLink>
        , a hash of its code, so only an account that has this very component
        can consume the Note.
      </p>
      <p>
        The{" "}
        <strong>
          <InlineCode>build_recipient</InlineCode>
        </strong>{" "}
        constructor, at lines <em>29-36</em>, is for other scripts: they call it
        to create such a Note from their own code. You won't call it here, since
        the Playground builds the Note from the storage items you give it, but
        it fills the struct in, so it has to follow any change to its fields.
      </p>
      <p>
        Now that you understand the P2ID implementation, let's add the timelock
        logic.
      </p>
    </>
  ),
};

export default Step2;
