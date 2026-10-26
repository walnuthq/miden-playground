import {
  ExternalLink,
  InlineCode,
  NumberedList,
} from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step3: TutorialStep = {
  title: "Understand the counter contract MASM code.",
  Content: () => (
    <>
      <p>
        In the previous step, you looked at the higher-level{" "}
        <strong>Rust</strong> source code of the counter contract. Now let's
        focus on its <strong>MASM</strong> implementation.
      </p>
      <p>
        Here's a breakdown of what the{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        procedure does:
      </p>
      <NumberedList>
        <li>
          Pushes the{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage#slot-id">
            slot ID
          </ExternalLink>{" "}
          of the{" "}
          <strong>
            <InlineCode>counter_contract::counter_contract::count</InlineCode>
          </strong>{" "}
          slot (its prefix and suffix) onto the stack.
        </li>
        <li>
          Executes{" "}
          <strong>
            <InlineCode>active_account::get_item</InlineCode>
          </strong>{" "}
          to read the Word stored in that slot, which holds the count.
        </li>
        <li>
          Executes{" "}
          <strong>
            <InlineCode>sys::truncate_stack</InlineCode>
          </strong>{" "}
          to truncate the stack back to 16 elements.
        </li>
        <li>
          The count read by{" "}
          <strong>
            <InlineCode>active_account::get_item</InlineCode>
          </strong>{" "}
          is now on top of the stack, and is returned when this procedure is
          called.
        </li>
      </NumberedList>
      <p>
        Here's a breakdown of what the{" "}
        <strong>
          <InlineCode>increment_count</InlineCode>
        </strong>{" "}
        procedure does:
      </p>
      <NumberedList>
        <li>
          Pushes the slot ID of the{" "}
          <strong>
            <InlineCode>counter_contract::counter_contract::count</InlineCode>
          </strong>{" "}
          slot onto the stack.
        </li>
        <li>
          Executes{" "}
          <strong>
            <InlineCode>active_account::get_item</InlineCode>
          </strong>{" "}
          to read the current count.
        </li>
        <li>
          Executes{" "}
          <strong>
            <InlineCode>add.1</InlineCode>
          </strong>{" "}
          to add{" "}
          <strong>
            <InlineCode>1</InlineCode>
          </strong>{" "}
          to the count.
        </li>
        <li>
          Pushes the slot ID again so that the updated count can be written.
        </li>
        <li>
          Executes{" "}
          <strong>
            <InlineCode>native_account::set_item</InlineCode>
          </strong>
          , which saves the incremented count to storage and returns the old
          value.
        </li>
        <li>
          Executes{" "}
          <strong>
            <InlineCode>dropw</InlineCode>
          </strong>{" "}
          to drop the old value from the stack.
        </li>
        <li>
          Executes{" "}
          <strong>
            <InlineCode>sys::truncate_stack</InlineCode>
          </strong>{" "}
          to truncate the stack back to 16 elements.
        </li>
      </NumberedList>
    </>
  ),
};

export default Step3;
