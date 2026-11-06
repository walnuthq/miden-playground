import { useNavigate } from "react-router";
import { toast } from "sonner";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useAppState from "@/hooks/use-app-state";
import useComponents from "@/hooks/use-components";
import useNetwork from "@/hooks/use-network";
import { importExample } from "@/lib/api";
import examples from "@/lib/examples";
import { defaultComponentIds } from "@/lib/types/default-components";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import { compiledPackageToScript } from "@/lib/utils/script";
import { confirmWorkspaceSwitch } from "@/lib/utils/workspace-guard";

// A failed deploy's toast stays, as it's the way to try again, until the
// workspace it belongs to is left (NetworkBadge).
export const EXAMPLE_DEPLOY_FAILED_TOAST = "example-deploy-failed";

const useExamples = () => {
  const navigate = useNavigate();
  const { switchNetwork } = useNetwork();
  const { completedTutorials, exampleId } = useGlobalContext();
  const { leaveTutorial, pushState } = useAppState();
  const { deployAccount } = useAccounts();
  const { components } = useComponents();
  const launchExample = async (
    exampleId: string,
  ): Promise<{ error?: string; cancelled?: boolean }> => {
    const example = examples.find(({ id }) => id === exampleId);
    if (!example) {
      return { error: "Example not found." };
    }
    if (!(await confirmWorkspaceSwitch())) {
      return { cancelled: true };
    }
    const { scripts, error } = await importExample(example.id).catch(
      (error: unknown) => ({
        scripts: undefined,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    if (!scripts) {
      return { error: error ?? "Scripts couldn't be imported." };
    }
    const failedScript = scripts.find(({ status }) => status === "error");
    if (failedScript) {
      return { error: `${failedScript.name}: ${failedScript.error}` };
    }
    const tutorialProgress = await leaveTutorial();
    switchNetwork("mtst");
    pushState({
      ...example.state,
      scripts: [
        ...example.state.scripts,
        ...scripts.map((compiledScript) =>
          compiledPackageToScript(compiledScript),
        ),
      ],
      components: example.state.components.map((component) => {
        if (defaultComponentIds.includes(component.id)) {
          return component;
        }
        const script = scripts.find(({ name }) => name === component.id);
        return {
          ...component,
          scriptId: script?.id ?? "",
        };
      }),
      completedTutorials,
      tutorialProgress,
    });
    navigate("/accounts");
    toast.info(`${example.title} example loaded.`, {
      description:
        "We're deploying an account for you to play with. It will show up here in a moment.",
    });
    return {};
  };
  // Deploys the example's account, and tells whether it did. `abandoned` tells
  // the workspace was left meanwhile: the account is gone with its store,
  // nothing to report. `retry` is offered when the deploy fails.
  const loadExample = async (
    exampleId: string,
    abandoned: () => boolean,
    retry: () => void,
  ) => {
    const component = components.find(({ id }) => id === exampleId);
    if (!component) {
      return false;
    }
    try {
      await deployAccount({
        name: component.name,
        storageMode: "public",
        components: [authNoAuth, component],
      });
      if (!abandoned()) {
        toast.success(`${component.name} deployed.`);
      }
      return true;
    } catch (error) {
      if (abandoned()) {
        console.warn(`${component.name}: deploy abandoned`, error);
        return false;
      }
      toast.error(`${component.name} couldn't be deployed.`, {
        description: error instanceof Error ? error.message : String(error),
        id: EXAMPLE_DEPLOY_FAILED_TOAST,
        duration: Number.POSITIVE_INFINITY,
        closeButton: true,
        action: { label: "Retry", onClick: retry },
      });
      return false;
    }
  };
  return {
    exampleId,
    example: examples.find(({ id }) => id === exampleId),
    launchExample,
    loadExample,
  };
};

export default useExamples;
