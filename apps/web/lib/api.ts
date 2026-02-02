import {
  type Script,
  type ScriptExample,
  type Export,
  type Dependency,
  type ScriptType,
} from "@/lib/types/script";

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
    ? process.env.NEXT_PUBLIC_API_URL
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
  const isExample =
    script.id.startsWith("counter-contract") ||
    script.id.startsWith("p2id-note");
  const apiUrl = isExample ? "/api" : process.env.NEXT_PUBLIC_API_URL;
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
    exports,
    dependencies,
  };
};

export const deleteScript = async (scriptId: string) => {
  const isExample =
    scriptId.startsWith("counter-contract") || scriptId.startsWith("p2id-note");
  const apiUrl = isExample ? "/api" : process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/scripts/${scriptId}`, {
    method: "DELETE",
  });
  const result = await response.json();
  const { id } = result as { id: string };
  return id;
};

export const verifyAccountComponentsFromPackageIds = async ({
  accountId,
  identifier,
  account,
  packageIds,
}: {
  accountId: string;
  identifier: string;
  account: string;
  packageIds: string[];
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/verified-account-components`, {
    method: "POST",
    body: JSON.stringify({ accountId, identifier, account, packageIds }),
  });
  const result = await response.json();
  const { ok, error } = result as { ok: boolean; error?: string };
  return { verified: ok, error };
};

export const getVerifiedAccountComponents = async (identifier: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(
    `${apiUrl}/verified-account-components/${identifier}`,
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
    exports: component.exports.map((procedureExport) => ({
      ...procedureExport,
      readOnly: procedureExport.name.startsWith("get"),
    })),
  }));
};

export const verifyNoteFromSource = async ({
  noteId,
  note,
  cargoToml,
  rust,
}: {
  noteId: string;
  note: string;
  cargoToml: string;
  rust: string;
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/verified-notes`, {
    method: "POST",
    body: JSON.stringify({
      noteId,
      note,
      cargoToml,
      rust,
    }),
  });
  const result = await response.json();
  const { ok, error } = result as { ok: boolean; error?: string };
  return { verified: ok, error };
};

export const verifyNoteFromPackageId = async ({
  noteId,
  note,
  packageId,
}: {
  noteId: string;
  note: string;
  packageId: string;
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/verified-notes`, {
    method: "POST",
    body: JSON.stringify({ noteId, note, packageId }),
  });
  const result = await response.json();
  const { ok, error } = result as { ok: boolean; error?: string };
  return { verified: ok, error };
};

export const getVerifiedNote = async (noteId: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/verified-notes/${noteId}`, {
    method: "GET",
  });
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/scripts/${id}`, {
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

export const exportScript = (id: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  return `${apiUrl}/scripts/${id}/export`;
};
