import { useLocation } from "react-router";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useComponents from "@/hooks/use-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { pathname } = useLocation();
  const { components } = useComponents();
  const component = components.find(
    ({ type, scriptId }) =>
      type === "account-component" && scriptId.startsWith("counter-account_"),
  );
  return pathname === `/components/${component?.id}`;
};

const Step3: TutorialStep = {
  title: "Create an account component.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
            Account components
          </ExternalLink>{" "}
          are reusable building blocks that define part of an Account's{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
            code
          </ExternalLink>{" "}
          and{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/storage">
            storage
          </ExternalLink>
          . Several account components are combined to build an Account.
        </p>
        <p>
          For example, a wallet account, capable of holding assets and requiring
          authentication to move them, can be built by combining a{" "}
          <strong>BasicWallet</strong> component with a{" "}
          <strong>Falcon512Poseidon2</strong> authentication component. The{" "}
          <strong>BasicWallet</strong> component contains the code to move
          assets in and out of the account vault. The authentication component
          stores the user's public key and contains the code to verify
          signatures against it.
        </p>
        <p>
          Your counter contract will be an Account built from your own account
          component, which contains the counter code, and an authentication
          component.
        </p>
        <p>
          Head to the{" "}
          <TutorialLink href="/components">components page</TutorialLink> and
          click the <em>"Create new component"</em> button. Enter a name, select
          the <strong>Account Component</strong> type and select the script you
          created in the first step.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create an account component."
          titleWhenCompleted="You created an account component."
          description={
            <p>
              Click the <em>"Create new component"</em> button and create an{" "}
              <strong>Account Component</strong> from the script you created in
              the first step.
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

export default Step3;
