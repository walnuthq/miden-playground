import {
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

// The lines quoted here are apps/api/templates/counter-account.masm's, which
// the counter-account script is assembled from (the counter-contract example's
// account): after editing the template, check them.
const Step2: TutorialStep = {
  title: "Understand the counter contract's MASM code.",
  Content: () => (
    <>
      <p>
        The editor shows the counter contract's source file,{" "}
        <strong>
          <InlineCode>counter_account.masm</InlineCode>
        </strong>
        . Let's start with its storage, under the <em>STORAGE</em> comment:
      </p>
      <CodeBlock
        code={`const COUNT_MAP_SLOT = word("counter_account::count_map")
const COUNT_KEY = [1, 0, 0, 0]`}
      />
      <p>
        The counter is kept in a single{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#map-slots">
          map slot
        </ExternalLink>{" "}
        named{" "}
        <strong>
          <InlineCode>counter_account::count_map</InlineCode>
        </strong>
        . A map slot holds a <strong>StorageMap</strong>, a key-value store
        whose keys are{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#word">
          Words
        </ExternalLink>
        , four field elements. The count is a single{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
          Felt
        </ExternalLink>{" "}
        (field element) stored under the fixed key{" "}
        <strong>
          <InlineCode>COUNT_KEY</InlineCode>
        </strong>
        . The procedures don't use the slot's name but its id, the first two
        felts of the Word the name hashes to:{" "}
        <InlineCode>COUNT_MAP_SLOT[0..2]</InlineCode>.
      </p>
      <p>
        The Miden VM is a stack machine: each instruction takes its inputs from
        the top of the stack and leaves its outputs there. The comments that
        start with <InlineCode>{"# =>"}</InlineCode> show the stack after the
        line above them, its top on the left.
      </p>
      <p>
        The{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        procedure reads the count:
      </p>
      <CodeBlock
        code={`push.COUNT_KEY push.COUNT_MAP_SLOT[0..2]
exec.active_account::get_map_item
exec.sys::truncate_stack`}
      />
      <p>
        The first line pushes the key, then the slot id on top of it.{" "}
        <InlineCode>active_account::get_map_item</InlineCode> takes both and
        leaves the Word stored under that key in the account's{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/glossary/#accountstorage">
          storage
        </ExternalLink>
        : the count, then three zeros. A procedure that a transaction script or
        a Note calls must return exactly 16 elements, so{" "}
        <InlineCode>sys::truncate_stack</InlineCode> drops the extra ones,
        leaving the count on top.
      </p>
      <p>
        The{" "}
        <strong>
          <InlineCode>increment_count</InlineCode>
        </strong>{" "}
        procedure reads the count the same way, then:
      </p>
      <CodeBlock
        code={`add.1
dupw
push.COUNT_KEY push.COUNT_MAP_SLOT[0..2]
exec.native_account::set_map_item
dropw`}
      />
      <p>
        <InlineCode>add.1</InlineCode> adds one to the count on top of the
        stack, and <InlineCode>dupw</InlineCode> copies the Word it sits in, to
        return the new count at the end. With the key and the slot id pushed
        again, <InlineCode>native_account::set_map_item</InlineCode> writes the
        new value under the key and leaves the old one, which{" "}
        <InlineCode>dropw</InlineCode> drops. It writes through{" "}
        <InlineCode>native_account</InlineCode>: only the account a Transaction
        runs against can change its storage.
      </p>
      <p>
        Both procedures are marked{" "}
        <strong>
          <InlineCode>@account_procedure</InlineCode>
        </strong>{" "}
        and declared <InlineCode>pub</InlineCode>: they are exported by the
        package the source assembles to, so transaction scripts and Notes can
        call them on the deployed contract. The next step looks at that package.
        To follow along, click the <em>"Manifest"</em> tab above the editor.
      </p>
    </>
  ),
};

export default Step2;
