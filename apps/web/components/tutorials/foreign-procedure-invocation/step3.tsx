import CountReaderMissingScriptsAlert from "@/components/tutorials/foreign-procedure-invocation/missing-scripts-alert";
import useCountReader, {
  COUNT_READER_SLOT_NAME,
  COUNTER_SLOT_NAME,
} from "@/components/tutorials/foreign-procedure-invocation/use-count-reader";
import {
  CodeBlock,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

// The lines quoted here are apps/api/templates/count-reader.masm's, the source
// of the count-reader script the tutorial starts with, and
// counter-account.masm's (`get_count`): after editing either, check them.
const Step3: TutorialStep = {
  title: "Understand the Count Reader code.",
  Content: () => {
    const { countReaderScript, counterScript } = useCountReader();
    return (
      <>
        <CountReaderMissingScriptsAlert />
        <p>
          The{" "}
          <TutorialLink
            href={
              countReaderScript
                ? `/scripts/${countReaderScript.id}`
                : "/scripts"
            }
          >
            count-reader
          </TutorialLink>{" "}
          script holds the Miden Assembly source of the{" "}
          <strong>Count Reader</strong> contract, in its file{" "}
          <strong>
            <InlineCode>count_reader.masm</InlineCode>
          </strong>
          . Like the counter contract from the previous tutorials, it's an{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
            account component
          </ExternalLink>
          : a storage layout and procedures that an Account is built from.
        </p>
        <p>The file starts with the modules it uses:</p>
        <CodeBlock
          code={`use counter_account
use {AccountId} from miden::protocol::types
use miden::protocol::native_account
use miden::protocol::tx
use miden::core::sys`}
        />
        <p>
          <InlineCode>counter_account</InlineCode> is the{" "}
          <TutorialLink
            href={counterScript ? `/scripts/${counterScript.id}` : "/scripts"}
          >
            counter-account
          </TutorialLink>{" "}
          script, the code of the counter contract you'll copy the count from:
          the one you imported in the{" "}
          <em>"Interact with the counter contract"</em> tutorial, which keeps
          its count in a map slot. The count-reader script depends on it, but
          doesn't include its procedures: the Count Reader only needs to name
          one of them. <InlineCode>tx</InlineCode> and{" "}
          <InlineCode>native_account</InlineCode> come from the Miden protocol
          library, the kernel procedures a transaction calls;{" "}
          <InlineCode>sys</InlineCode> from the core library.
        </p>
        <p>
          The copied count is kept in a single{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#value-slots">
            value slot
          </ExternalLink>
          , named by a string:
        </p>
        <CodeBlock code={`const COUNT_SLOT = word("count_reader::count")`} />
        <p>
          A value slot holds one word, four{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#felt">
            field elements
          </ExternalLink>{" "}
          (felts): the count, then three zeros.{" "}
          <InlineCode>word("…")</InlineCode> hashes the name to a word, and the
          procedure below identifies the slot by its first two felts.
        </p>
        <p>
          Then comes the contract's only procedure,{" "}
          <strong>
            <InlineCode>copy_count</InlineCode>
          </strong>
          :
        </p>
        <CodeBlock
          code={`@account_procedure
@locals(2)
pub proc copy_count(counter_account_id: AccountId)`}
        />
        <p>
          <InlineCode>@account_procedure</InlineCode> exports it from the
          component, so it can be invoked on an Account.{" "}
          <InlineCode>@locals(2)</InlineCode> reserves two felts of local memory
          for it. Its argument, the ID of the counter contract to read, is an{" "}
          <InlineCode>AccountId</InlineCode>: two felts, a suffix and a prefix.
          A procedure gets its arguments on the stack, padded to 16 felts, the
          suffix on top. The comment above the procedure says so:
        </p>
        <CodeBlock code="#! Inputs:  [counter_account_id_suffix, counter_account_id_prefix, pad(14)]" />
        <p>
          The body is a sequence of instructions, each of which changes the
          stack. The comments starting with <InlineCode>{"# =>"}</InlineCode>{" "}
          show the stack after the lines above them, top first. Let's walk
          through it.
        </p>
        <CodeBlock
          code={`loc_store.0 loc_store.1
# => [pad(16)]`}
        />
        <p>
          <InlineCode>loc_store.0</InlineCode> pops the top felt, the ID's
          suffix, into local 0, and <InlineCode>loc_store.1</InlineCode> the
          prefix into local 1. The ID is set aside while the call is prepared.
          The stack is never shallower than 16 felts: zeros fill it from below.
        </p>
        <CodeBlock
          code={`padw padw padw padw
# => [pad(16), pad(16)]`}
        />
        <p>
          Each <InlineCode>padw</InlineCode> pushes a word of zeros. The 16
          zeros are the inputs of the procedure the Count Reader is about to
          call: <InlineCode>get_count</InlineCode> takes none, but a call always
          passes 16 felts.
        </p>
        <CodeBlock
          code={`procref.counter_account::get_count
# => [GET_COUNT_ROOT, pad(16), pad(16)]`}
        />
        <p>
          <InlineCode>procref</InlineCode> pushes the <strong>MAST root</strong>{" "}
          of the counter's <InlineCode>get_count</InlineCode> procedure, a word
          computed from its code. This is how one contract names another's
          procedure: by the hash of its code, not by its name. Only an Account
          whose code holds a procedure with that root can run it.
        </p>
        <CodeBlock
          code={`loc_load.1 loc_load.0
# => [counter_account_id_suffix, counter_account_id_prefix, GET_COUNT_ROOT, pad(32)]`}
        />
        <p>
          The counter's ID comes back from local memory: the prefix first, then
          the suffix, which ends on top. The stack now holds what{" "}
          <InlineCode>execute_foreign_procedure</InlineCode> takes: the foreign
          account's ID, the root of the procedure to run, and that procedure's
          16 inputs.
        </p>
        <CodeBlock
          code={`exec.tx::execute_foreign_procedure
# => [count, pad(15), pad(16)]`}
        />
        <p>
          This is the foreign procedure invocation. The transaction kernel loads
          the counter contract's code and storage, checks that its code holds
          the root, and runs <InlineCode>get_count</InlineCode> against the
          counter's storage, not the Count Reader's. The counter's procedure can
          only read: the Count Reader's Transaction can't change another
          Account. It returns 16 felts, the count on top, in place of the 22
          felts it was given: the ID's 2, the root's 4 and the 16 inputs.
        </p>
        <p>
          <InlineCode>get_count</InlineCode> itself, in the counter-account
          script, reads the count from the counter's map slot, under the key{" "}
          <InlineCode>[1, 0, 0, 0]</InlineCode>, and keeps the top 16 felts:
        </p>
        <CodeBlock
          code={`push.COUNT_KEY push.COUNT_MAP_SLOT[0..2]
# => [slot_id_suffix, slot_id_prefix, COUNT_KEY, pad(16)]

exec.active_account::get_map_item
# => [count, 0, 0, 0, pad(16)]

# a procedure that is \`call\`ed must return 16 elements
exec.sys::truncate_stack
# => [count, pad(15)]`}
        />
        <p>
          <InlineCode>active_account</InlineCode> is the Account the procedure
          runs against: inside a foreign procedure invocation, the counter.
        </p>
        <p>
          Back in <InlineCode>copy_count</InlineCode>, the count is written to
          the Count Reader's own storage:
        </p>
        <CodeBlock
          code={`push.0.0.0 movup.3
# => [count, 0, 0, 0, pad(15), pad(16)]`}
        />
        <p>
          A storage value is a word. <InlineCode>push.0.0.0</InlineCode> pushes
          three zeros above the count, and <InlineCode>movup.3</InlineCode>{" "}
          moves the count, now fourth, back to the top: the word{" "}
          <InlineCode>[count, 0, 0, 0]</InlineCode>.
        </p>
        <CodeBlock
          code={`push.COUNT_SLOT[0..2] exec.native_account::set_item
# => [OLD_VALUE, pad(15), pad(16)]`}
        />
        <p>
          <InlineCode>COUNT_SLOT[0..2]</InlineCode> pushes the first two felts
          of the slot's name hash, the slot's ID, and{" "}
          <InlineCode>native_account::set_item</InlineCode> stores the word in
          that slot of the Account running the Transaction, the Count Reader. It
          returns the slot's previous value.
        </p>
        <CodeBlock
          code={`dropw exec.sys::truncate_stack
# => [pad(16)]`}
        />
        <p>
          <InlineCode>dropw</InlineCode> drops the old value and{" "}
          <InlineCode>sys::truncate_stack</InlineCode> drops everything below
          the top 16 felts: a procedure that is invoked must leave exactly 16 on
          the stack.
        </p>
        <p>
          The counter contract is a public account, so the Playground can fetch
          its state from the network and provide it to the Transaction executing{" "}
          <strong>
            <InlineCode>copy_count</InlineCode>
          </strong>
          . The state it reads is the counter's at the Transaction's reference
          block, a recent block the Playground picks: the copy can lag behind a
          very recent increment. To learn more, read the{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/transaction#foreign-procedure-invocation-fpi-and-expiration">
            foreign procedure invocation
          </ExternalLink>{" "}
          section of the Miden docs.
        </p>
        <p>
          You can try{" "}
          <strong>
            <InlineCode>copy_count</InlineCode>
          </strong>{" "}
          before deploying anything, in the <em>"Simulate"</em> tab of the
          console under the code: it runs the procedure locally, against a
          simulated counter contract, and submits nothing. Under{" "}
          <em>"Foreign accounts"</em>, click <em>"Add entry"</em> and give the
          counter's <InlineCode>{COUNTER_SLOT_NAME}</InlineCode> map the key{" "}
          <InlineCode>1</InlineCode> and a count as its value. Pick the
          simulated <strong>counter-account</strong> as{" "}
          <strong>
            <InlineCode>copy_count</InlineCode>
          </strong>
          's argument, then click <em>"Invoke"</em>: the result shows the Count
          Reader's <InlineCode>count</InlineCode> slot changing from zero to
          that count, as a word in hexadecimal (<InlineCode>0x0700…</InlineCode>{" "}
          for 7). <em>"Apply to state"</em> writes it to the{" "}
          <strong>
            <InlineCode>{COUNT_READER_SLOT_NAME}</InlineCode>
          </strong>{" "}
          slot above.
        </p>
      </>
    );
  },
};

export default Step3;
