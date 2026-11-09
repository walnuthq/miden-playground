import { Plus } from "lucide-react";
import { useLocation } from "react-router";
import NextStepButton from "@/components/tutorials/next-step-button";
import {
  BulletList,
  ButtonName,
  ExternalLink,
  InlineCode,
} from "@/components/tutorials/prose";
import useNoteScript from "@/components/tutorials/timelock-p2id-note/use-note-script";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { pathname } = useLocation();
  const script = useNoteScript();
  return !!script && pathname === `/scripts/${script.id}`;
};

const Step1: TutorialStep = {
  title: "Create a new script from the P2ID Note example.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          In this tutorial, you'll create a custom timelocked note on Miden, an
          extended version of the <strong>P2ID (Pay-to-ID)</strong> note. Using
          custom note logic, you'll learn how to program a Note that can only be
          consumed once the Transaction's reference block number is greater than
          or equal to the note's timelock block height.
        </p>
        <p>Creating a custom note is a two-step process:</p>
        <BulletList>
          <li>
            First, you write the{" "}
            <ExternalLink href="https://docs.miden.xyz/reference/protocol/note#script">
              note script
            </ExternalLink>{" "}
            as a <strong>Rust program</strong> and compile it to{" "}
            <strong>MASM (Miden Assembly)</strong>.
          </li>
          <li>
            Then, your wallet executes a Transaction that creates the Note on
            the network.
          </li>
        </BulletList>
        <p>
          When creating a Note, you can pass it arbitrary parameters, stored in
          its{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/note#storage">
            note storage
          </ExternalLink>
          , which the note script can read. In a Rust note script, they are the
          fields of the struct marked{" "}
          <strong>
            <InlineCode>#[note]</InlineCode>
          </strong>
          .
        </p>
        <p>
          In this timelock example, the note storage holds three items: the
          target Account ID, which takes two, and the minimum block height
          before the Note can be consumed.
        </p>
        <p>
          Let's get started: click the{" "}
          <ButtonName icon={Plus}>Create new script</ButtonName> button, enter a
          name, then select the <strong>Note Script</strong> type and the{" "}
          <strong>P2ID Note</strong> example.
        </p>
        <p>
          The <strong>basic-wallet</strong> script that's already listed comes
          with this tutorial: the next step tells you what it's for.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create a new script."
          titleWhenCompleted="You created a P2ID note script."
          description={
            <p>
              Click the <ButtonName icon={Plus}>Create new script</ButtonName>{" "}
              button and create a new <strong>Note Script</strong> from the{" "}
              <strong>P2ID Note</strong> example.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step1;
