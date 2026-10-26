import ImportButton from "@/components/tutorials/contract-verification/import-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  return !!counter;
};

const Step4Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>But what happens when you import a contract that isn't verified?</p>
    <p>
      Let's find out: click the <em>"Import"</em> button below. It adds a
      counter contract built from the same script as yours to the Playground, as
      if it had been deployed by someone else: nobody has verified it yet.
    </p>
    <ImportButton />
    <p>
      Once the contract is imported,{" "}
      {counter ? (
        <TutorialLink href={`/accounts/${counter?.identifier}?tab=components`}>
          open its <em>"Components"</em> tab
        </TutorialLink>
      ) : (
        <>
          open its <em>"Components"</em> tab
        </>
      )}
      . The Playground recognizes standard components such as{" "}
      <strong>No Auth</strong> and <strong>Basic Wallet</strong>, but the
      counter procedures are missing:{" "}
      <em>"This account has no verified custom account components"</em>.
    </p>
    <p>
      The contract's code does contain these procedures, but they're only
      identified by their MAST roots. Without their names and signatures, the
      contract behaves like a black box: only applications that already know its
      interface can interact with it.
    </p>
    <p>
      <strong>So how can you verify this contract?</strong>
    </p>
    <p>
      You can verify its custom account components by uploading the source code
      that was used to build them.
    </p>
  </>
);

const Step4: TutorialStep = {
  title: "Import an unverified contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step4Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Import the unverified contract."
          titleWhenCompleted="You imported the unverified contract."
          description={
            <p>
              Click the <em>"Import"</em> button to import an unverified counter
              contract.
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

export default Step4;
