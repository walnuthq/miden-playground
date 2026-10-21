import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useAppState from "@/hooks/use-app-state";
import useComponents from "@/hooks/use-components";
import useNetwork from "@/hooks/use-network";
import { importScriptsFromGithubRepo } from "@/lib/api";
import examples from "@/lib/examples";
import { defaultComponentIds } from "@/lib/types/default-components";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import { compiledPackageToScript } from "@/lib/utils/script";

const useExamples = () => {
  const router = useRouter();
  const { switchNetwork } = useNetwork();
  const { completedTutorials, exampleId } = useGlobalContext();
  const { pushState } = useAppState();
  const { deployAccount } = useAccounts();
  const { components } = useComponents();
  const launchExample = async (
    exampleId: string,
  ): Promise<{ error?: string }> => {
    const example = examples.find(({ id }) => id === exampleId);
    if (!example) {
      return { error: "Example not found." };
    }
    const { scripts, error } = await importScriptsFromGithubRepo({
      githubRepoUrl: example.githubRepoUrl,
      githubRepoRef: example.githubRepoRef,
      projectDir: example.projectDir,
    }).catch((error: unknown) => ({
      scripts: undefined,
      error: error instanceof Error ? error.message : String(error),
    }));
    if (!scripts) {
      return { error: error ?? "Scripts couldn't be imported." };
    }
    const failedScript = scripts.find(({ status }) => status === "error");
    if (failedScript) {
      return { error: `${failedScript.name}: ${failedScript.error}` };
    }
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
    });
    router.push("/accounts");
    toast.info(`${example.title} example loaded.`, {
      description:
        "We're deploying an account for you to play with. It will show up here in a moment.",
    });
    return {};
  };
  const loadExample = async (exampleId: string) => {
    const component = components.find(({ id }) => id === exampleId);
    if (!component) {
      return;
    }
    try {
      await deployAccount({
        name: component.name,
        storageMode: "public",
        components: [authNoAuth, component],
      });
      toast.success(`${component.name} deployed.`);
    } catch (error) {
      toast.error(`${component.name} couldn't be deployed.`, {
        description: error instanceof Error ? error.message : String(error),
      });
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
