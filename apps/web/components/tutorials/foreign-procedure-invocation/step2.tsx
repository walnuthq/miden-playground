import { usePathname } from "next/navigation";
import NextStepButton from "@/components/tutorials/next-step-button";
import { BulletList } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  return pathname === "/scripts/count-reader";
};

const Step2: TutorialStep = {
  title: "Open the Count Reader script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <img
          className="max-h-96 object-contain"
          src="/img/count-copy-fpi-diagram.png"
          alt="Count Reader FPI diagram"
          width={1100}
          height={744}
          loading="lazy"
        />
        <p>
          The diagram above shows the <strong>Count Reader</strong> smart
          contract using FPI to read the count of a counter contract. After
          reading it, the <strong>Count Reader</strong> writes the value
          returned by the counter contract to its own storage.
        </p>
        <p>What you'll cover:</p>
        <BulletList>
          <li>
            Using <strong>foreign procedure invocation</strong> (FPI) with the
            Playground.
          </li>
          <li>
            Deploying a <strong>Count Reader</strong> smart contract.
          </li>
          <li>
            Executing <strong>cross-contract calls</strong> in the browser.
          </li>
        </BulletList>
        <p>
          Let's start by reading the code of the{" "}
          <TutorialLink href="/scripts/count-reader">
            count-reader script
          </TutorialLink>{" "}
          to understand how the <strong>Count Reader</strong> contract works.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Open the Count Reader script."
          titleWhenCompleted="You opened the Count Reader script."
          description={
            <p>
              Click the <em>"count-reader"</em> row in the scripts table to open
              the script.
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

export default Step2;
