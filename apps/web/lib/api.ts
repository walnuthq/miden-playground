import type {
  Script,
  ScriptExample,
  CompiledPackage,
  ScriptType,
  PackageSource,
  Package,
} from "@/lib/types/script";
import { packageToScript } from "@/lib/utils/script";
import { isValidUUIDv4 } from "@/lib/utils";
import { API_URL, API_REGISTRY_URL } from "@/lib/constants";

export const createScript = async ({
  name,
  type,
  example,
  tutorialId,
}: {
  name: string;
  type: ScriptType;
  example: ScriptExample | "none";
  tutorialId: string;
}) => {
  const apiUrl = [
    "",
    "foreign-procedure-invocation",
    "your-first-smart-contract-and-custom-note",
    "contract-verification",
  ].includes(tutorialId)
    ? API_URL
    : "/api";
  const response = await fetch(`${apiUrl}/scripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, example }),
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { package: script } = result as {
    package: Pick<Script, "id" | "name" | "type" | "rust" | "dependencies">;
  };
  return { script };
};

export const compileScript = async (script: Script) => {
  const apiUrl = isValidUUIDv4(script.id) ? API_URL : "/api";
  const response = await fetch(`${apiUrl}/scripts/${script.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: script.name,
      rust: script.rust,
      dependencies: script.dependencies.map(({ id }) => id),
    }),
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { package: compiledScript } = result as { package: CompiledPackage };
  return { script: compiledScript };
};

export const deleteScript = async (scriptId: string) => {
  const apiUrl = isValidUUIDv4(scriptId) ? API_URL : "/api";
  const response = await fetch(`${apiUrl}/scripts/${scriptId}`, {
    method: "DELETE",
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const {
    package: { id },
  } = result as { package: { id: string } };
  return { script: { id } };
};

export const verifyAccountComponentFromSource = async ({
  networkId,
  accountId,
  packageSource,
}: {
  networkId: string;
  accountId: string;
  packageSource: PackageSource;
}) => {
  const response = await fetch(
    `${API_URL}/verified-account-components/${networkId}`,
    {
      method: "POST",
      body: JSON.stringify({
        accountId,
        packageSource,
      }),
    },
  );
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { verified } = result as { verified: boolean };
  return { verified };
};

export const verifyAccountComponentsFromPackageIds = async ({
  networkId,
  accountId,
  packageIds,
}: {
  networkId: string;
  accountId: string;
  packageIds: string[];
}) => {
  const response = await fetch(
    `${API_URL}/verified-account-components/${networkId}`,
    {
      method: "POST",
      body: JSON.stringify({ accountId, packageIds }),
    },
  );
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { verified } = result as { verified: boolean };
  return { verified };
};

export const getVerifiedAccountComponents = async ({
  networkId,
  code,
}: {
  networkId: string;
  code: string;
}): Promise<
  | { error: string; components?: undefined }
  | { components: Script[]; error?: undefined }
> => {
  const response = await fetch(
    `${API_REGISTRY_URL}/v1/${networkId}/verified-accounts/code/${code}`,
  );
  const result = await response.json();
  if (!response.ok) {
    const { error } = result as { error: string };
    return { error };
  }
  const { verifiedAccountComponents } = result as {
    verifiedAccountComponents: {
      package: Package;
    }[];
  };
  return {
    components: verifiedAccountComponents.map((verifiedAccountComponent) =>
      packageToScript(verifiedAccountComponent.package),
    ),
  };
};

export const verifyNoteFromSource = async ({
  networkId,
  noteId,
  packageSource,
  dependencies = [],
}: {
  networkId: string;
  noteId: string;
  packageSource: PackageSource;
  dependencies?: PackageSource[];
}) => {
  const response = await fetch(`${API_URL}/verified-notes/${networkId}`, {
    method: "POST",
    body: JSON.stringify({
      noteId,
      packageSource,
      dependencies,
    }),
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { verified } = result as { verified: boolean };
  return { verified };
};

export const verifyNoteFromPackageId = async ({
  networkId,
  noteId,
  packageId,
}: {
  networkId: string;
  noteId: string;
  packageId: string;
}) => {
  const response = await fetch(`${API_URL}/verified-notes/${networkId}`, {
    method: "POST",
    body: JSON.stringify({ noteId, packageId }),
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { verified } = result as { verified: boolean };
  return { verified };
};

export const getVerifiedNote = async ({
  networkId,
  script,
}: {
  networkId: string;
  script: string;
}): Promise<
  | { error: string; noteScript?: undefined }
  | { noteScript: Script; error?: undefined }
> => {
  const response = await fetch(
    `${API_REGISTRY_URL}/v1/${networkId}/verified-notes/script/${script}`,
  );
  const result = await response.json();
  if (!response.ok) {
    const { error } = result as { error: string };
    return { error };
  }
  const { package: noteScript } = result as {
    package: Package;
  };
  return { noteScript: packageToScript(noteScript) };
};

export const getScript = async (id: string) => {
  const response = await fetch(`${API_URL}/scripts/${id}`, {
    method: "GET",
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { package: script } = result as { package: Script };
  return { script };
};

export const exportScript = (id: string) => `${API_URL}/scripts/${id}/export`;

export const importScriptsFromPackageSources = async (
  packageSources: Record<string, PackageSource>,
) => {
  const response = await fetch(`${API_URL}/scripts/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageSources }),
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { packages } = result as { packages: CompiledPackage[] };
  return { scripts: packages };
};

export const importScriptsFromGithubRepo = async ({
  githubRepoUrl,
  projectDir,
}: {
  githubRepoUrl: string;
  projectDir?: string;
}) => {
  const response = await fetch(`${API_URL}/scripts/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ githubRepoUrl, projectDir }),
  });
  if (response.status === 500) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { packages } = result as { packages: CompiledPackage[] };
  return { scripts: packages };
};
