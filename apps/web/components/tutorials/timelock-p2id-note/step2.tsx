import {
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

// The lines quoted here are apps/api/templates/p2id-note.masm's, the source
// the script is created from: after editing the template, check them.
const Step2: TutorialStep = {
  title: "Understand the P2ID note script.",
  Content: () => (
    <>
      <p>
        You've already used <strong>P2ID</strong> notes in previous tutorials,
        but this may be the first time you look at how they're implemented.
      </p>
      <p>
        The note's storage is described under the <em>NOTE STORAGE</em> comment:
      </p>
      <CodeBlock
        code={`const NUM_STORAGE_ITEMS = 2

const STORAGE_PTR = 0
const TARGET_ACCOUNT_ID_PREFIX_PTR = STORAGE_PTR
const TARGET_ACCOUNT_ID_SUFFIX_PTR = STORAGE_PTR + 1`}
      />
      <p>
        A P2ID note's storage holds two items, the target{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/id">
          Account ID
        </ExternalLink>
        's prefix then its suffix: storage items are{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
          Felts
        </ExternalLink>{" "}
        (field elements), and an Account ID doesn't fit in a single Felt. The
        items have no names: the script copies them to memory, starting at
        address <InlineCode>STORAGE_PTR</InlineCode>, and reads each one from
        its address. These constants are the addresses.
      </p>
      <p>
        The{" "}
        <strong>
          <InlineCode>main</InlineCode>
        </strong>{" "}
        procedure, marked{" "}
        <strong>
          <InlineCode>@note_script</InlineCode>
        </strong>
        , is the note script itself: it runs when an Account consumes the Note.
        The Miden VM is a stack machine: each instruction takes its inputs from
        the top of the stack and leaves its outputs there, and the{" "}
        <InlineCode>{"# => [...]"}</InlineCode> comments show the stack after
        each line. The procedure starts with:
      </p>
      <CodeBlock
        code={`push.NUM_STORAGE_ITEMS push.STORAGE_PTR exec.active_note::get_bounded_storage
eq.NUM_STORAGE_ITEMS assert.err=ERR_P2ID_WRONG_NUMBER_OF_STORAGE_ITEMS`}
      />
      <p>
        <InlineCode>active_note::get_bounded_storage</InlineCode> copies the
        note's storage to memory from <InlineCode>STORAGE_PTR</InlineCode> on,
        and leaves the number of items on the stack.{" "}
        <InlineCode>eq.NUM_STORAGE_ITEMS</InlineCode> replaces it with 1 if it's
        2, and 0 otherwise, then <InlineCode>assert</InlineCode> takes that
        value and fails the Transaction with the given error if it's 0.
      </p>
      <CodeBlock
        code={`mem_load.TARGET_ACCOUNT_ID_PREFIX_PTR mem_load.TARGET_ACCOUNT_ID_SUFFIX_PTR
exec.active_account::get_id
exec.account_id::eq assert.err=ERR_P2ID_WRONG_TARGET`}
      />
      <p>
        Next, the script pushes the target Account ID from memory, then the ID
        of the consuming account with{" "}
        <InlineCode>active_account::get_id</InlineCode>, and{" "}
        <InlineCode>account_id::eq</InlineCode> compares the two: only the
        target account can consume the Note.
      </p>
      <p>
        Last,{" "}
        <strong>
          <InlineCode>basic_wallet::move_note_assets_to_account</InlineCode>
        </strong>{" "}
        adds the note's assets to the consuming account's vault, calling its{" "}
        <strong>
          <InlineCode>receive_asset</InlineCode>
        </strong>{" "}
        procedure for each of them. That procedure isn't part of the script: it
        belongs to the consuming account, which the script calls by its{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
          MAST root
        </ExternalLink>
        , a hash of its code. It's the standard basic wallet's, so any wallet
        built with that component can consume the Note: an account with the
        Playground's built-in{" "}
        <TutorialLink href="/scripts/basic-wallet">basic-wallet</TutorialLink>{" "}
        script, Bread Wallet and Para wallets alike.
      </p>
      <p>
        Now that you understand the P2ID implementation, let's add the timelock
        logic.
      </p>
    </>
  ),
};

export default Step2;
