import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import { type Example } from "@/lib/types/example";
import useAppState from "@/hooks/use-app-state";
import { importScriptsFromGithubRepo } from "@/lib/api";
import { compiledPackageToScript } from "@/lib/types/script";
import { defaultComponentIds } from "@/lib/types/default-components";
import useAccounts from "@/hooks/use-accounts";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import useComponents from "@/hooks/use-components";

const useExamples = () => {
  const router = useRouter();
  const { blockNum, completedTutorials, exampleId } = useGlobalContext();
  const { pushState } = useAppState();
  const { deployAccount } = useAccounts();
  const { components } = useComponents();
  const launchExample = async (example: Example) => {
    const { scripts } = await importScriptsFromGithubRepo({
      githubRepoUrl: example.githubRepoUrl,
      projectDir: example.projectDir,
    });
    if (!scripts) {
      return;
    }
    pushState({
      ...example.state,
      scripts: [
        ...example.state.scripts,
        ...scripts.map((compiledScript) => ({
          ...compiledPackageToScript(compiledScript),
          procedureExports: example.procedureExports,
        })),
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
      blockNum,
      completedTutorials,
    });
  };
  const loadExample = async (example: Example) => {
    const component = components.find(({ id }) => id === example.id);
    if (!component) {
      return;
    }
    await deployAccount({
      name: component.name,
      accountType: "regular-account-immutable-code",
      storageMode: "public",
      components: [authNoAuth, component],
    });
    router.push("/accounts");
  };
  return { exampleId, launchExample, loadExample };
};

export default useExamples;
