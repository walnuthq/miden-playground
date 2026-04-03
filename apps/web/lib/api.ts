import {
  type Script,
  type ScriptExample,
  type CompiledPackage,
  type ScriptType,
  type PackageSource,
} from "@/lib/types/script";
import { formatProcedureExportPath, isValidUUIDv4 } from "@/lib/utils";
import { API_URL } from "@/lib/constants";

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
  identifier,
  account,
  packageSource,
}: {
  networkId: string;
  accountId: string;
  identifier: string;
  account: string;
  packageSource: PackageSource;
}) => {
  const response = await fetch(
    `${API_URL}/verified-account-components/${networkId}`,
    {
      method: "POST",
      body: JSON.stringify({
        accountId,
        identifier,
        account,
        packageSource,
      }),
    },
  );
  const result = await response.json();
  const { ok, verified, error } = result as
    | {
        ok: true;
        verified: boolean;
        error: undefined;
      }
    | {
        ok: false;
        verified: undefined;
        error: string;
      };
  if (!ok) {
    console.error(error);
    return { verified: false, error };
  }
  return { verified };
};

export const verifyAccountComponentsFromPackageIds = async ({
  networkId,
  accountId,
  identifier,
  account,
  packageIds,
}: {
  networkId: string;
  accountId: string;
  identifier: string;
  account: string;
  packageIds: string[];
}) => {
  const response = await fetch(
    `${API_URL}/verified-account-components/${networkId}`,
    {
      method: "POST",
      body: JSON.stringify({ accountId, identifier, account, packageIds }),
    },
  );
  const result = await response.json();
  const { ok, verified, error } = result as
    | {
        ok: true;
        verified: boolean;
        error: undefined;
      }
    | {
        ok: false;
        verified: undefined;
        error: string;
      };
  if (!ok) {
    console.error(error);
    return { verified: false, error };
  }
  return { verified };
};

export const getVerifiedAccountComponents = async ({
  networkId,
  identifier,
}: {
  networkId: string;
  identifier: string;
}) => {
  const response = await fetch(
    `${API_URL}/verified-account-components/${networkId}/${identifier}`,
    {
      method: "GET",
    },
  );
  const result = await response.json();
  const { ok, components, error } = result as
    | {
        ok: true;
        components: Script[];
        error: undefined;
      }
    | {
        ok: false;
        components: undefined;
        error: string;
      };
  if (!ok) {
    console.error(error);
    return [];
  }
  return components.map((component) => ({
    ...component,
    procedureExports: component.procedureExports.map((procedureExport) => ({
      ...procedureExport,
      readOnly: formatProcedureExportPath(procedureExport.path).startsWith(
        "get",
      ),
    })),
  }));
};

export const verifyNoteFromSource = async ({
  networkId,
  noteId,
  note,
  packageSource,
  dependencies = [],
}: {
  networkId: string;
  noteId: string;
  note: string;
  packageSource: PackageSource;
  dependencies?: PackageSource[];
}) => {
  const response = await fetch(`${API_URL}/verified-notes/${networkId}`, {
    method: "POST",
    body: JSON.stringify({
      noteId,
      note,
      packageSource,
      dependencies,
    }),
  });
  const result = await response.json();
  const { ok, verified, error } = result as
    | {
        ok: true;
        verified: boolean;
        error: undefined;
      }
    | {
        ok: false;
        verified: undefined;
        error: string;
      };
  if (!ok) {
    console.error(error);
    return { verified: false, error };
  }
  return { verified };
};

export const verifyNoteFromPackageId = async ({
  networkId,
  noteId,
  note,
  packageId,
}: {
  networkId: string;
  noteId: string;
  note: string;
  packageId: string;
}) => {
  const response = await fetch(`${API_URL}/verified-notes/${networkId}`, {
    method: "POST",
    body: JSON.stringify({ noteId, note, packageId }),
  });
  const result = await response.json();
  const { ok, verified, error } = result as
    | {
        ok: true;
        verified: boolean;
        error: undefined;
      }
    | {
        ok: false;
        verified: undefined;
        error: string;
      };
  if (!ok) {
    console.error(error);
    return { verified: false, error };
  }
  return { verified };
};

export const getVerifiedNote = async ({
  networkId,
  noteId,
}: {
  networkId: string;
  noteId: string;
}) => {
  const response = await fetch(
    `${API_URL}/verified-notes/${networkId}/${noteId}`,
    {
      method: "GET",
    },
  );
  const result = await response.json();
  const { ok, noteScript, error } = result as
    | {
        ok: true;
        noteScript: Script | null;
        error: undefined;
      }
    | {
        ok: false;
        noteScript: undefined;
        error: string;
      };
  if (!ok) {
    console.error(error);
    return null;
  }
  return noteScript;
};

export const getScript = async (id: string) => {
  const response = await fetch(`${API_URL}/scripts/${id}`, {
    method: "GET",
  });
  const result = await response.json();
  const { ok, script } = result as
    | {
        ok: true;
        script: Script;
      }
    | {
        ok: false;
        script: undefined;
      };
  if (!ok) {
    return null;
  }
  return script;
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
