import { useState } from "react";
import { useInterval } from "usehooks-ts";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { getVerifiedAccountComponents } from "@/lib/api";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const [completed, setCompleted] = useState(false);
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  useInterval(
    () => {
      const checkVerifiedAccountComponents = async () => {
        const { components: verifiedAccountComponents = [] } =
          await getVerifiedAccountComponents({
            networkId,
            code: counter?.code ?? "",
          });
        setCompleted(verifiedAccountComponents.length > 0);
      };
      checkVerifiedAccountComponents();
    },
    completed ? null : 5000,
  );
  return completed;
};

const Step6Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>
      Head back to the{" "}
      <TutorialLink href={`/accounts/${counter?.identifier}?tab=components`}>
        imported contract's <em>"Components"</em> tab
      </TutorialLink>{" "}
      and click the <em>"Verify account component"</em> button. In the{" "}
      <em>"Verify Account Component"</em> dialog, select the folder you
      extracted in the previous step as the project directory, then click the{" "}
      <em>"Verify"</em> button.
    </p>
    <p>
      This can take a minute or two: the verification service recompiles the
      source code and checks that every procedure it exports is part of the
      imported contract's{" "}
      <ExternalLink href="https://docs.miden.xyz/builder/glossary/#accountcode">
        code
      </ExternalLink>
      , by comparing their MAST roots.
    </p>
    <p>
      If they match, the verification succeeds and the verified{" "}
      <ExternalLink href="https://docs.miden.xyz/builder/glossary/#accountcomponent">
        account component
      </ExternalLink>{" "}
      is listed under <em>"Account Components"</em>, with its procedures and a
      link to its source code.
    </p>
    <p>
      Verification applies to the contract's code rather than to a single
      Account: any Account deployed with the same code is now verified too.
      That's why your script name has a random suffix: without it, everyone
      running this tutorial would deploy the same code, and the contract would
      already be verified by the time you import it.
    </p>
  </>
);

const Step6: TutorialStep = {
  title: "Verify the imported contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step6Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Verify the imported contract."
          titleWhenCompleted="You verified the imported contract."
          description={
            <p>
              On the imported contract's <em>"Components"</em> tab, click the{" "}
              <em>"Verify account component"</em> button and upload the folder
              you extracted from the exported script.
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

export default Step6;
