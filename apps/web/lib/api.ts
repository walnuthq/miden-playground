import {
  type Script,
  type ScriptExample,
  type Export,
  type Dependency,
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
  const result = await response.json();
  const { id, rust, dependencies } = result as {
    id: string;
    rust: string;
    dependencies: Dependency[];
  };
  return { id, rust, dependencies };
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
  const result = await response.json();
  const { ok, error, masm, digest, masp, exports, dependencies } = result as {
    ok: boolean;
    error: string;
    masm: string;
    digest: string;
    masp: string;
    exports: Export[];
    dependencies: Dependency[];
  };
  return {
    ok,
    error,
    masm,
    digest,
    masp,
    procedureExports: exports.map((manifestExport) => manifestExport.Procedure),
    dependencies,
  };
};

export const deleteScript = async (scriptId: string) => {
  const apiUrl = isValidUUIDv4(scriptId) ? API_URL : "/api";
  const response = await fetch(`${apiUrl}/scripts/${scriptId}`, {
    method: "DELETE",
  });
  const result = await response.json();
  const { id } = result as { id: string };
  return id;
};

export const verifyAccountComponentFromSource = async ({
  networkId,
  accountId,
  identifier,
  account,
  cargoToml,
  rust,
}: {
  networkId: string;
  accountId: string;
  identifier: string;
  account: string;
  cargoToml: string;
  rust: string;
}) => {
  const response = await fetch(
    `${API_URL}/verified-account-components/${networkId}`,
    {
      method: "POST",
      body: JSON.stringify({
        accountId,
        identifier,
        account,
        cargoToml,
        rust,
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
  packagesSources,
}: {
  networkId: string;
  noteId: string;
  note: string;
  packagesSources: PackageSource[];
}) => {
  const response = await fetch(`${API_URL}/verified-notes/${networkId}`, {
    method: "POST",
    body: JSON.stringify({
      noteId,
      note,
      packagesSources,
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
