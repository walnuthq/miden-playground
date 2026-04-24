import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import useAppState from "@/hooks/use-app-state";
import { importScriptsFromGithubRepo } from "@/lib/api";
import { compiledPackageToScript } from "@/lib/utils/script";
import { defaultComponentIds } from "@/lib/types/default-components";
import useAccounts from "@/hooks/use-accounts";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import useComponents from "@/hooks/use-components";
import useNetwork from "@/hooks/use-network";
import examples from "@/lib/examples";

const useExamples = () => {
  const router = useRouter();
  const { switchNetwork } = useNetwork();
  const { completedTutorials, exampleId } = useGlobalContext();
  const { pushState } = useAppState();
  const { deployAccount } = useAccounts();
  const { components } = useComponents();
  const launchExample = async (exampleId: string) => {
    const example = examples.find(({ id }) => id === exampleId);
    if (!example) {
      return;
    }
    const { scripts } = await importScriptsFromGithubRepo({
      githubRepoUrl: example.githubRepoUrl,
      projectDir: example.projectDir,
    });
    if (!scripts) {
      return;
    }
    switchNetwork("mtst");
    pushState({
      ...example.state,
      scripts: [
        ...example.state.scripts,
        ...scripts.map((compiledScript) => {
          const script = compiledPackageToScript(compiledScript);
          return {
            ...script,
            procedureExports:
              script.name === example.id
                ? example.procedureExports
                : script.procedureExports,
          };
        }),
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
  };
  const loadExample = async (exampleId: string) => {
    const component = components.find(({ id }) => id === exampleId);
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
  return {
    exampleId,
    example: examples.find(({ id }) => id === exampleId),
    launchExample,
    loadExample,
  };
};

export default useExamples;
