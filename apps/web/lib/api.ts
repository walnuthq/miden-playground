import { API_REGISTRY_URL, API_URL } from "@/lib/constants";
import { mockCompileScript, mockCreateScript } from "@/lib/mock-api";
import type {
  CompiledPackage,
  Package,
  PackageSource,
  Script,
  ScriptExample,
  ScriptType,
} from "@/lib/types/script";
import { isValidUUIDv4, toBase64 } from "@/lib/utils";
import { packageToScript } from "@/lib/utils/script";

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
  if (
    ![
      "",
      "foreign-procedure-invocation",
      "your-first-smart-contract-and-custom-note",
      "contract-verification",
    ].includes(tutorialId)
  ) {
    return { script: await mockCreateScript({ name, type, example }) };
  }
  const response = await fetch(`${API_URL}/scripts`, {
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
  if (!isValidUUIDv4(script.id)) {
    try {
      return { script: await mockCompileScript(script) };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
  const response = await fetch(`${API_URL}/scripts/${script.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: script.name,
      rust: script.rust,
      dependencies: script.dependencies.map(({ id }) => id),
    }),
  });
  if (!response.ok) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { package: compiledScript } = result as { package: CompiledPackage };
  return { script: compiledScript };
};

export const deleteScript = async (scriptId: string) => {
  const response = await fetch(`${API_URL}/scripts/${scriptId}`, {
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
  if (!response.ok) {
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
  if (!response.ok) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { verified } = result as { verified: boolean };
  return { verified };
};

// The registry serves compiled packages apart from their metadata, as
// `<commitment>.masp` artifacts.
const registryPackageToScript = async ({
  networkId,
  registryPackage,
}: {
  networkId: string;
  registryPackage: Omit<Package, "masp">;
}) => {
  const response = await fetch(
    `${API_REGISTRY_URL}/v1/${networkId}/packages/masp/${registryPackage.commitment}.masp`,
  );
  if (!response.ok) {
    throw new Error(`Package ${registryPackage.commitment} masp not found.`);
  }
  const masp = toBase64(new Uint8Array(await response.arrayBuffer()));
  return packageToScript({ ...registryPackage, masp });
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
      package: Omit<Package, "masp">;
    }[];
  };
  return {
    components: await Promise.all(
      verifiedAccountComponents.map((verifiedAccountComponent) =>
        registryPackageToScript({
          networkId,
          registryPackage: verifiedAccountComponent.package,
        }),
      ),
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
  if (!response.ok) {
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
  if (!response.ok) {
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
    package: Omit<Package, "masp">;
  };
  return {
    noteScript: await registryPackageToScript({
      networkId,
      registryPackage: noteScript,
    }),
  };
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
  if (!response.ok) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { packages } = result as { packages: CompiledPackage[] };
  return { scripts: packages };
};

export const importScriptsFromGithubRepo = async ({
  githubRepoUrl,
  githubRepoRef,
  projectDir,
}: {
  githubRepoUrl: string;
  githubRepoRef?: string;
  projectDir?: string;
}) => {
  const response = await fetch(`${API_URL}/scripts/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ githubRepoUrl, ref: githubRepoRef, projectDir }),
  });
  if (!response.ok) {
    return { error: await response.text() };
  }
  const result = await response.json();
  const { packages } = result as { packages: CompiledPackage[] };
  return { scripts: packages };
};
